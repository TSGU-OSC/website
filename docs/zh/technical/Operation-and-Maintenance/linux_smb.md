# smb连接Linux相关配置（文件服务器）

## 前言
当我们有多台设备的时候，文件互传是刚需，而smb协议就可以跨平台的进行文件传输，支持Windows，Macos，Linux系统，即使是很多文件服务器，Nas等等比较专业的需求，smb也是够用的，接下来笔者就为大家介绍如何实现这一效果。
* PS：笔者PC端为Linux，用Macbook通过smb来连接PC上的Linux为本次案例的背景

## 操作

### 配置smb
由于我们要连接PC端的Linux，因此需要在Linux上安装smb服务
```
sudo apt install samba
```
输入以下命令启动服务
```
sudo systemctl enable smbd.service
sudo systemctl enable nmbd.service
sudo systemctl start smbd.service
sudo systemctl start nmbd.service
```
然后输入以下命令检查服务是否启动
```
sudo systemctl status smbd nmbd
```
此时我们最好配置一下smb连接的用户名和密码 输入以下指令
```
sudo smbpasswd -a <username>
```
然后进入`smb.conf`配置一些基本信息（比如共享的文件路径，可读性设置等等）
```
sudo vim /etc/samba/smb.conf
```
按照个人需求修改smb.conf的内容
```
[sharename]
   path = /
   browsable = yes
   read only = no
   guest ok = yes
```
* `[sharename]`是smb上显示的总文件夹名称
*  `path`后面改为需要共享的路径
* `browsable`指是否可以阅览
* `read only`指是否选择只读模式，yes的话，就不能往服务器上写文件了
* `guest ok`指是否可以允许游客查看（无用户名密码）
修改完后记得重启下服务
```
sudo systemctl restart smbd
```
此时就大功告成了，已经成功可以在Mac上通过smb连接PC的Linux了。
### 访问多硬盘
一般文件服务器上都是有很多硬盘的，如何也读取到这些非启动盘呢。

首先需要获取所有硬盘的UUID
```
lsblk -f
```
然后配置`/etc/fstab` 把所有硬盘的都按照以下格式写入配置文件
```
UUID=38957d59 /mnt/disk1 auto nosuid,nodev,nofail 0 0
```
需要注意的是 如果你要添加一个硬盘到mnt路径，比如`/mnt/disk1`那么你应该先创建一个这样的目录
```
sudo mkdir /mnt/disk1
```
全部添加完之后，输入以下指令刷新一下
```
sudo mount -a
```
重启smb服务
```
sudo systemctl restart smbd nmbd
```
这时你就可以在对应的`/mnt`路径下查看你其他硬盘的内容了
## 总结
本文虽然以mac和linux之间的互联为例，但其他系统之间互连也是一样的道理，而且要简单的多（Macos和Windows都预装过smb组件，不需要像本文一样配置那么多东西）

