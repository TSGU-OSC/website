# Linux grub启动内核（ubuntu断电强制关机后无法启动）

### 前言
ubuntu强制关机可能会触发系统保护机制导致需要手动grub

### 查看Linux系统所在分区

使用`ls`命令查看可用的分区和文件
```
ls 
ls (hd0,gpt1)
```
逐个查看分区并找出输出带有`ext*`字样的分区（Linux文件系统分区）

* 笔者的ubuntu boot分区在(hd1,gpt6) 根目录分区在(hd1,gpt8) 


### 手动boot内核

确定boot所在分区后 输入以下命令（具体分区要与自己电脑上一致）
```
set root=(hd1,gpt6)
```
将以下命令修改为自己电脑上对应的内核版本号和分区 可用`TAB`键补全 其中
```
linux /vmlinuz-x.x.x-generic root=/dev/sdXY ro
initrd /initrd.img-x.x.x-generic
```
比如笔者输入的命令如下 `root=/dev/sdXY` 要替换为ubuntu根目录分区
```
linux /vmlinuz-6.2.0-26-generic root=/dev/sda8 ro
initrd /initrd.img-6.2.0-26-generic
```
输入以下命令boot内核
```
boot
```

### 重新安装grub

进入系统后 执行以下命令
```
sudo grub-install /dev/sda
```
这将在硬盘上的适当位置安装 GRUB 引导加载程序

### 结语

尽量少断电关机 尽管如今都有文件保护系统 但仍有可能出现各种问题

