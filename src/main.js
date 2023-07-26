const { NodeSSH } = require('node-ssh')

class AutoUploadWebpackPlugin{
  constructor(options){
    this.ssh = new NodeSSH()
    this.options = options
  }
  apply(compiler){
    // console.log("AutoUploadWebpackPlugin");
    // 完成的事件：注册hooks的监听事件
    // 等到assets已经输出到output目录上时，完成自动上传的功能
    compiler.hooks.afterEmit.tapAsync('AutoPlugin', async (compilation,callback)=>{
      // 1.获取输出文件夹路径(其中资源)
      const outputPath = compilation.outputOptions.path
      console.log(outputPath);
      console.log("=============");

      // 2.连接远程服务器 SSH
      await this.connectServer()
      // 3.删除文件夹原来的内容
      let remotePath = this.options.remotePath
      const isRemotePathSlash = remotePath.endsWith('/')
      remotePath = isRemotePathSlash ? remotePath : remotePath+'/'
      
      this.ssh.execCommand(`rm -rf ${remotePath}*`)
      // 4.将文件夹中资源上传到服务器
      await this.uploadFiles(outputPath, remotePath)

      // 5.关闭ssh连接
      this.ssh.dispose()

      // 完成所有操作后调用 callback()
      callback()
    })
  }

  async connectServer(){
    await this.ssh.connect({
      host: this.options.host,
      username: this.options.username,
      password: this.options.password
    })
  }

  async uploadFiles(localPath, remotePath){
    const status = await this.ssh.putDirectory(localPath, remotePath, {
      recursive: true, //递归上传
      concurrency: 10 //并发上传
    })
    if(status){
      console.log("文件上传服务器成功了~");
    }
  }
}

module.exports = AutoUploadWebpackPlugin
module.exports.AutoUploadWebpackPlugin = AutoUploadWebpackPlugin