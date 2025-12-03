# SpringBoot整合MinIO后实现文件的上传下载以及获取预览URL

> JDK17  SpringBoot3
>
> 参考 https://min.io/docs/minio/linux/developers/java/API.html?ref=docs-redirect#uploadObject
>
> 源码 https://gitee.com/Uncommen/easy-min-io

## 引入依赖

在*pom.xml*中添加

主要的依赖：

```xml
		<dependency>
            <groupId>io.minio</groupId>
            <artifactId>minio</artifactId>
            <version>8.5.7</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>3.2.1</version>
        </dependency>
```

其它依赖：

```xml
		<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-configuration-processor -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <version>3.2.4</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.projectlombok/lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.30</version>
            <scope>provided</scope>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.apache.commons/commons-lang3 -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>3.14.0</version>
        </dependency>
```

## 配置文件

在*application.yml*中添加minio相关配置：

```yaml
minio:
  endpoint: http://localhost:9000 
  accessKey: Y1zXHmjPZHIf2R8Rp2jM
  secretKey: nz8LdzSb3Defz1Gqs2UB9HAjBcpeRoiDiYZ1kLXE
  bucketName: easy
```

- endpoint：MinIO服务器的地址
- accesskey：MinIO生成的accessKey
- secretKey：MinIO生成的secretKey
- bucketName：桶名（如果桶名不固定，可以在代码中更改而不在这里写死）

## 属性类

提供一个MinIO属性类以便与配置文件进行映射：

**MinIOProperty.java**

```java
/**
 * MinIO 存储属性类
 *
 * @author Uncommon
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "minio")
public class MinIOProperty {
    // MinIO地址
    private String endpoint;
    // MinIO accessKey
    private String accessKey;
    // MinIO secretKey
    private String secretKey;
    // MiniO桶名称
    private String bucketName;
}
```

## 配置类

用于初始化MinIO配置

**MinIOConfig.java**

```java
/**
 * MinIO配置类
 *
 * @author Uncommon
 */
@Configuration
public class MinioConfig {

    @Resource
    private MinIOProperty minioProperty;

    /**
     * 初始化minio配置
     */
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(minioProperty.getEndpoint()) //操作MinIO地址
                .credentials(minioProperty.getAccessKey(), minioProperty.getSecretKey())
                .build();
    }
}
```

## 具体代码逻辑实现

### 上传文件

**MinIOService.java**

```java
/**
     * 上传文件
     *
     * @param file 文件
     * @return 文件名
     */
    String uploadFile(MultipartFile file);
```

**MinIOServiceImpl.java**

```java
    /**
     * 上传文件
     *
     * @param file 文件
     * @return 文件名
     */
    @Override
    public String uploadFile(MultipartFile file) {
        // 获取桶名
        String bucketName = minioProperty.getBucketName();
        log.info("开始向桶 {} 上传文件", bucketName);
        //给文件生成一个唯一名称  当日日期-uuid.后缀名
        String folderName = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd-HH-mm-ss"));
        String fileName = String.valueOf(UUID.randomUUID());
        String extName = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));//文件后缀名
        String objectName = folderName + "-" + fileName + extName;

        InputStream inputStream;
        try {
            inputStream = file.getInputStream();
            // 配置参数
            PutObjectArgs objectArgs = PutObjectArgs.builder().bucket(bucketName).object(objectName)
                    .stream(inputStream, file.getSize(), -1).contentType(file.getContentType()).build();
            //文件名称相同会覆盖
            minioClient.putObject(objectArgs);
        } catch (ErrorResponseException | InsufficientDataException | InternalException | InvalidKeyException |
                 InvalidResponseException | IOException | NoSuchAlgorithmException | ServerException |
                 XmlParserException e) {
            log.error("文件上传失败: " + e);
            throw new RuntimeException(e);
        }
        log.info("文件上传成功，文件名为：{}", objectName);
        return objectName;
    }
```

