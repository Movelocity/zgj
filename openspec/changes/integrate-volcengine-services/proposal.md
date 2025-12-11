# Change: 火山引擎服务集成

## Why

系统当前的文件存储和音频处理能力不足,导致以下问题:
- 文件存储依赖本地文件系统,不支持分布式部署和CDN加速
- 缺少语音文件处理能力,无法实现语音简历上传和转文字功能
- 文件上传安全性不足,缺少临时凭证和权限控制
- 无法支持大文件和音频文件的高效上传下载

需要集成火山引擎的对象存储(TOS)和语音识别(ASR)服务,提供企业级的文件存储和音频处理能力。

## What Changes

### 新增服务集成

#### 1. TOS 文件存储服务
- **功能**: 基于火山引擎对象存储的文件上传/下载服务
- **特性**:
  - STS 临时凭证支持前端直传
  - 预签名 URL 生成(上传/下载)
  - 上传完成回调和记录管理
  - 支持自定义存储路径和文件元数据
- **应用场景**: 
  - 简历文件上传(PDF、Word、图片)
  - 录音文件上传
  - 用户头像上传
  - 其他附件上传

#### 2. ASR 录音文件识别服务
- **功能**: 基于字节跳动豆包大模型的录音文件识别
- **特性**:
  - 异步识别任务提交和管理
  - 轮询查询识别结果
  - 支持说话人分离
  - 自动文本规范化(ITN)和语气词删除(DDC)
  - 支持多种音频格式(mp3、wav、ogg、raw)
- **应用场景**:
  - 录音简历转文字
  - 面试录音转文字
  - 语音备忘录转文字

### 后端改动

#### 配置管理
- 新增 TOS 服务配置项(endpoint、bucket、STS配置等)
- 新增 ASR 服务配置项(app_key、access_key、resource_id等)

#### 数据模型
- **新增表**: `tos_uploads` - TOS上传记录表
  - 记录文件key、原始文件名、上传时间、状态等
- **新增表**: `asr_tasks` - ASR识别任务表
  - 记录任务ID、音频URL、识别状态、结果等

#### API接口
**TOS服务**:
- `GET /api/tos/sts` - 获取STS临时凭证
- `POST /api/tos/presign` - 生成上传预签名URL
- `GET /api/tos/presign/download` - 生成下载预签名URL
- `POST /api/tos/uploads/complete` - 上传完成回调
- `GET /api/tos/uploads` - 获取上传记录列表

**ASR服务**:
- `POST /api/asr/tasks` - 提交识别任务
- `GET /api/asr/tasks/:id` - 查询任务详情
- `POST /api/asr/tasks/:id/poll` - 轮询任务结果
- `GET /api/asr/tasks` - 获取任务列表
- `DELETE /api/asr/tasks/:id` - 删除任务
- `POST /api/asr/tasks/:id/retry` - 重试任务

### 前端改动(可选)

- **文件上传组件**: 使用TOS直传提升上传速度
- **录音上传界面**: 支持录音文件上传和识别
- **识别结果展示**: 展示语音转文字结果

## Impact

### Affected specs
- `tos-storage` (新capability): TOS文件存储服务规范
- `asr-recognition` (新capability): ASR语音识别服务规范

### Affected code

**后端(Go)**:
- `server/config/config.go` - 新增配置结构体
- `server/model/tos_upload.go` - TOS上传记录模型
- `server/model/asr_task.go` - ASR任务模型
- `server/service/tos/` - 新服务包
  - `tos_service.go` - TOS服务实现
  - `types.go` - 类型定义
- `server/service/asr/` - 新服务包
  - `asr_service.go` - ASR服务实现
  - `types.go` - 类型定义
- `server/api/tos/` - 新API包
  - `tos.go` - TOS API接口
- `server/api/asr/` - 新API包
  - `asr.go` - ASR API接口
- `server/router/tos.go` - TOS路由
- `server/router/asr.go` - ASR路由

**前端(React + TypeScript)** - 可选:
- `web/src/api/tos.ts` - TOS API调用
- `web/src/api/asr.ts` - ASR API调用
- `web/src/components/upload/TOSUploader.tsx` - TOS上传组件
- `web/src/pages/resume/components/VoiceUpload.tsx` - 语音上传界面

### 外部依赖

**火山引擎服务**:
- 对象存储(TOS): 需要在火山引擎控制台配置bucket、IAM用户和角色
- 语音识别(ASR): 需要在火山引擎语音技术控制台创建应用并获取APP ID和Access Token

**Go依赖包**(需添加):
- `github.com/volcengine/ve-tos-golang-sdk/v2/tos` - TOS SDK
- `github.com/volcengine/volc-sdk-golang` - 火山引擎通用SDK(用于STS)

### 兼容性
- **完全向后兼容**: 新增功能,不影响现有文件上传功能
- **逐步迁移**: 可以保留现有本地文件上传,新功能使用TOS
- **配置可选**: TOS和ASR服务可独立启用或禁用

### 优先级
- **P1 - 高优先级**
- 为后续语音简历功能提供基础能力
- 提升文件上传体验和安全性
