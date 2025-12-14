# 火山引擎服务集成指南

本文档介绍如何集成火山引擎的 TOS (对象存储) 和 ASR (语音识别) 服务。

## 目录

- [概述](#概述)
- [前置要求](#前置要求)
- [TOS 对象存储配置](#tos-对象存储配置)
- [ASR 语音识别配置](#asr-语音识别配置)
- [API 使用说明](#api-使用说明)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)

## 概述

### TOS 对象存储服务

TOS (Tinder Object Storage) 提供安全、稳定、高效的云存储服务，用于存储：
- 简历文件 (PDF、Word、图片)
- 录音文件
- 用户头像
- 其他附件

**核心特性**：
- ✅ STS 临时凭证，安全性高
- ✅ 前端直传，节省带宽
- ✅ CDN 加速，下载快速
- ✅ 自动过期管理

### ASR 语音识别服务

ASR (Automatic Speech Recognition) 基于字节跳动豆包大模型，提供高精度语音识别：
- 录音文件转文字
- 说话人分离
- 智能文本规范化 (ITN)
- 语气词删除 (DDC)

**核心特性**：
- ✅ 异步识别，不阻塞
- ✅ 支持多种音频格式 (mp3、wav、ogg)
- ✅ 说话人分离
- ✅ 进度实时查询

---

## 前置要求

### 1. 注册火山引擎账号

访问 [火山引擎控制台](https://console.volcengine.com/) 注册账号并完成实名认证。

### 2. 开通服务

#### TOS 服务
1. 访问 [TOS 控制台](https://console.volcengine.com/tos)
2. 点击"开通服务"
3. 选择区域（建议选择离用户最近的区域）

#### ASR 服务
1. 访问 [语音技术控制台](https://console.volcengine.com/speech)
2. 点击"录音文件识别"
3. 开通服务并创建应用

---

## TOS 对象存储配置

### 步骤 1: 创建 Bucket

1. 进入 [TOS 控制台](https://console.volcengine.com/tos)
2. 点击"创建 Bucket"
3. 配置参数：
   - **Bucket 名称**：`resume-polisher-files`（全局唯一）
   - **区域**：`cn-beijing`（根据实际情况选择）
   - **访问权限**：`私有`（推荐）
   - **版本控制**：关闭（可选）

4. 点击"创建"

### 步骤 2: 配置 CORS 规则

为了支持前端直传，需要配置 CORS：

1. 进入 Bucket 详情页
2. 点击"权限管理" → "跨域资源共享 (CORS)"
3. 添加 CORS 规则：

```json
{
  "AllowedOrigins": ["http://localhost:5173", "http://localhost:8888", "https://your-domain.com"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag", "x-tos-request-id"],
  "MaxAgeSeconds": 3600
}
```

### 步骤 3: 创建 IAM 用户

1. 进入 [IAM 控制台](https://console.volcengine.com/iam)
2. 点击"用户" → "新建用户"
3. 配置用户：
   - **用户名**：`resume-polisher-tos-user`
   - **访问方式**：勾选"编程访问"
4. 点击"下一步"，保存 **AccessKey** 和 **SecretKey**（后面会用到）

### 步骤 4: 创建 IAM 角色

1. 在 IAM 控制台，点击"角色" → "新建角色"
2. 选择"信任实体类型"：`火山引擎账号`
3. 配置角色：
   - **角色名称**：`resume-polisher-tos-role`
   - **信任的账号**：输入您的账号 ID
4. 点击"下一步"

### 步骤 5: 为角色添加权限策略

1. 在角色详情页，点击"添加权限"
2. 选择"创建自定义策略"
3. 使用以下策略（限制只能上传到 `uploads/` 前缀）：

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["tos:PutObject"],
      "Resource": ["trn:tos:::resume-polisher-files/uploads/*"],
      "Condition": {
        "NumericLessThanEquals": {
          "tos:content-length": 104857600
        }
      }
    }
  ]
}
```

> **说明**：
> - 此策略只允许上传文件到 `uploads/` 目录
> - 限制单个文件大小不超过 100MB
> - 不允许删除操作，安全性更高

### 步骤 6: 配置信任关系

在角色详情页，编辑"信任关系"，允许 IAM 用户扮演此角色：

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sts:AssumeRole"],
      "Principal": {
        "Volcengine": ["trn:iam::YOUR_ACCOUNT_ID:user/resume-polisher-tos-user"]
      }
    }
  ]
}
```

> 将 `YOUR_ACCOUNT_ID` 替换为您的账号 ID（在控制台右上角可以找到）

### 步骤 7: 更新配置文件

编辑 `server/config.yaml`：

```yaml
tos:
  sts:
    access_key: "AKTP***************"  # 步骤3中保存的AccessKey
    secret_key: "**********************"  # 步骤3中保存的SecretKey
    role_trn: "trn:iam::YOUR_ACCOUNT_ID:role/resume-polisher-tos-role"  # 角色的TRN
    session_name: "resume-polisher-session"
    duration_seconds: 900
    endpoint: "https://sts.volcengineapi.com"
    region: "cn-beijing"
    policy: ""
  tos:
    endpoint: "https://tos-cn-beijing.volces.com"
    region: "cn-beijing"
    bucket: "resume-polisher-files"
    key_prefix: "uploads/"
    presign_expires: 900
```

---

## ASR 语音识别配置

### 步骤 1: 创建应用

1. 进入 [语音技术控制台](https://console.volcengine.com/speech)
2. 点击"录音文件识别" → "创建应用"
3. 配置应用：
   - **应用名称**：`resume-polisher-asr`
   - **应用场景**：选择适合的场景（如"通用场景"）
4. 点击"创建"

### 步骤 2: 获取 APP Key 和 Access Token

1. 在应用详情页，可以看到：
   - **APP ID**：应用唯一标识
   - **APP Key**：应用密钥
2. 点击"生成 Access Token"，保存生成的 Token

### 步骤 3: 更新配置文件

编辑 `server/config.yaml`：

```yaml
asr:
  app_key: "YOUR_APP_KEY"           # 步骤2中获取的APP Key
  access_key: "YOUR_ACCESS_TOKEN"   # 步骤2中获取的Access Token
  resource_id: ""
  base_url: "https://openspeech.bytedance.com"
  timeout: 60
```

---

## API 使用说明

### TOS API

#### 1. 获取 STS 临时凭证

```http
GET /api/tos/sts
Authorization: Bearer <JWT_TOKEN>
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "access_key_id": "AKTP***",
    "secret_access_key": "***",
    "session_token": "***",
    "expiration": "2025-12-11T10:30:00Z",
    "region": "cn-beijing",
    "endpoint": "https://tos-cn-beijing.volces.com",
    "bucket": "resume-polisher-files"
  }
}
```

#### 2. 生成上传预签名 URL

```http
POST /api/tos/presign
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "key": "resume_20251211.pdf",
  "content_type": "application/pdf"
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "url": "https://tos-cn-beijing.volces.com/...",
    "key": "uploads/resume_20251211.pdf",
    "expires_in": 900
  }
}
```

#### 3. 上传完成回调

```http
POST /api/tos/uploads/complete
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "key": "uploads/resume_20251211.pdf",
  "filename": "我的简历.pdf",
  "content_type": "application/pdf",
  "size": 1024000
}
```

#### 4. 获取上传记录列表

```http
GET /api/tos/uploads?page=1&page_size=20
Authorization: Bearer <JWT_TOKEN>
```

### ASR API

#### 1. 提交识别任务

```http
POST /api/asr/tasks
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "audio_url": "https://tos-cn-beijing.volces.com/.../audio.mp3",
  "audio_format": "mp3",
  "options": {
    "enable_itn": true,
    "enable_ddc": true,
    "enable_speaker_diarization": true
  }
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user123",
    "audio_url": "https://...",
    "audio_format": "mp3",
    "status": "pending",
    "progress": 0,
    "created_at": "2025-12-11T10:00:00Z"
  }
}
```

#### 2. 轮询任务结果

```http
POST /api/asr/tasks/{task_id}/poll
Authorization: Bearer <JWT_TOKEN>
```

**响应示例（处理中）**：
```json
{
  "code": 0,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress": 50
  }
}
```

**响应示例（已完成）**：
```json
{
  "code": 0,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "progress": 100,
    "result": "{\"text\":\"你好，这是一段测试音频。\",\"segments\":[...]}"
  }
}
```

#### 3. 查询任务列表

```http
GET /api/asr/tasks?page=1&page_size=20
Authorization: Bearer <JWT_TOKEN>
```

#### 4. 删除任务

```http
DELETE /api/asr/tasks/{task_id}
Authorization: Bearer <JWT_TOKEN>
```

#### 5. 重试失败任务

```http
POST /api/asr/tasks/{task_id}/retry
Authorization: Bearer <JWT_TOKEN>
```

---

## 前端使用示例

### TOS 文件上传

```typescript
import { tosAPI } from '@/api/tos';

// 上传文件
async function uploadFile(file: File) {
  try {
    const upload = await tosAPI.uploadToTOS(file);
    console.log('上传成功:', upload);
    return upload;
  } catch (error) {
    console.error('上传失败:', error);
  }
}
```

### ASR 语音识别

```typescript
import { asrAPI } from '@/api/asr';

// 提交识别任务并轮询结果
async function recognizeAudio(audioUrl: string) {
  try {
    // 1. 提交任务
    const response = await asrAPI.submitTask({
      audio_url: audioUrl,
      audio_format: 'mp3',
      options: {
        enable_itn: true,
        enable_ddc: true,
      },
    });

    const taskId = response.data.id;

    // 2. 轮询直到完成
    const task = await asrAPI.pollUntilComplete(
      taskId,
      (task) => {
        console.log(`识别进度: ${task.progress}%`);
      },
      60,  // 最多60次
      3000 // 每3秒轮询一次
    );

    // 3. 解析结果
    if (task.status === 'completed') {
      const result = asrAPI.parseResult(task);
      console.log('识别结果:', result?.text);
      return result;
    } else {
      throw new Error(task.error_message || '识别失败');
    }
  } catch (error) {
    console.error('识别失败:', error);
  }
}
```

---

## 故障排查

### TOS 问题

#### 问题 1: "TOS服务未启用"

**原因**：TOS 服务初始化失败

**解决方案**：
1. 检查配置文件中的 `access_key` 和 `secret_key` 是否正确
2. 检查服务器日志，查看具体错误信息
3. 确认 IAM 用户有正确的权限

#### 问题 2: "获取STS凭证失败"

**原因**：IAM 角色配置错误或权限不足

**解决方案**：
1. 确认 `role_trn` 格式正确：`trn:iam::账号ID:role/角色名称`
2. 检查角色的信任关系是否包含该 IAM 用户
3. 确认角色有正确的 TOS 权限策略

#### 问题 3: 前端上传跨域错误

**原因**：Bucket 未配置 CORS 规则

**解决方案**：
1. 检查 TOS Bucket 的 CORS 配置
2. 确保 `AllowedOrigins` 包含前端域名
3. 确保 `AllowedMethods` 包含 `PUT`

### ASR 问题

#### 问题 1: "ASR服务未启用"

**原因**：ASR 服务初始化失败

**解决方案**：
1. 检查配置文件中的 `app_key` 和 `access_key` 是否正确
2. 确认 ASR 服务已开通
3. 检查 `base_url` 是否正确

#### 问题 2: 任务一直处于 pending 状态

**原因**：音频 URL 无法访问或格式不支持

**解决方案**：
1. 确认音频 URL 可以公网访问（或配置了 TOS 预签名下载 URL）
2. 检查音频格式是否支持（mp3、wav、ogg）
3. 查看任务详情的 `error_message` 字段

#### 问题 3: 识别结果不准确

**原因**：音频质量差或背景噪音大

**解决方案**：
1. 提高音频录制质量
2. 使用降噪软件预处理音频
3. 尝试不同的识别选项（如关闭 DDC）

---

## 最佳实践

### TOS 最佳实践

1. **文件命名规范**
   - 使用时间戳 + 随机字符串：`20251211_abc123.pdf`
   - 避免中文文件名，防止编码问题

2. **生命周期管理**
   - 在 TOS 控制台配置生命周期规则
   - 建议：临时文件 7 天自动删除，正式文件 90 天

3. **CDN 加速**
   - 为 Bucket 绑定 CDN 域名
   - 配置缓存策略，提升下载速度

4. **安全性**
   - 使用 STS 临时凭证，不要暴露永久密钥
   - 定期轮换 IAM 用户密钥
   - 使用最小权限原则配置 IAM 策略

### ASR 最佳实践

1. **音频预处理**
   - 采样率：16kHz 或更高
   - 比特率：128kbps 或更高
   - 格式：推荐使用 mp3 或 wav

2. **任务管理**
   - 定期清理已完成的任务（建议 30 天）
   - 为失败任务提供重试机制
   - 记录识别日志，便于问题排查

3. **性能优化**
   - 前端轮询间隔：3-5 秒
   - 设置最大轮询次数，避免无限等待
   - 使用 WebSocket 推送（后续优化）

4. **成本控制**
   - 根据业务需求设置识别配额
   - 集成积分系统，限制用户使用量
   - 监控 API 调用量，设置预算告警

---

## 附录

### 环境变量配置（可选）

如果不想在配置文件中写明密钥，可以使用环境变量：

```bash
export TOS_ACCESS_KEY="AKTP***"
export TOS_SECRET_KEY="***"
export ASR_APP_KEY="***"
export ASR_ACCESS_TOKEN="***"
```

然后在代码中读取：

```go
config.TOS.STS.AccessKey = os.Getenv("TOS_ACCESS_KEY")
config.TOS.STS.SecretKey = os.Getenv("TOS_SECRET_KEY")
config.ASR.AppKey = os.Getenv("ASR_APP_KEY")
config.ASR.AccessKey = os.Getenv("ASR_ACCESS_TOKEN")
```

### 相关链接

- [火山引擎 TOS 文档](https://www.volcengine.com/docs/6349)
- [火山引擎 ASR 文档](https://www.volcengine.com/docs/6561)
- [IAM 访问控制文档](https://www.volcengine.com/docs/6257)

---

**版本**：v1.0.0  
**更新时间**：2025-12-11  
**作者**：Resume Polisher Team
