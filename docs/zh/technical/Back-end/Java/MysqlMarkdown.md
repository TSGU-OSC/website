# MySQL

## 一、下载

本教程采用的是MySQL最新的社区版-MySQL Community Server 8.0.26

下载地址：https://downloads.mysql.com/archives/installer/

## 二、安装

要想使用MySQL，我们首先先得将MySQL安装好，我们可以根据下面的步骤，一步一步的完成MySQL的
安装。

1. 双击官方下来的安装包文件

2.  根据安装提示进行安装

> 注意：路径选择没有中文空格等的规范路径

![image-01](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-01.png)

![image-02](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-02.png)

![image-03](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-03.png)

安装MySQL的相关组件，这个过程可能需要耗时几分钟，耐心等待。

![image-04](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-04.png)

![image-05](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-05.png)

![image-06](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-06.png)

![image-07](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-07.png)

**输入MySQL中root用户的密码,一定记得记住该密码**

![image-08](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-08.png)

![image-09](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-09.png)

![image-10](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-10.png)

1. 配置

安装好MySQL之后，还需要配置环境变量，这样才可以在任何目录下连接MySQL。

A. 在此电脑上，右键选择属性

![image-11](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-11.png)

B. 点击 "高级系统设置"，选择环境变量

![image-12](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-12.png)

C. 找到 Path 系统变量, 点击 "编辑"

![image-13](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-13.png)


D. 选择 "新建" , 将MySQL Server的安装目录下的bin目录添加到环境变量

![image-14](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-14.png)

## 三、 启动停止

MySQL安装完成之后，在系统启动时，会自动启动MySQL服务，我们无需手动启动了。

当然，也可以手动的通过指令启动停止，以管理员身份运行cmd，进入命令行执行如下指令：

```
net start mysql80
net stop mysql80
```

![image-15](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-15.png)

> 注意 ： 上述的 mysql80 是我们在安装MySQL时，默认指定的mysql的系统服务名，不是固
> 定的，如果未改动，默认就是mysql80。
> ![image-16](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-16.png)

## 四、客户端连接

1. 方式一：使用MySQL提供的客户端命令行工具

![image-17](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-17.png)

2. 方式二：使用系统自带的命令行工具执行指令

```
mysql [-h 127.0.0.1] [-P 3306] -u root -p

参数：
    -h : MySQL服务所在的主机IP
    -P : MySQL服务端口号， 默认3306
    -u : MySQL数据库用户名
    -p ： MySQL数据库用户名对应的密码
```

[]内为可选参数，如果需要连接远程的MySQL，需要加上这两个参数来指定远程主机IP、端口，如果
连接本地的MySQL，则无需指定这两个参数。

![image-18](../../../../public/technical/Back-end/Java/MysqlMarkdown/image-18.png)

> 注意： 使用这种方式进行连接时，需要安装完毕后配置PATH环境变量。

