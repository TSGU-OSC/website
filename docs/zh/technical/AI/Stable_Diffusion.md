# Stable Diffusion本地Docker快速部署

### docker拉取腾讯云镜像
```
sudo docker pull gpulab.tencentcloudcr.com/ai/stable-diffusion:1.0.8
```
### 启动容器并打印日志
```
sudo docker run -itd --gpus=all --network=host --device=/dev/dri --group-add=video --ipc=host --cap-add=SYS_PTRACE --security-opt seccomp=unconfined --name=stable-diffusion gpulab.tencentcloudcr.com/ai/stable-diffusion:1.0.8 | xargs sudo docker logs --follow
```

### 局域网访问设置
进入容器
```
sudo docker exec -it stable-diffusion /bin/bash
```
进入modules目录
```
cd modules
```
编辑参数
```
vim cmd_argu.py
```
修改以下两行
```python
parser.add_argument("--listen", action='store_true',default=True, help="launch gradio with 0.0.0.0 as server name, allowing to respond to network requests")
parser.add_argument("--port", type=int, help="launch gradio with given server port, you need root/admin rights for ports < 1024, defaults to 7860 if available", default=7860)
```
退出容器
```
exit
```
重启容器
```
sudo docker restart stable-diffusion | xargs sudo docker logs --follow
```

### 添加模型
#### 模型文件可以在 [抱脸](https://huggingface.co/) 或者 [C站](https://civitai.com/) 上下载
模型文件(safetensors,checkpoint)添加到以下目录
```
/dockerx/stable-diffusion-webui/models/Stable-diffusion/
```
Lora文件添加到以下目录
```
/dockerx/stable-diffusion-webui/models/Lora/
```
VAE文件添加到以下目录
```
/dockerx/stable-diffusion-webui/models/VAE/
```