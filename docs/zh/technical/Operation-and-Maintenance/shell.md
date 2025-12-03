# 了解在Linux系统下不同Shell介绍以及切换

## 引言：
在Linux系统中，Shell是用户与操作系统内核之间的接口。它是一个命令行解释器，用于执行用户输入的命令并与操作系统进行交互。在Linux中，常见的Shell包括zsh、bash、fish和sh。本文将介绍这些Shell的特点，并提供如何配置和切换Shell的指南。

### 检查目前所使用的Shell 输入命令
```
echo $SHELL
```

### 更换Shell(以bash为例)
```
chsh -s /bin/bash
```

## zsh（Z Shell）
### 1.1 特点：
zsh是一种功能强大的Shell，具有高度可定制性和丰富的特性。
它提供了智能补全、历史记录搜索、语法高亮和自动纠正等高级功能。
zsh支持丰富的插件和主题，可以轻松个性化和定制化。
### 1.2 配置和切换：

* 安装zsh：在Linux系统上，使用包管理器（如apt、yum或dnf）来安装zsh。
设置zsh为默认Shell：运行命令
```
chsh -s $(which zsh)
```


* 切换到zsh：注销并重新登录，或者在当前终端中运行zsh命令。
## bash（Bourne Again Shell）
### 2.1 特点：
bash是Linux系统中最常用的Shell，它是Bourne Shell的增强版。
bash提供了广泛的功能，包括命令补全、命令历史、作业控制和脚本编写等。
bash脚本可以在几乎所有的Linux系统上运行，具有较好的兼容性。
### 2.2 配置和切换：

bash通常是Linux系统的默认Shell，无需额外安装。
切换到bash：在当前终端中运行bash命令即可。
## fish（Friendly Interactive Shell）
### 3.1 特点：
fish是一种用户友好的Shell，具有直观的语法和自动补全功能。
它提供了语法高亮、命令历史搜索和自动建议等特性，适合Shell新手使用。
fish具有强大的自动补全功能，可以根据上下文和命令历史智能地补全命令和参数。
### 3.2 配置和切换：

* 安装fish：使用包管理器来安装fish，如apt install fish。
设置fish为默认Shell：运行命令
```
chsh -s $(which fish)
```

* 切换到fish：注销并重新登录，或者在当前终端中运行fish命令。
## sh（Bourne Shell）
### 4.1 特点：
sh是最早的Unix Shell之一，它具有较小的内存占用和较快的启动速度。
sh在Linux系统中通常被用作脚本解释器，也可以用于日常命令行操作。
sh的功能相对较少，不支持一些高级特性，但它具有广泛的兼容性。
### 4.2 配置和切换：

sh通常是Linux系统上的默认Shell之一，无需额外安装。
切换到sh：在当前终端中运行sh命令即可。
## 总结：
在Linux系统中，zsh、bash、fish和sh是常见的Shell。它们各具特点，适用于不同的使用场景和个人喜好。通过配置和切换Shell，您可以选择最适合您需求的Shell，并享受到各种功能和定制化的优势。

在Linux系统下，您可以通过安装相应的软件包、修改默认Shell或直接运行命令来配置和切换Shell。选择您喜欢的Shell，并根据个人需求进行适当的配置，提高工作效率和命令行操作的便利性。