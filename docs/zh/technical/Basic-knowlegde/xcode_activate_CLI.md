# 激活xcode中CLI

## 未激活状态
输入 `xcode-select -p`

应输出：

```
$ /Library/Developer/CommandLineTools

或

$ xcode-select: error: unable to get active developer directory
```

## 进行激活
执行下面这条命令（需要 sudo）：
```
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

⚠️ 注意：如果你的 Xcode 不在 `/Applications`（比如叫 “Xcode-beta.app”），

可以用：

```
ls /Applications
```

找到确切的名字后再替换路径。

## 进行验证
```
$ xcode-select -p
```
应输出：
```
/Applications/Xcode.app/Contents/Developer
```

## xctrace验证（Apple Xcode 的性能分析命令行工具）

```
$ xcrun xctrace version

或

$ xctrace version
```

应输出：
```
$ xctrace version 16.0 (16F6)
```