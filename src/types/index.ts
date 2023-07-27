export interface ConfigOptions {
  host: string
  username: string
  password: string
  remotePath: string
}
export interface TypeCompilation{
  outputOptions:{
    path: string
  }
}
export interface TypeCompiler{
  hooks: any
}