### 下载文件

**MinIOService.java**

```java
    /**
     * 下载文件
     *
     * @param fileName 文件名
     * @param response HttpServletResponse
     */
    void downloadFile(String fileName, HttpServletResponse response);
```

**MinIOServiceImpl.java**

```java
   /**
     * 下载文件
     *
     * @param fileName 文件名
     * @param response HttpServletResponse
     */
    @Override
    public void downloadFile(String fileName, HttpServletResponse response) {
        // 获取桶名
        String bucketName = minioProperty.getBucketName();
        if (StringUtils.isBlank(fileName)) {
            log.error("文件名为空！");
            return;
        }
        try {
            // 获取文件流
            InputStream file = minioClient.getObject(GetObjectArgs.builder().bucket(bucketName).object(fileName).build());
            response.reset();
            response.setHeader("Content-Disposition", "attachment;filename=" +
                    URLEncoder.encode(fileName.substring(fileName.lastIndexOf("/") + 1), StandardCharsets.UTF_8));
            response.setContentType("application/octet-stream");
            response.setCharacterEncoding("UTF-8");
            // 获取输出流
            ServletOutputStream servletOutputStream = response.getOutputStream();
            int len;
            byte[] buffer = new byte[1024];
            while ((len = file.read(buffer)) > 0) {
                servletOutputStream.write(buffer, 0, len);
            }
            servletOutputStream.flush();
            file.close();
            servletOutputStream.close();
            log.info("文件{}下载成功", fileName);
        } catch (Exception e) {
            log.error("文件名: " + fileName + "下载文件时出现异常: " + e);
        }
    }
```

### 删除文件

**MinIOService.java**

````java
  /**
     * 删除文件
     *
     * @param fileName 文件名
     */
    void deleteFile(String fileName);
````

**MinIOServiceImpl.java**

```java
    /**
     * 删除文件
     *
     * @param fileName 文件名
     */
    @Override
    public void deleteFile(String fileName) {
        // 获取桶名
        String bucketName = minioProperty.getBucketName();
        try {
            if (StringUtils.isBlank(fileName)) {
                log.error("删除文件失败，文件名为空！");
                return;
            }
            // 判断桶是否存在
            boolean isExist = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            // 桶存在
            if (isExist) {
                minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucketName).object(fileName).build());
            } else { // 桶不存在
                log.error("删除文件失败，桶{}不存在", bucketName);
            }
        } catch (Exception e) {
            log.error("删除文件时出现异常: " + e.getMessage());
        }
    }
```

### 获取文件预览URL

**MinIOService.java**

```java
    /**
     * 获取文件预览url
     *
     * @param fileName 文件名
     * @return
     */
    String getPresignedUrl(String fileName);
```

**MinIOServiceImpl.java**

```java
    /**
     * 获取文件预览url
     *
     * @param fileName 文件名
     * @return 文件预览url
     */
    @Override
    public String getPresignedUrl(String fileName) {
        // 获取桶名
        String bucketName = minioProperty.getBucketName();
        String presignedUrl = null;
        try {
            if (StringUtils.isBlank(fileName)) {
                log.error("获取文件预览url失败，文件名为空！");
                return presignedUrl;
            }
            // 判断桶是否存在
            boolean isExist = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            // 桶存在
            if (isExist) {
                presignedUrl = minioClient.getPresignedObjectUrl(
                        GetPresignedObjectUrlArgs.builder()
                                .method(Method.PUT)
                                .bucket(bucketName)
                                .object(fileName)
                                .expiry(1, TimeUnit.DAYS) // 一天过期时间
                                .build());
                return presignedUrl;
            } else {  // 桶不存在
                log.error("获取文件预览url失败，桶{}不存在", bucketName);
            }
        } catch (Exception e) {
            log.error("获取文件预览url时出现异常: " + e.getMessage());
        }
        return presignedUrl;
    }
```

