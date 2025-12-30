# TOS & ASR 服务 API 参考文档

本文档提供 TOS（对象存储）和 ASR（语音识别）服务的完整 API 参考。

---

## 📚 目录

- [TOS API](#tos-api)
  - [获取 STS 临时凭证](#1-获取-sts-临时凭证)
  - [生成上传预签名 URL](#2-生成上传预签名-url)
  - [生成下载预签名 URL](#3-生成下载预签名-url)
  - [上传完成回调](#4-上传完成回调)
  - [获取上传记录列表](#5-获取上传记录列表)
- [ASR API](#asr-api)
  - [提交识别任务](#1-提交识别任务)
  - [查询任务详情](#2-查询任务详情)
  - [轮询任务结果](#3-轮询任务结果)
  - [获取任务列表](#4-获取任务列表)
  - [删除任务](#5-删除任务)
  - [重试失败任务](#6-重试失败任务)
- [前端测试页面](#前端测试页面)
- [相关文档](#相关文档)

---

## TOS API

TOS（Tinder Object Storage）对象存储服务，用于安全、高效的文件存储和管理。

### 基础信息

- **Base URL**: `/api/tos`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`

---

### 1. 获取 STS 临时凭证

获取用于前端直传的 STS（Security Token Service）临时凭证。

#### 请求

```http
GET /api/tos/sts
Authorization: Bearer <JWT_TOKEN>
```

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "access_key_id": "AKTP***************",
    "secret_access_key": "**********************",
    "session_token": "**********************",
    "expiration": "2025-12-31T10:30:00Z",
    "region": "cn-beijing",
    "endpoint": "https://tos-cn-beijing.volces.com",
    "bucket": "resume-polisher-files"
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_key_id` | string | 临时访问密钥 ID |
| `secret_access_key` | string | 临时访问密钥 Secret |
| `session_token` | string | 会话令牌 |
| `expiration` | string | 凭证过期时间（ISO 8601 格式） |
| `region` | string | TOS 服务区域 |
| `endpoint` | string | TOS 服务端点 URL |
| `bucket` | string | 存储桶名称 |

#### 使用场景

- 前端需要直接上传文件到 TOS 时
- 实现客户端直传，减轻服务器负载

---

### 2. 生成上传预签名 URL

生成用于上传文件的预签名 URL，前端可以使用此 URL 直接上传文件。

#### 请求

```http
POST /api/tos/presign
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "key": "resume_20251231.pdf",
  "content_type": "application/pdf"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | 是 | 文件在 TOS 中的 key（不含前缀） |
| `content_type` | string | 否 | 文件的 MIME 类型 |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "url": "https://tos-cn-beijing.volces.com/resume-polisher-files/uploads/resume_20251231.pdf?X-Tos-Signature=...",
    "key": "uploads/resume_20251231.pdf",
    "expires_in": 900
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | 预签名上传 URL |
| `key` | string | 完整的文件 key（包含前缀） |
| `expires_in` | number | URL 过期时间（秒） |

#### 使用示例

前端使用预签名 URL 上传文件：

```typescript
const response = await fetch(presignUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});
```

---

### 3. 生成下载预签名 URL

生成用于下载文件的预签名 URL。

#### 请求

```http
GET /api/tos/presign/download?key=uploads/resume_20251231.pdf
Authorization: Bearer <JWT_TOKEN>
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | 是 | 文件在 TOS 中的完整 key |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "url": "https://tos-cn-beijing.volces.com/resume-polisher-files/uploads/resume_20251231.pdf?X-Tos-Signature=...",
    "expires_in": 900
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | 预签名下载 URL |
| `expires_in` | number | URL 过期时间（秒） |

---

### 4. 上传完成回调

在文件上传完成后，调用此接口记录上传信息到数据库。

#### 请求

```http
POST /api/tos/uploads/complete
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "key": "uploads/resume_20251231.pdf",
  "filename": "我的简历.pdf",
  "content_type": "application/pdf",
  "size": 1024000,
  "metadata": "{\"description\":\"个人简历\"}"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | 是 | 文件在 TOS 中的完整 key |
| `filename` | string | 是 | 原始文件名 |
| `content_type` | string | 否 | 文件的 MIME 类型 |
| `size` | number | 否 | 文件大小（字节） |
| `metadata` | string | 否 | JSON 格式的元数据 |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1001,
    "created_at": "2025-12-31T10:00:00Z",
    "updated_at": "2025-12-31T10:00:00Z",
    "user_id": "user123",
    "key": "uploads/resume_20251231.pdf",
    "filename": "我的简历.pdf",
    "content_type": "application/pdf",
    "size": 1024000,
    "status": "success"
  }
}
```

---

### 5. 获取上传记录列表

获取当前用户的文件上传记录列表。

#### 请求

```http
GET /api/tos/uploads?page=1&page_size=20
Authorization: Bearer <JWT_TOKEN>
```

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `page_size` | number | 否 | 20 | 每页数量（最大100） |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 50,
    "page": 1,
    "per_page": 20,
    "items": [
      {
        "id": 1001,
        "created_at": "2025-12-31T10:00:00Z",
        "updated_at": "2025-12-31T10:00:00Z",
        "user_id": "user123",
        "key": "uploads/resume_20251231.pdf",
        "filename": "我的简历.pdf",
        "content_type": "application/pdf",
        "size": 1024000,
        "status": "success"
      }
    ]
  }
}
```

---

## ASR API

ASR（Automatic Speech Recognition）语音识别服务，基于火山引擎豆包大模型。

### 基础信息

- **Base URL**: `/api/asr`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`

---

### 1. 提交识别任务

提交音频文件进行语音识别。

#### 请求

```http
POST /api/asr/tasks
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "audio_url": "https://tos-cn-beijing.volces.com/bucket/audio.mp3",
  "audio_format": "mp3",
  "options": {
    "enable_itn": true,
    "enable_ddc": true,
    "enable_speaker_diarization": false
  }
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `audio_url` | string | 是 | 音频文件的 URL（需可公网访问） |
| `audio_format` | string | 是 | 音频格式：`mp3`、`wav`、`ogg`、`raw` |
| `options` | object | 否 | 识别选项 |
| `options.enable_itn` | boolean | 否 | 是否启用智能数字转换 |
| `options.enable_ddc` | boolean | 否 | 是否启用语气词删除 |
| `options.enable_speaker_diarization` | boolean | 否 | 是否启用说话人分离 |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-12-31T10:00:00Z",
    "updated_at": "2025-12-31T10:00:00Z",
    "user_id": "user123",
    "audio_url": "https://tos-cn-beijing.volces.com/bucket/audio.mp3",
    "audio_format": "mp3",
    "status": "pending",
    "progress": 0,
    "options": "{\"enable_itn\":true,\"enable_ddc\":true}"
  }
}
```

#### 任务状态说明

| 状态 | 说明 |
|------|------|
| `pending` | 等待处理 |
| `processing` | 识别中 |
| `completed` | 识别完成 |
| `failed` | 识别失败 |

---

### 2. 查询任务详情

查询指定任务的详细信息。

#### 请求

```http
GET /api/asr/tasks/{task_id}
Authorization: Bearer <JWT_TOKEN>
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `task_id` | string | 任务 ID |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-12-31T10:00:00Z",
    "updated_at": "2025-12-31T10:05:00Z",
    "user_id": "user123",
    "audio_url": "https://tos-cn-beijing.volces.com/bucket/audio.mp3",
    "audio_format": "mp3",
    "status": "completed",
    "progress": 100,
    "result": "{\"text\":\"你好，这是一段测试音频。\",\"segments\":[...]}"
  }
}
```

---

### 3. 轮询任务结果

主动查询云端任务状态，更新本地记录。

#### 请求

```http
POST /api/asr/tasks/{task_id}/poll
Authorization: Bearer <JWT_TOKEN>
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `task_id` | string | 任务 ID |

#### 响应示例（处理中）

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress": 50
  }
}
```

#### 响应示例（已完成）

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "progress": 100,
    "result": "{\"text\":\"你好，这是一段测试音频。\",\"segments\":[{\"text\":\"你好\",\"start_time\":0.0,\"end_time\":0.5},{\"text\":\"这是一段测试音频\",\"start_time\":0.5,\"end_time\":2.5}]}"
  }
}
```

#### 识别结果格式

```typescript
interface ASRResult {
  text: string; // 完整识别文本
  segments?: Array<{
    text: string; // 片段文本
    start_time: number; // 开始时间（秒）
    end_time: number; // 结束时间（秒）
    speaker?: string; // 说话人标识（启用说话人分离时）
  }>;
}
```

---

### 4. 获取任务列表

获取当前用户的识别任务列表。

#### 请求

```http
GET /api/asr/tasks?page=1&page_size=20
Authorization: Bearer <JWT_TOKEN>
```

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `page_size` | number | 否 | 20 | 每页数量（最大100） |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 50,
    "page": 1,
    "per_page": 20,
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "created_at": "2025-12-31T10:00:00Z",
        "updated_at": "2025-12-31T10:05:00Z",
        "user_id": "user123",
        "audio_url": "https://...",
        "audio_format": "mp3",
        "status": "completed",
        "progress": 100
      }
    ]
  }
}
```

---

### 5. 删除任务

删除指定的识别任务。

#### 请求

```http
DELETE /api/asr/tasks/{task_id}
Authorization: Bearer <JWT_TOKEN>
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `task_id` | string | 任务 ID |

#### 响应示例

```json
{
  "code": 0,
  "msg": "任务删除成功"
}
```

---

### 6. 重试失败任务

重新提交失败的识别任务。

#### 请求

```http
POST /api/asr/tasks/{task_id}/retry
Authorization: Bearer <JWT_TOKEN>
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `task_id` | string | 任务 ID |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "progress": 0
  }
}
```

#### 注意事项

- 只能重试状态为 `failed` 的任务
- 重试会重置任务状态和进度
- 使用原有的音频 URL 和选项

---

## 前端测试页面

为方便测试和调试，项目提供了两个完整的测试页面：

### TOS 服务测试页面

**访问地址**: `/test/tos`

**功能特性**:
- ✅ 获取 STS 临时凭证
- ✅ 生成上传预签名 URL
- ✅ 文件上传到 TOS
- ✅ 生成下载预签名 URL
- ✅ 查看上传记录列表
- ✅ 实时测试日志

**使用流程**:
1. 选择测试文件（任意格式，最大100MB）
2. 点击"获取STS凭证"查看临时凭证信息
3. 点击"上传文件"完成上传流程
4. 点击"生成下载URL"测试文件下载
5. 点击"查看上传列表"查看历史记录

---

### ASR 服务测试页面

**访问地址**: `/test/asr`

**功能特性**:
- ✅ 音频文件上传到 TOS
- ✅ 提交语音识别任务
- ✅ 实时查询任务状态
- ✅ 自动轮询识别结果
- ✅ 查看识别文本和片段详情
- ✅ 任务列表管理（查看、删除、重试）
- ✅ 实时测试日志

**使用流程**:
1. 选择音频文件（支持 MP3、WAV、OGG，最大100MB）
2. 点击"上传音频文件到TOS"完成上传
3. 点击"提交任务"开始语音识别
4. 点击"轮询结果"自动轮询直到识别完成
5. 查看识别文本和片段详情
6. 点击"任务列表"管理所有识别任务

**识别选项说明**:
- `enable_itn`: 智能数字转换（如 "一千" → "1000"）
- `enable_ddc`: 语气词删除（去除 "嗯"、"啊" 等）
- `enable_speaker_diarization`: 说话人分离（识别多个说话人）

---

## 前端使用示例

### TOS 文件上传

```typescript
import { tosAPI } from '@/api/tos';

// 方式1：使用封装好的 uploadToTOS 方法（推荐）
async function uploadFile(file: File) {
  try {
    const upload = await tosAPI.uploadToTOS(file);
    console.log('上传成功:', upload);
    return upload;
  } catch (error) {
    console.error('上传失败:', error);
  }
}

// 方式2：手动控制上传流程
async function uploadFileManual(file: File) {
  // 1. 生成预签名 URL
  const presignResponse = await tosAPI.generatePresignURL({
    key: `${Date.now()}_${file.name}`,
    content_type: file.type,
  });

  // 2. 上传文件到 TOS
  await fetch(presignResponse.data.url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  // 3. 记录上传完成
  await tosAPI.recordUploadComplete({
    key: presignResponse.data.key,
    filename: file.name,
    content_type: file.type,
    size: file.size,
  });
}
```

---

### ASR 语音识别

```typescript
import { asrAPI, tosAPI } from '@/api';

async function recognizeAudio(audioFile: File) {
  // 1. 上传音频文件到 TOS
  const upload = await tosAPI.uploadToTOS(audioFile);
  
  // 2. 生成下载 URL
  const downloadResponse = await tosAPI.generateDownloadURL(upload.key);
  const audioUrl = downloadResponse.data.url;

  // 3. 提交识别任务
  const submitResponse = await asrAPI.submitTask({
    audio_url: audioUrl,
    audio_format: 'mp3',
    options: {
      enable_itn: true,
      enable_ddc: true,
    },
  });

  const taskId = submitResponse.data.id;

  // 4. 轮询直到完成
  const task = await asrAPI.pollUntilComplete(
    taskId,
    (task) => {
      console.log(`识别进度: ${task.progress}%`);
    },
    60,  // 最多60次
    3000 // 每3秒轮询一次
  );

  // 5. 解析结果
  if (task.status === 'completed') {
    const result = asrAPI.parseResult(task);
    console.log('识别文本:', result?.text);
    return result;
  } else {
    throw new Error(task.error_message || '识别失败');
  }
}
```

---

## 错误码说明

### 通用错误码

| Code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 业务错误码

| Code | 说明 | 服务 |
|------|------|------|
| 1001 | TOS服务未启用 | TOS |
| 1002 | 获取STS凭证失败 | TOS |
| 1003 | 生成预签名URL失败 | TOS |
| 2001 | ASR服务未启用 | ASR |
| 2002 | 不支持的音频格式 | ASR |
| 2003 | 音频URL无法访问 | ASR |
| 2004 | 识别任务不存在 | ASR |
| 2005 | 只能重试失败的任务 | ASR |

---

## 相关文档

- [火山引擎服务集成指南](./VOLCENGINE_INTEGRATION_GUIDE.md) - 详细的配置和集成说明
- [火山引擎 TOS 官方文档](https://www.volcengine.com/docs/6349)
- [火山引擎 ASR 官方文档](https://www.volcengine.com/docs/6561)

---

## 更新日志

**版本**: v1.0.0  
**更新时间**: 2025-12-31  
**作者**: Resume Polisher Team

### 功能清单

- ✅ TOS 服务完整实现（后端 5 个 API + 前端封装）
- ✅ ASR 服务完整实现（后端 6 个 API + 前端封装）
- ✅ 完整的前端测试页面
- ✅ 详细的 API 文档
- ✅ 使用示例和最佳实践

### 待优化项

- ⏳ WebSocket 推送识别进度（替代轮询）
- ⏳ TOS 文件生命周期管理
- ⏳ ASR 任务队列和并发控制
- ⏳ 更丰富的识别选项支持

