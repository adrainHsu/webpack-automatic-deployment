const { NodeSSH } = require("node-ssh");
const _console = require("console-color-mr");
import { makeMulti, strLog } from "./stringLog";
import {ConfigOptions,TypeCompilation,TypeCompiler } from "./types";

class WebpackAutomaticDeployment {
  options: ConfigOptions;
  ssh: any;
  constructor(options: ConfigOptions) {
    this.ssh = new NodeSSH();
    this.options = options;
  }
  apply(compiler: TypeCompiler) {
    // console.log("AutoUploadWebpackPlugin");
    _console.debug(makeMulti(strLog));
    // 完成的事件：注册hooks的监听事件
    // 等到assets已经输出到output目录上时，完成自动上传的功能
    compiler.hooks.afterEmit.tapAsync(
      "AutoPlugin",
      async (compilation: TypeCompilation, callback: () => void) => {
        if (process.env.NODE_ENV !== "production") {
          callback();
          return;
        }
        // 1.获取输出文件夹路径(其中资源)
        const outputPath = compilation.outputOptions.path;
        _console.info(
          "==================== automatic-deployment start ===================="
        );
        _console.log("===============");
        _console.log("开始连接服务器~");
        _console.log("===============");
        // 2.连接远程服务器 SSH
        try {
          await this.connectServer();
          _console.info(
            "--------------------       连接服务器成功       --------------------"
          );
          // 3.删除文件夹原来的内容
          let remotePath = this.options.remotePath;
          const isRemotePathSlash = remotePath.endsWith("/");
          remotePath = isRemotePathSlash ? remotePath : remotePath + "/";
          const execCommandResult = await this.ssh.execCommand(
            `rm -rf ${remotePath}*`
          );
          // 3.2判断是否账号是否有权限删除和上传文件
          if (execCommandResult.code === 0) {
            // 3.3 当有权限时
            // 4.将文件夹中资源上传到服务器
            _console.log("===============");
            _console.log("资源上传进行中~");
            _console.log("===============");
            await this.uploadFiles(outputPath, remotePath);
          }
          if (execCommandResult.code === 1) {
            // 3.3 当没有权限时
            _console.error("自动化布署失败");
            _console.error(
              `您的账户 ${this.options.username} 没有删除文件的权限，请添加权限或更换为root账户`
            );
            _console.error(execCommandResult.stderr);
            _console.info(
              "====================  automatic-deployment end  ===================="
            );
          }
          // 5.关闭ssh连接
          this.ssh.dispose();

          // 完成所有操作后调用 callback()
          callback();
        } catch (err) {
          _console.error("服务器连接错误，请检配置参数是否正确");
          _console.info(
            "====================  automatic-deployment end  ===================="
          );
          callback();
        }
      }
    );
  }

  async connectServer() {
    await this.ssh.connect({
      host: this.options.host,
      username: this.options.username,
      password: this.options.password,
    });
  }

  async uploadFiles(localPath: string, remotePath: string) {
    const status = await this.ssh.putDirectory(localPath, remotePath, {
      recursive: true, //递归上传
      concurrency: 10, //并发上传
    });
    if (status) {
      _console.info(
        "--------------------       自动化布署成功       --------------------"
      );
      _console.info(
        "====================  automatic-deployment end  ===================="
      );
    }
  }
}

module.exports = WebpackAutomaticDeployment;
module.exports.WebpackAutomaticDeployment = WebpackAutomaticDeployment;