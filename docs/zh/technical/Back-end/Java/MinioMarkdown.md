# Minio

## 安装minio

### Linux安装

**第一步：拉取镜像**

> docker pull minio/minio

此处拉取的是最新版的minio容器。本项目使用8.2.0

如果要查看最新版的容器的详细版本，可以执行：

```shell
docker image inspect minio/minio:latest | grep -i version
```

**第二步：启动**

用户名和密码请自行配置

```纯文本
docker run \
-p 9000:9000 \
-p 9001:9001 \
--name=gmalldocker_minio \
-d --restart=always \
-e "MINIO_ROOT_USER=admin" \
-e "MINIO_ROOT_PASSWORD=admin123456" \
-v /home/data:/data \
-v /home/config:/root/.minio \
minio/minio server /data --console-address ":9001"
```

浏览器访问：[http://IP:9001/minio/login，登录使用自定义账户密码admin/admin123456登录](http://IP:9001/minio/login，登录使用自定义账户密码admin/admin123456登录 "http://IP:9001/minio/login，登录使用自定义账户密码admin/admin123456登录")

**注意**：文件上传时，需要调整一下linux 服务器的时间与windows 时间一致！（一定不要忘记！否则后续无法成功上传文件，这是因为minio底层为了防止恶意行为则要求上传文件的系统时间和服务器的时间必须要一致！）

> 第一步：安装ntp服务
> yum -y install ntp
> 第二步：开启开机启动服务
> systemctl enable ntpd
> 第三步：启动服务
> systemctl start ntpd
> 第四步：更改时区
> timedatectl set-timezone Asia/Shanghai
> 第五步：启用ntp同步
> timedatectl set-ntp yes
> 第六步：同步时间
> ntpq -p

### Windows安装

下载地址：[MinIO | Code and downloads to create high performance object storage](https://min.io/download#/windows)

需要专门创建一个目录，下载minio.exe到这里。

进入到minio.exe所在目录打开终端（有可能需要以管理员身份运行）,设置一下账号和密码：

```
setx MINIO_ROOT_USER admin
setx MINIO_ROOT_PASSWORD admin123
```

> **注意：** 账号至少为3位，密码至少为8位

注意：别试图双击exe文件来启动，无效。

别忘了需要在minio文件夹中创建一个logs文件夹，需要把日志文件存入这里。

执行：

```shell
./minio.exe server D:\minio\data --console-address ":9001" --address ":9000" > D:\minio\logs\minio.log
```

然后访问:[MinIO Console](http://localhost:9001/login)

## 基本操作

操作我们使用Linux中安装的minio。

导入依赖：

```xml
         <!-- minio -->
            <dependency>
                <groupId>io.minio</groupId>
                <artifactId>minio</artifactId>
                <version>8.2.0</version>
            </dependency>
```

配置参数，这是为了读取yml文件中的minio配置

````java
@Configuration
@ConfigurationProperties(prefix="minio") //读取节点
@Data
public class MinioConstantProperties {

    private String endpointUrl;
    private String accessKey;
    private String secreKey;
    private String bucketName;
}

````

配置文件实例：

```yml
minio:
  endpointUrl: http://192.168.100.100:9000
  accessKey: admin
  secreKey: admin123456
  bucketName: test
```

配置类，这是为了加载配置参数

```java
import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinIOConfig {

    @Autowired
    private MinioConstantProperties props;


    /**
     * 注册操作MInIO客户端对象
     * @return
     */
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(props.getEndpointUrl()) //操作MinIO地址 端口9000
                .credentials(props.getAccessKey(), props.getSecreKey())
                .build();
    }

}
```

文件上传示例(此处用图片文件举例)：

```java
@Slf4j
@Service
public class FileUploadServiceImpl implements FileUploadService {
    @Autowired
    private MinioClient minioClient;

    @Autowired
    private MinioConstantProperties props;


    @Override
    public String uploadImage(MultipartFile file) {

        try {
            log.info("上传图片");
            //检验上传的文件是否是一个图片（通过后缀名以及通过其文件内部构造）
            BufferedImage read = ImageIO.read(file.getInputStream());
            if(read==null){
                throw new RuntimeException("图片格式非法！");
            }
            //给文件生成一个唯一名称  /当日日期/uuid.后缀名
            String folderName= DateUtil.today();
            String fileName = IdUtil.randomUUID();
            String extName = FileUtil.extName(file.getOriginalFilename());//文件后缀名
            String objectName = "/"+folderName+"/"+fileName+"."+extName;

            //调用上传文件功能
            minioClient.putObject(
                    PutObjectArgs.builder().bucket(props.getBucketName()).object(objectName).stream(
                                    file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
            //拼接文件在线地址
            return props.getEndpointUrl() + "/" + props.getBucketName() + objectName;
        } catch (Exception e) {
            log.error("文件上传失败：{}",e);
            throw new RuntimeException(e);
        }
    }
}
```

文件删除的方法示例：

```java
/**
     * 删除文件
     *
     * @param bucketName minio bucket 名称
     * @param fileName 文件名
     * @return
     */
    public Boolean removeFile(String bucketName, String fileName) {
        try {
            //判断桶是否存在
            boolean res = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (res) {
                //删除文件
                minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucketName)
                        .object(fileName).build());
            }
        } catch (Exception e) {
            log.error("minio 删除文件失败");
            e.printStackTrace();
            return false;
        }
        return true;
    }

```

当然，也可以直接用已经写好的工具类来实现：

```java
@Slf4j
@Component
public class MinioUtils {

    @Autowired
    private MinioClient minioClient;

    @Autowired
    private MinioInfo minioInfo;


    /**
     * 上传文件
     *
     * @param file       文件信息
     * @param bucketName minio bucket 名称
     * @return 上传文件路径
     */
    public String uploadFile(MultipartFile file, String bucketName) {
        if (file == null || file.getSize() == 0) {
            log.error("minio 上传文件：{}", "上传文件不能为空");
            return null;
        }
        try {
            // 判断是否存在
            createBucket(bucketName);
            // 原文件名
            String originalFilename = file.getOriginalFilename();
            minioClient.putObject(
                    PutObjectArgs.builder().bucket(bucketName).object(originalFilename).stream(
                            file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
            return minioInfo.getEndpoint() + "/" + bucketName + "/" + originalFilename;
        } catch (Exception e) {
            log.error("minio 上传失败：{}", e.getMessage());
        }
        log.error("minio 上传文件：{}", "上传失败");
        return null;
    }

    /**
     * 通过字节流上传
     *
     * @param imageFullPath 图片路径
     * @param bucketName    minio bucket 名称
     * @param imageData     图片数据
     * @return 上传文件路径
     */
    public String uploadImage(String imageFullPath,
                              String bucketName,
                              byte[] imageData) {
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(imageData);
        try {
            //判断是否存在
            createBucket(bucketName);
            minioClient.putObject(PutObjectArgs.builder().bucket(bucketName).object(imageFullPath)
                    .stream(byteArrayInputStream, byteArrayInputStream.available(), -1)
                    .contentType(".jpg")
                    .build());
            return minioInfo.getEndpoint() + "/" + bucketName + "/" + imageFullPath;
        } catch (Exception e) {
            log.error("minio 上传失败：{}", e.getMessage());
        }
        log.error("minio 上传失败：{}", "上传失败");
        return null;
    }

    /**
     * 删除文件
     *
     * @param bucketName minio bucket 名称
     * @param fileName 文件名
     * @return
     */
    public Boolean removeFile(String bucketName, String fileName) {
        try {
            //判断桶是否存在
            boolean res = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (res) {
                //删除文件
                minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucketName)
                        .object(fileName).build());
            }
        } catch (Exception e) {
            log.error("minio 删除文件失败");
            e.printStackTrace();
            return false;
        }
        return true;
    }

    /**
     * 下载文件
     *
     * @param fileName 文件名
     * @param bucketName minio bucket 名称
     * @param response 请求响应
     */
    public void fileDownload(String fileName,
                             String bucketName,
                             HttpServletResponse response) {

        InputStream inputStream = null;
        OutputStream outputStream = null;
        try {
            if (StringUtils.isBlank(fileName)) {
                response.setHeader("Content-type", "text/html;charset=UTF-8");
                String data = "文件下载失败";
                OutputStream ps = response.getOutputStream();
                ps.write(data.getBytes("UTF-8"));
                return;
            }

            outputStream = response.getOutputStream();
            // 获取文件对象
            inputStream = minioClient.getObject(GetObjectArgs.builder().bucket(bucketName).object(fileName).build());
            byte buf[] = new byte[1024];
            int length = 0;
            response.reset();
            response.setHeader("Content-Disposition", "attachment;filename=" +
                    URLEncoder.encode(fileName.substring(fileName.lastIndexOf("/") + 1), "UTF-8"));
            response.setContentType("application/octet-stream");
            response.setCharacterEncoding("UTF-8");
            // 输出文件
            while ((length = inputStream.read(buf)) > 0) {
                outputStream.write(buf, 0, length);
            }
            System.out.println("下载成功");
            inputStream.close();
        } catch (Throwable ex) {
            response.setHeader("Content-type", "text/html;charset=UTF-8");
            String data = "文件下载失败";
            try {
                OutputStream ps = response.getOutputStream();
                ps.write(data.getBytes("UTF-8"));
            } catch (IOException e) {
                e.printStackTrace();
            }
        } finally {
            try {
                outputStream.close();
                if (inputStream != null) {
                    inputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @SneakyThrows
    public void createBucket(String bucketName) {
        // 不存在就创建
        if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
        }
    }
}

```

## 参考

[SpringBoot 对接 MinIO 实现文件上传下载删除 - 掘金 (juejin.cn)](https://juejin.cn/post/7287914129573527609)

