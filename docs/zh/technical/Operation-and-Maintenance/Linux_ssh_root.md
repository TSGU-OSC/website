# Linux ssh 设置root登录

首先需要给root用户设置密码

```
sudo passwd root
```

修改配置文件
```
vim /etc/ssh/sshd_config
```
在/etc/ssh/sshd_config做以下修改

- PermitRootLogin no修改为PermitRootLogin yes

重启ssh服务，使其修改生效
```
service sshd restart
```