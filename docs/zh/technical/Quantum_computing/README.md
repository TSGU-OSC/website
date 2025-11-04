## 前言

量子计算有别于传统二进制的计算方法。量子计算机的概念最早是由著名物理学家费曼于1981年提出,现在量子计算是当今世界最具颠覆性的技术之一，感兴趣的同学来看看。

### 量子比特

在经典计算机里，人们通常用电位的高低来表示二进制的0和1，然后利用三极管等半导体器件对电流进行操控，以完成通用逻辑运算。然而，在同一时间内，同一个比特只能处于低电位和高电位中的一种情况。

在神奇的量子世界里，一些实体可以同时处于两种不同的状态。例如电子，它的自旋可以同时处于向上的状态和向下的状态，如果我们把这种向上和向下的状态分别记为0和1。



![输入图片说明](img/%E9%87%8F%E5%AD%90%E6%AF%94%E7%89%B9.png)

### 量子计算相关框架评估

2022/12/09

|框架名称|公司|版本号|CPU|GPU|原生支持变分|Python API|jit|原生支持jw变换|
|-|-|-|-|-|-|-|-|-|
|MindQuantum|华为|0.8.0|✅|✅|✅|✅|✅|✅|
|qiskit|IBM|0.38.0|✅|✅|❌|✅|❌|❌|
|intel_qs|Intel|2.0.0-beta|✅|❌|❌|❌|❌|❌|
|paddle quantum|Baidu|2.2.1|✅|✅|❌|✅|✅|❌|
|tensorflow quantum|Google|0.7.2|✅|✅|✅|✅|✅|❌|
|qulacs|Qulacs|0.5.2|✅|✅|✅|✅|❌|❌|
|quest|Oxford|3.5.0|✅|✅|✅|❌|❌|❌|
|tensorcircuit|Tencent|0.5.0|✅|✅|❌|✅|✅|❌|
|pyqpanda|本源|3.7.15|✅|✅|✅|✅|❌|✅|


## 相关开源仓库
MindQuantum仓库地址:[gitee.com/mindspore/mindquantum](https://gitee.com/mindspore/mindquantum)

**简介**
MindQuantum是基于昇思MindSpore开源深度学习框架和HiQ量子计算云平台开发的通用量子计算框架，支持多种量子神经网络的训练和推理。

### win系统安装方法：
1. 安装MindSpore
> 小白注意(大佬忽略)，如果之前安装了python请全部卸掉，只安装一个版本即可，主要是防止小白装错地方又不会处理。

win11安装MindSpore视频教程：[点击观看](https://www.bilibili.com/video/BV13e411P7tT/?share_source=copy_web&vd_source=5cce33ff95191f8ec5e6ea0eb4f41f15)


2. 安装MindQuantum
- 确保MinGW-W64和CMake的版本>= 3.18.3,并将他们添加到path上


- 安装了protobuf,没装的去[官网](https://github.com/protocolbuffers/protobuf/releases/)下，装完添加到path上

  在黑框输入pip install mindquantum

### 使用

在桌面新建一个text.py文件试运行量子计算程序：


```
from mindquantum import *
import numpy as np

encoder = Circuit().h(0).rx({'a0': 2}, 0).ry('a1', 1)
print(encoder)
print(encoder.get_qs(pr={'a0': np.pi / 2, 'a1': np.pi / 2}, ket=True))
```

你将得到

```
q0: ────H───────RX(2*a0)──

q1: ──RY(a1)──────────────

-1/2j¦00⟩
-1/2j¦01⟩
-1/2j¦10⟩
-1/2j¦11⟩
```

![程序](img/%E6%B5%8B%E8%AF%95.png)