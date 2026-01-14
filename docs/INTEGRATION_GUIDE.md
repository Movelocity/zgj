# 火山引擎服务集成指南

本文档指导主项目完成 **文件存储（TOS）** 和 **录音文件识别（ASR）** 服务的配置与 API 对接。

---

## 目录

1. [服务概述](#服务概述)
2. [TOS 文件存储服务](#tos-文件存储服务)
   - [服务配置](#tos-服务配置)
   - [API 接口文档](#tos-api-接口文档)
   - [前端集成示例](#tos-前端集成示例)
3. [ASR 录音文件识别服务](#ASR-录音文件识别服务)
   - [服务配置](#ASR-服务配置)
   - [API 接口文档](#ASR-api-接口文档)
   - [业务流程](#ASR-业务流程)
4. [完整业务流程](#完整业务流程)
5. [错误处理](#错误处理)
6. [附录](#附录)

---

## 服务概述

| 服务 | 功能 | 依赖平台 | 默认端口 |
|------|------|----------|----------|
| TOS  | 文件存储（上传/下载） | 火山引擎对象存储 | 8080 |
| ASR  | 录音文件识别转文字 | 字节跳动语音识别 | 8081 |

### 典型业务流程

```
┌────────────┐     ┌───────────┐     ┌────────────┐
│   客户端    │ ──► │  TOS服务   │ ──► │  火山引擎   │
│  (上传音频)  │     │ (获取凭证) │     │  对象存储   │
└────────────┘     └───────────┘     └────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌────────────┐      ┌─────────────┐      ┌───────────┐
│   客户端    │ ──►  │  ASR服务     │ ──►  │  字节跳动  │
│ (提交识别)  │      │ (任务管理)    │      │  语音API  │
└────────────┘      └─────────────┘      └───────────┘
```

---

## TOS 文件存储服务

基于火山引擎对象存储（TOS）的文件上传/下载服务，支持 STS 临时凭证和预签名 URL 两种模式。

### TOS 服务配置

创建 `config.yaml` 配置文件：

```yaml
server:
  port: 8080
  # CORS 允许的域名列表，生产环境请配置具体域名
  allowed_origins:
    - "https://your-domain.com"

sts:
  # IAM 用户的永久 AK/SK（请勿提交到代码仓库）
  access_key: "AKxxxxxxxxxxxxxxxxxxxxx"
  secret_key: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  # IAM 角色的 TRN，格式: trn:iam::{accountID}:role/{roleName}
  role_trn: "trn:iam::1234567890:role/tos_role"
  session_name: "web-upload"
  duration_seconds: 900
  # STS 服务端点
  endpoint: "https://open.volcengineapi.com"
  region: "cn-beijing"
  # 可选：收敛临时凭据权限的策略
  policy: ""

tos:
  # TOS 服务端点
  endpoint: "https://tos-cn-beijing.volces.com"
  region: "cn-beijing"
  bucket: "your-bucket-name"
  # 文件存储的默认前缀目录
  key_prefix: "uploads/"
  # 预签名 URL 有效期（秒）
  presign_expires: 900

storage:
  # 上传记录存储文件
  record_file: "data/uploads.json"
```

#### 火山引擎控制台配置要求

1. **创建 IAM 用户**：用于调用 STS 服务
2. **创建 IAM 角色**：用于获取临时凭证访问 TOS
3. **配置信任关系**：允许 IAM 用户扮演角色

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sts:AssumeRole"],
      "Principal": {
        "IAM": ["trn:iam::{accountID}:user/{userName}"]
      }
    }
  ]
}
```

### TOS API 接口文档

#### 1. 获取 STS 临时凭证

获取前端直传所需的临时凭证。

```
GET /api/sts
```

**响应示例：**

```json
{
  "bucket": "your-bucket-name",
  "endpoint": "https://tos-cn-beijing.volces.com",
  "region": "cn-beijing",
  "keyPrefix": "uploads/",
  "expireAt": "2025-12-11T11:00:00Z",
  "credentials": {
    "accessKeyId": "AKTP0VYc...",
    "secretAccessKey": "Td1SR4wK...",
    "sessionToken": "nChBqZkp...",
    "currentTime": "2025-12-11T10:45:00+08:00",
    "expiredTime": "2025-12-11T11:00:00+08:00"
  }
}
```

---

#### 2. 生成上传预签名 URL

生成预签名 URL，客户端可直接 PUT 上传文件到 TOS。

```
POST /api/presign
Content-Type: application/json
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | ✅ | 文件名 |
| contentType | string | ❌ | MIME 类型，如 `audio/mpeg` |
| keyPrefix | string | ❌ | 自定义存储路径前缀 |

**请求示例：**

```json
{
  "filename": "recording.mp3",
  "contentType": "audio/mpeg",
  "keyPrefix": "audio/2025/"
}
```

**响应示例：**

```json
{
  "uploadUrl": "https://your-bucket.tos-cn-beijing.volces.com/audio/2025/recording-uuid.mp3?...",
  "method": "PUT",
  "key": "audio/2025/recording-550e8400-e29b-41d4-a716-446655440000.mp3",
  "expiresAt": "2025-12-11T11:00:00Z",
  "headers": {
    "Content-Type": "audio/mpeg"
  }
}
```

---

#### 3. 生成下载预签名 URL

```
GET /api/presign/download?key={objectKey}
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | ✅ | 对象存储的 Key |

**响应示例：**

```json
{
  "url": "https://your-bucket.tos-cn-beijing.volces.com/uploads/file.mp3?...",
  "method": "GET",
  "key": "uploads/file.mp3",
  "expiresAt": "2025-12-11T11:00:00Z",
  "headers": {}
}
```

---

#### 4. 上传完成回调

客户端上传完成后调用，记录上传状态。

```
POST /api/uploads/complete
Content-Type: application/json
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | ✅ | 对象存储的 Key |
| filename | string | ❌ | 原始文件名 |
| status | string | ❌ | `success` 或 `failed`，默认 `success` |
| error | string | ❌ | 失败时的错误信息 |

**请求示例：**

```json
{
  "key": "audio/2025/recording-uuid.mp3",
  "filename": "recording.mp3",
  "status": "success"
}
```

**响应示例：**

```json
{
  "ok": true
}
```

---

#### 5. 获取上传记录列表

```
GET /api/uploads
```

**响应示例：**

```json
{
  "items": [
    {
      "key": "audio/2025/recording-uuid.mp3",
      "filename": "recording.mp3",
      "uploadedAt": "2025-12-11T10:30:00Z",
      "status": "success"
    }
  ]
}
```

---

### TOS 前端集成示例

#### 使用预签名 URL 上传文件

```javascript
async function uploadFile(file) {
  // 1. 获取预签名 URL
  const presignResp = await fetch('/api/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      keyPrefix: 'audio/'
    })
  });
  const presign = await presignResp.json();

  // 2. 直接上传到 TOS
  const uploadResp = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: file
  });

  if (!uploadResp.ok) {
    throw new Error('Upload failed');
  }

  // 3. 通知服务端上传完成
  await fetch('/api/uploads/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: presign.key,
      filename: file.name,
      status: 'success'
    })
  });

  return presign.key;
}
```

#### 获取文件下载链接

```javascript
async function getDownloadUrl(key) {
  const resp = await fetch(`/api/presign/download?key=${encodeURIComponent(key)}`);
  const data = await resp.json();
  return data.url;
}
```

---

## ASR 录音文件识别服务

基于字节跳动豆包大模型的录音文件识别服务，支持提交异步识别任务并轮询结果。

### ASR 服务配置

创建 `config.yaml` 配置文件：

```yaml
server:
  port: 8081
  allowed_origins:
    - "*"

asr:
  # 火山引擎控制台获取的 APP ID
  app_key: "your-app-key"
  # 火山引擎控制台获取的 Access Token
  access_key: "your-access-key"
  # 资源ID: 
  #   - volc.bigasr.auc: 豆包录音文件识别模型 1.0
  #   - volc.seedasr.auc: 豆包录音文件识别模型 2.0
  resource_id: "volc.bigasr.auc"
  # API 基础地址
  base_url: "https://openspeech.bytedance.com/api/v3/auc/bigmodel"

storage:
  # 任务存储文件路径
  task_file: "data/tasks.json"
```

#### 火山引擎控制台配置要求

1. 登录 [火山引擎语音技术控制台](https://console.volcengine.com/speech/app)
2. 创建应用，获取 **APP ID** (`app_key`)
3. 在应用详情中获取 **Access Token** (`access_key`)
4. 开通 **录音文件识别** 服务

### ASR API 接口文档

#### 1. 提交识别任务

```
POST /api/tasks
Content-Type: application/json
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audioUrl | string | ✅ | 音频文件 URL（需公网可访问） |
| audioFormat | string | ❌ | 音频格式：`raw`/`wav`/`mp3`/`ogg`，默认 `mp3` |
| enableItn | boolean | ❌ | 启用自动文本规范化（数字、日期等转换） |
| enableDdc | boolean | ❌ | 启用自动删除语气词 |
| enableSpeakerInfo | boolean | ❌ | 启用说话人分离 |
| context | string | ❌ | 情景描述，为大模型提供上下文信息 |

**请求示例：**

```json
{
  "audioUrl": "https://your-bucket.tos-cn-beijing.volces.com/audio/recording.mp3",
  "audioFormat": "mp3",
  "enableItn": true,
  "enableDdc": true,
  "enableSpeakerInfo": true,
  "context": "客服通话录音"
}
```

**响应示例：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing"
}
```

---

#### 2. 查询任务详情

```
GET /api/tasks/:id
```

**响应示例：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "audioUrl": "https://...",
  "audioFormat": "mp3",
  "status": "completed",
  "result": {
    "text": "识别出的文字内容...",
    "utterances": [...]
  },
  "createdAt": "2025-12-11T10:00:00Z",
  "updatedAt": "2025-12-11T10:01:30Z"
}
```

**任务状态说明：**

| 状态 | 说明 |
|------|------|
| `pending` | 等待提交 |
| `processing` | 识别中 |
| `completed` | 识别完成 |
| `failed` | 识别失败 |

---

#### 3. 轮询任务结果

主动从云端查询任务最新状态并更新。

```
POST /api/tasks/:id/poll
```

**响应示例（识别完成）：**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "text": "识别出的文字内容...",
    "utterances": [
      {
        "text": "您好，请问有什么可以帮您？",
        "start_time": 0,
        "end_time": 2500,
        "speaker": 0
      },
      {
        "text": "我想咨询一下产品价格。",
        "start_time": 3000,
        "end_time": 5200,
        "speaker": 1
      }
    ]
  },
  "updatedAt": "2025-12-11T10:01:30Z"
}
```

---

#### 4. 获取任务列表

```
GET /api/tasks
```

**响应示例：**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "audioUrl": "https://...",
      "audioFormat": "mp3",
      "status": "completed",
      "createdAt": "2025-12-11T10:00:00Z",
      "updatedAt": "2025-12-11T10:01:30Z"
    }
  ]
}
```

---

#### 5. 删除任务

```
DELETE /api/tasks/:id
```

**响应示例：**

```json
{
  "ok": true
}
```

---

#### 6. 重试任务

对失败的任务重新查询结果。

```
POST /api/tasks/:id/retry
```

**响应：** 同轮询接口响应格式

---

### ASR 业务流程

```
┌────────────────────────────────────────────────────────────────┐
│                        ASR 识别流程                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. 提交任务                                                    │
│     POST /api/tasks                                            │
│     ├─ 返回 taskId                                             │
│     └─ 状态: processing                                        │
│                                                                │
│  2. 轮询结果（建议间隔 3-5 秒）                                   │
│     POST /api/tasks/:id/poll                                   │
│     ├─ status: processing → 继续轮询                           │
│     ├─ status: completed  → 获取 result                        │
│     └─ status: failed     → 读取 error 信息                     │
│                                                                │
│  3. 获取完整结果                                                 │
│     GET /api/tasks/:id                                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 完整业务流程

### 录音文件上传并识别的完整流程

```javascript
/**
 * 完整示例：上传录音文件并进行语音识别
 */
async function uploadAndTranscribe(file) {
  // ========== 第一步：上传文件到 TOS ==========
  
  // 1.1 获取预签名 URL
  const presignResp = await fetch('http://localhost:8080/api/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      keyPrefix: 'recordings/'
    })
  });
  const presign = await presignResp.json();
  console.log('预签名 URL:', presign.uploadUrl);

  // 1.2 上传文件到 TOS
  await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: file
  });
  console.log('文件已上传:', presign.key);

  // 1.3 记录上传完成
  await fetch('http://localhost:8080/api/uploads/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: presign.key,
      filename: file.name,
      status: 'success'
    })
  });

  // ========== 第二步：获取文件公网访问 URL ==========
  
  const downloadResp = await fetch(
    `http://localhost:8080/api/presign/download?key=${encodeURIComponent(presign.key)}`
  );
  const downloadData = await downloadResp.json();
  const audioUrl = downloadData.url;
  console.log('文件访问 URL:', audioUrl);

  // ========== 第三步：提交识别任务 ==========
  
  const taskResp = await fetch('http://localhost:8081/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioUrl: audioUrl,
      audioFormat: 'mp3',
      enableItn: true,
      enableDdc: true,
      enableSpeakerInfo: true,
      context: '通话录音'
    })
  });
  const task = await taskResp.json();
  console.log('任务已提交:', task.id);

  // ========== 第四步：轮询识别结果 ==========
  
  const result = await pollTaskResult(task.id);
  console.log('识别完成:', result);
  
  return result;
}

/**
 * 轮询任务结果
 */
async function pollTaskResult(taskId, maxAttempts = 60, interval = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    const resp = await fetch(`http://localhost:8081/api/tasks/${taskId}/poll`, {
      method: 'POST'
    });
    const task = await resp.json();
    
    if (task.status === 'completed') {
      return task;
    }
    
    if (task.status === 'failed') {
      throw new Error(`识别失败: ${task.error}`);
    }
    
    console.log(`识别中... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('识别超时');
}
```

### 后端服务集成示例（Go）

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "time"
)

const (
    TOSServiceURL = "http://localhost:8080"
    ASRServiceURL = "http://localhost:8081"
)

// PresignResponse TOS 预签名响应
type PresignResponse struct {
    UploadURL string            `json:"uploadUrl"`
    Method    string            `json:"method"`
    Key       string            `json:"key"`
    ExpiresAt string            `json:"expiresAt"`
    Headers   map[string]string `json:"headers"`
}

// DownloadResponse TOS 下载链接响应
type DownloadResponse struct {
    URL       string `json:"url"`
    Key       string `json:"key"`
    ExpiresAt string `json:"expiresAt"`
}

// ASRTask 识别任务
type ASRTask struct {
    ID        string      `json:"id"`
    Status    string      `json:"status"`
    Result    interface{} `json:"result,omitempty"`
    Error     string      `json:"error,omitempty"`
    CreatedAt string      `json:"createdAt"`
    UpdatedAt string      `json:"updatedAt"`
}

// GetPresignURL 获取上传预签名 URL
func GetPresignURL(filename, contentType, keyPrefix string) (*PresignResponse, error) {
    body := map[string]string{
        "filename":    filename,
        "contentType": contentType,
        "keyPrefix":   keyPrefix,
    }
    jsonBody, _ := json.Marshal(body)

    resp, err := http.Post(TOSServiceURL+"/api/presign", "application/json", bytes.NewReader(jsonBody))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result PresignResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    return &result, nil
}

// GetDownloadURL 获取下载链接
func GetDownloadURL(key string) (*DownloadResponse, error) {
    resp, err := http.Get(TOSServiceURL + "/api/presign/download?key=" + url.QueryEscape(key))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result DownloadResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    return &result, nil
}

// SubmitASRTask 提交识别任务
func SubmitASRTask(audioURL, audioFormat string, enableSpeaker bool) (*ASRTask, error) {
    body := map[string]interface{}{
        "audioUrl":          audioURL,
        "audioFormat":       audioFormat,
        "enableItn":         true,
        "enableDdc":         true,
        "enableSpeakerInfo": enableSpeaker,
    }
    jsonBody, _ := json.Marshal(body)

    resp, err := http.Post(ASRServiceURL+"/api/tasks", "application/json", bytes.NewReader(jsonBody))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result ASRTask
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    return &result, nil
}

// PollASRTask 轮询任务结果
func PollASRTask(taskID string) (*ASRTask, error) {
    resp, err := http.Post(ASRServiceURL+"/api/tasks/"+taskID+"/poll", "application/json", nil)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result ASRTask
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    return &result, nil
}

// WaitForASRResult 等待识别完成
func WaitForASRResult(taskID string, timeout time.Duration) (*ASRTask, error) {
    deadline := time.Now().Add(timeout)
    
    for time.Now().Before(deadline) {
        task, err := PollASRTask(taskID)
        if err != nil {
            return nil, err
        }
        
        switch task.Status {
        case "completed":
            return task, nil
        case "failed":
            return nil, fmt.Errorf("task failed: %s", task.Error)
        }
        
        time.Sleep(3 * time.Second)
    }
    
    return nil, fmt.Errorf("timeout waiting for task %s", taskID)
}
```

---

## 错误处理

### TOS 服务错误码

| HTTP 状态码 | 错误信息 | 说明 |
|------------|---------|------|
| 400 | invalid request body | 请求体格式错误 |
| 400 | filename is required | 缺少文件名参数 |
| 400 | key is required | 缺少 key 参数 |
| 500 | failed to issue temporary credentials | STS 凭证获取失败 |
| 500 | failed to generate presign url | 预签名 URL 生成失败 |

### ASR 服务错误码

| HTTP 状态码 | 错误信息 | 说明 |
|------------|---------|------|
| 400 | audioUrl is required | 缺少音频 URL |
| 400 | audioFormat must be raw, wav, mp3, or ogg | 不支持的音频格式 |
| 404 | task not found | 任务不存在 |
| 500 | submit to ASR failed | 提交到语音识别服务失败 |
| 500 | query ASR failed | 查询语音识别结果失败 |

### 字节跳动 ASR API 状态码

| 状态码 | 说明 |
|--------|------|
| 20000000 | 成功/完成 |
| 20000001 | 处理中（继续轮询） |
| 其他 | 错误，查看 X-Api-Message |

---

## 附录

### A. 环境变量配置

所有配置项都支持通过环境变量覆盖，格式为大写并用下划线替换点号：

```bash
# TOS 服务
export SERVER_PORT=8080
export STS_ACCESS_KEY="your-access-key"
export STS_SECRET_KEY="your-secret-key"
export TOS_BUCKET="your-bucket"

# ASR 服务
export SERVER_PORT=8081
export ASR_APP_KEY="your-app-key"
export ASR_ACCESS_KEY="your-access-key"
```

### B. 启动服务

```bash
# 启动 TOS 服务
cd tos
go run main.go

# 启动 ASR 服务（另一个终端）
cd ASR
go run main.go
```

### C. 支持的音频格式

| 格式 | MIME 类型 | 说明 |
|------|-----------|------|
| mp3 | audio/mpeg | 推荐，压缩比高 |
| wav | audio/wav | 无损，文件较大 |
| ogg | audio/ogg | 开源格式 |
| raw | audio/raw | 原始 PCM 数据 |

### D. 识别结果结构

```json
{
  "text": "完整的识别文本",
  "utterances": [
    {
      "text": "单句识别文本",
      "start_time": 0,
      "end_time": 2500,
      "speaker": 0,
      "words": [
        {
          "text": "单词",
          "start_time": 0,
          "end_time": 500
        }
      ]
    }
  ]
}
```

### E. 安全建议

1. **生产环境**：
   - 配置具体的 CORS 允许域名
   - 使用 HTTPS
   - 限制 STS 临时凭证权限

2. **密钥管理**：
   - 不要将密钥提交到代码仓库
   - 使用环境变量或密钥管理服务

3. **访问控制**：
   - 主项目需实现用户认证
   - 根据业务需求限制 API 访问

---

## 联系与支持

致LLM: 如有问题，请询问用户
