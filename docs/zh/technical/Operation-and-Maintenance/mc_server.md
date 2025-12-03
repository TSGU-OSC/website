# Minecraft多人服务器搭建

笔者以Linux服务器为例进行构建

### 准备工作
下载指定版本的服务端，如[1.17.1](https://mcversions.net/download/1.17.1)

具体网址如 `https://mcversions.net/download/1.17.1` 
将网址末端`1.17.1`替换为你需要的版本

将`server.jar`文件上传至服务器可以使用`sftp`命令

建议单独放置在一个文件夹`minecraft_server`

需要在服务器上安装java
```
sudo apt install openjdk
```

### 配置服务端文件
在`minecraft_server`目录下，运行以下命令
```
java -Xmx2G -Xms1G -jar server.jar nogui
```
然后编辑eula.txt，令 `eula=false` 改成 `eula=true` 
```
vim eula.txt
```
关于服务器详细的设置，可编辑`server.properties`，如果没有正版的minecraft账号，需要把`online=true`改为`online=false`，即可绕过正版验证
```
vim server.properties
```

### 运行及进入游戏

在服务器的`minecraft_server`目录下运行服务端
```
java -Xmx2G -Xms1G -jar server.jar nogui
```
等待加载完后 即可在客户端（想要加入的玩家电脑）即可在多人游戏里添加服务器，输入服务器的ip加上端口号25565，如：`192.168.13.128:25565`
