# Q：为什么ssh连接远程服务器 过一段时间不操作 就自动挂断了
## A：
## 前言
* 当你的SSH连接在一段时间内没有活动时，它可能会因为超时而自动断开连接。这是出于安全性和资源管理的考虑。

* SSH服务器通常配置了会话超时时间，称为"ClientAliveInterval"和"ClientAliveCountMax"。"ClientAliveInterval" 定义了服务器在没有接收到客户端活动时等待的时间，而 "ClientAliveCountMax" 定义了服务器在没有接收到活动后断开连接之前等待的时间间隔数。

* 当SSH连接处于空闲状态（没有活动）并超过了"ClientAliveInterval"定义的时间，服务器会发送一个保持活动的消息给客户端。如果服务器连续发送了 "ClientAliveCountMax" 数量的保持活动消息而没有收到客户端的响应，它将假定连接已经断开，并自动终止连接。

## 解决方案
为了解决这个问题，你可以在SSH客户端或服务器上进行以下配置更改：

在SSH客户端配置文件（通常为 ~/.ssh/config）中添加以下行：

```
ServerAliveInterval <seconds>
ServerAliveCountMax <count>
```

将 \<seconds\> 替换为一个较小的值，以确保在一段时间内有活动，例如30秒。将 \<count\> 替换为一个较大的值，表示服务器在收到活动之前等待的消息次数，例如3。

这将告诉SSH客户端发送保持活动消息以避免连接超时。

在SSH服务器上编辑 /etc/ssh/sshd_config 文件，在文件末尾添加以下行：

```
ClientAliveInterval <seconds>
ClientAliveCountMax <count>
```

使用与上述步骤相同的 \<seconds\> 和 \<count\> 值。然后重新启动SSH服务器以使更改生效。

这将告诉SSH服务器发送保持活动消息以避免连接超时。

## 总结
请注意，在更改SSH服务器的配置之前，请确保你有足够的权限，并确保理解对系统的影响。如果你没有管理员权限，请联系服务器管理员进行相应的配置更改。