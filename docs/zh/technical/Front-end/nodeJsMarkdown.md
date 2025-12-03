# 配置安装Node.js

## 一、node安装

本教程node版本：16.16.0

下载链接：https://nodejs.org/download/release/v16.16.0/?spm=wolai.workspace.0.0.3b58767bSp6sUQ

1. node安装和测试：

打开官网下载对应操作系统的LTS版本。(16.16.0)

进入链接下载node-v16.16.0-x64.msi

双击安装包进行安装，安装过程中遵循默认选项即可。安装完成后，可以在命令行终端输入`node -v` 和 `npm -v` 查看 Node.js 和 npm 的版本号。

2. npm使用(maven)

> NPM全称Node Package Manager，是Node.js包管理工具，是全球最大的模块生态系统，里面所有的模块都是开源免费的；也是Node.js的包管理工具，相当于后端的Maven 。

a. 配置阿里镜像

```
npm config set registry https://registry.npmjs.org/
```

b. 更新npm版本
> node16.16.0对应的npm版本过低！需要升级！

```
npm install -g npm@9.6.6
```

c. npm依赖下载命令

```
npm install 依赖名 / npm install 依赖名@版本
```

到这里，Node.js就已经安装配置好啦~