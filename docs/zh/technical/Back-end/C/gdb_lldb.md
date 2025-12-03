# C/C++程序调试工具使用文档（gdb/lldb）

## 前言


## 安装

ubuntu
```
sudo apt install gdb
```

macos
```
xcode-select --install
```

## 使用

### 启动程序

无参数启动
```
(gdb) gdb
```
```
(lldb) lldb
```

设置参数
```
(gdb) set args 1 2 3
(gdb) run
```
```
(lldb) settings set target.run-args 1 2 3
(lldb) run
```

or 使用参数启动程序
```
gdb --args a.out 1 2 3
(gdb) run
...
```
```
lldb -- a.out 1 2 3
(lldb) run
...
```

### 环境变量
查看环境变量
```
(lldb) settings show target.env-vars
```
设置环境变量
```
(lldb) settings set target.env-vars DYLD_LIBRARY_PATH=/Users/jacklau/Documents/Programs/Git/Github/bmf/output/bmf/lib
```

## 设置断点

添加断点
```
(gdb) break test.c:12
```

```
(lldb) breakpoint set --file test.c --line 12
(lldb) br s -f test.c -l 12
(lldb) b test.c:12
```

条件断点
```
(gdb) break /root/workspace/bmf_OSPP/bmf/sdk/cpp_sdk/src/task.cpp:99 if stream_id == 0
```

打印断点信息
```
(gdb) info break
```

```
(lldb) breakpoint list
(lldb) br l
```

删除断点
```
(gdb) delete 1
```
```
(lldb) breakpoint delete 1
(lldb) br del 1
```
临时屏蔽断点
```
(gdb) disable 1
```
```
(lldb) breakpoint disable 1
(lldb) br dis 1
```


取消屏蔽断点
```
(gdb) enable 1
```
```
(lldb) breakpoint enable 1
(lldb) br en 1
```


## 调试程序

步入 step in

```
(gdb) step
(gdb) s
```

```
(lldb) thread step-in
(lldb) step
(lldb) s
```
步过 step over
```
(gdb) next
(gdb) n
```
```
(lldb) thread step-over
(lldb) next
(lldb) n
```

步出 step out
```
(gdb) finish
```

```
(lldb) thread step-out
(lldb) finish
```

## 信息查看
### 查看当前执行代码段
```
(gdb) list
```
### 动态库
```
(gdb) info sharedlibrary 
```
### 临时变量
```
(gdb) info locals
```
### 线程
```
(gdb) info threads
```
```
(lldb) threads list
```
### 栈
```
(gdb) backtrace
```
### 内存映射表
```
info proc mappings
```
### 打印相对地址
```
(gdb) p &((bmf_sdk::Task *)0)->inputs_queue_
```
### 观察点设置
```
(gdb) watch *(bmf_sdk::PacketQueueMap*)0x7fffbcc51b70
```
### 观察点查看
```
(gdb) info watchpoints
```
### 查看周围内存
```
(gdb) x/20x 0x7fffbcc51b70
```
### 查看当前指令
```
(gdb) x/i $pc
```
### 单步执行
```
(gdb) si
```

