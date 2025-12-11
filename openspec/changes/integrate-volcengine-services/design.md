# Design: 火山引擎服务集成

## Context

系统需要增强文件存储和音频处理能力以支持:
1. **分布式文件存储** - 支持多服务器部署和CDN加速
2. **安全的文件上传** - 使用临时凭证而非永久密钥
3. **语音转文字** - 支持语音简历上传和面试录音转文字
4. **大文件处理** - 高效处理音频等大文件

约束条件:
- 使用火山引擎服务(TOS和STT)
- 保持与现有文件上传系统的兼容性
- 不影响主业务性能
- 配置灵活,可独立启用/禁用

## Goals / Non-Goals

### Goals
- 集成火山引擎TOS对象存储服务
- 实现基于STS的安全文件上传机制
- 集成火山引擎ASR语音识别服务
- 提供异步语音识别任务管理
- 为前端提供直传能力,提升上传速度
- 记录上传和识别历史

### Non-Goals
- 不替换现有的本地文件上传功能(保持兼容)
- 不实现实时语音识别(仅支持录音文件识别)
- 不实现文件CDN分发管理(使用TOS原生能力)
- 不实现音频编辑功能
- 不实现语音合成(TTS)功能

## Decisions

### 1. 架构设计

#### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         前端应用                             │
│  ┌───────────────┐        ┌───────────────┐                │
│  │  文件上传      │        │  语音识别     │                │
│  └───────┬───────┘        └───────┬───────┘                │
└──────────┼────────────────────────┼─────────────────────────┘
           │                        │
           ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Resume Polisher 后端                    │
│  ┌─────────────────────┐    ┌──────────────────────┐       │
│  │   TOS Service       │    │    ASR Service       │       │
│  │  - STS 凭证获取     │    │  - 任务提交          │       │
│  │  - 预签名 URL      │    │  - 结果查询          │       │
│  │  - 上传记录管理     │    │  - 任务管理          │       │
│  └──────┬──────────────┘    └──────┬───────────────┘       │
│         │                          │                        │
│  ┌──────┴──────────────────────────┴───────────────┐       │
│  │          PostgreSQL 数据库                       │       │
│  │  - tos_uploads (上传记录)                        │       │
│  │  - asr_tasks (识别任务)                          │       │
│  └──────────────────────────────────────────────────┘       │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
           ▼                          ▼
┌────────────────────┐      ┌────────────────────┐
│   火山引擎 TOS     │      │   火山引擎 ASR     │
│  (对象存储服务)     │      │  (语音识别服务)     │
└────────────────────┘      └────────────────────┘
```

#### 文件上传流程(TOS)

```
┌────────┐               ┌────────┐                ┌────────┐
│  前端  │                │  后端  │                │  TOS   │
└───┬────┘               └───┬────┘                └───┬────┘
    │                        │                         │
    │ 1. 请求预签名 URL        │                         │
    │─────────────────────────>                         │
    │                         │                         │
    │                         │ 2. 调用 TOS SDK         │
    │                         │ 生成预签名 URL           │
    │                         │                         │
    │  返回预签名 URL         │                          │
    │<─────────────────────────                        │
    │                         │                        │
    │ 3. 直接上传到 TOS       │                          │
    │─────────────────────────────────────────────────>│
    │                         │                        │
    │  上传成功               │                         │
    │<─────────────────────────────────────────────────│
    │                         │                         │
    │ 4. 通知后端上传完成     │                           │
    │─────────────────────────>                         │
    │                         │                         │
    │                         │ 5. 记录到数据库           │
    │                         │                         │
    │  完成                   │                         │
    │<─────────────────────────                        │
```

#### 语音识别流程(ASR)

```
┌────────┐                ┌────────┐                ┌────────┐
│  前端  │                │  后端  │                │  ASR   │
└───┬────┘                └───┬────┘                └───┬────┘
    │                         │                         │
    │ 1. 上传音频到 TOS         │                         │
    │ (见上述流程)              │                         │
    │                         │                         │
    │ 2. 提交识别任务           │                         │
    │ (audioUrl)              │                         │
    │─────────────────────────>                         │
    │                         │                         │
    │                         │ 3. 调用 ASR API         │
    │                         │ 提交任务                │
    │                         │─────────────────────────>│
    │                         │                         │
    │                         │  返回任务 ID            │
    │                         │<─────────────────────────│
    │                         │                         │
    │                         │ 4. 保存任务到数据库       │
    │                         │                         │
    │  返回任务 ID             │                         │
    │<─────────────────────────                         │
    │                         │                         │
    │ 5. 轮询任务状态           │                         │
    │─────────────────────────>                         │
    │                         │                         │
    │                         │ 6. 查询 ASR API         │
    │                         │─────────────────────────>│
    │                         │                         │
    │                         │  返回识别结果             │
    │                         │<─────────────────────────│
    │                         │                         │
    │                         │ 7. 更新任务状态           │
    │                         │                         │
    │  返回识别结果             │                         │
    │<─────────────────────────                         │
```

### 2. 数据库表设计

#### TOS 上传记录表

```sql
CREATE TABLE tos_uploads (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    user_id VARCHAR(20) NOT NULL,        -- 上传用户ID
    key VARCHAR(500) NOT NULL,           -- TOS 对象 Key
    filename VARCHAR(255) NOT NULL,      -- 原始文件名
    content_type VARCHAR(100),           -- MIME 类型
    size BIGINT DEFAULT 0,               -- 文件大小(字节)
    
    status VARCHAR(20) DEFAULT 'success', -- 状态: success/failed
    error_message TEXT,                   -- 错误信息
    
    metadata JSONB,                       -- 元数据(自定义信息)
    
    -- 索引
    INDEX idx_tos_uploads_user (user_id, created_at DESC),
    INDEX idx_tos_uploads_key (key),
    INDEX idx_tos_uploads_time (created_at DESC)
);
```

#### ASR 识别任务表

```sql
CREATE TABLE asr_tasks (
    id VARCHAR(50) PRIMARY KEY,          -- 任务ID(UUID)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    user_id VARCHAR(20) NOT NULL,        -- 提交用户ID
    audio_url TEXT NOT NULL,             -- 音频文件 URL
    audio_format VARCHAR(20) NOT NULL,   -- 音频格式: mp3/wav/ogg/raw
    
    status VARCHAR(20) DEFAULT 'pending', -- 状态: pending/processing/completed/failed
    progress INT DEFAULT 0,               -- 进度(0-100)
    
    result JSONB,                         -- 识别结果(JSON格式)
    error_message TEXT,                   -- 错误信息
    
    options JSONB,                        -- 识别选项(enableItn, enableDdc等)
    
    -- 索引
    INDEX idx_asr_tasks_user (user_id, created_at DESC),
    INDEX idx_asr_tasks_status (status, created_at DESC),
    INDEX idx_asr_tasks_time (created_at DESC)
);
```

### 3. 配置管理

#### TOS 配置结构

```go
type TOSConfig struct {
    // STS 配置
    STS struct {
        AccessKey       string `mapstructure:"access_key"`
        SecretKey       string `mapstructure:"secret_key"`
        RoleTRN        string `mapstructure:"role_trn"`
        SessionName    string `mapstructure:"session_name"`
        DurationSeconds int    `mapstructure:"duration_seconds"`
        Endpoint       string `mapstructure:"endpoint"`
        Region         string `mapstructure:"region"`
        Policy         string `mapstructure:"policy"`
    } `mapstructure:"sts"`
    
    // TOS 配置
    TOS struct {
        Endpoint        string `mapstructure:"endpoint"`
        Region          string `mapstructure:"region"`
        Bucket          string `mapstructure:"bucket"`
        KeyPrefix       string `mapstructure:"key_prefix"`
        PresignExpires  int    `mapstructure:"presign_expires"`
    } `mapstructure:"tos"`
}
```

#### ASR 配置结构

```go
type ASRConfig struct {
    AppKey      string `mapstructure:"app_key"`
    AccessKey   string `mapstructure:"access_key"`
    ResourceID  string `mapstructure:"resource_id"`
    BaseURL     string `mapstructure:"base_url"`
    Timeout     int    `mapstructure:"timeout"`
}
```

### 4. 服务层设计

#### TOS 服务接口

```go
// TOSServiceInterface TOS 文件存储服务接口
type TOSServiceInterface interface {
    // GetSTSCredentials 获取 STS 临时凭证
    GetSTSCredentials(ctx context.Context) (*STSCredentials, error)
    
    // GeneratePresignedURL 生成预签名 URL
    GeneratePresignedURL(ctx context.Context, req *PresignRequest) (*PresignResponse, error)
    
    // GenerateDownloadURL 生成下载预签名 URL
    GenerateDownloadURL(ctx context.Context, key string) (*DownloadResponse, error)
    
    // RecordUpload 记录上传完成
    RecordUpload(ctx context.Context, upload *model.TOSUpload) error
    
    // ListUploads 查询上传记录
    ListUploads(ctx context.Context, userID string, page, pageSize int) (*UploadListResponse, error)
}
```

#### ASR 服务接口

```go
// ASRServiceInterface ASR 语音识别服务接口
type ASRServiceInterface interface {
    // SubmitTask 提交识别任务
    SubmitTask(ctx context.Context, req *SubmitTaskRequest) (*ASRTask, error)
    
    // GetTask 获取任务详情
    GetTask(ctx context.Context, taskID string) (*ASRTask, error)
    
    // PollTask 轮询任务结果(主动查询云端)
    PollTask(ctx context.Context, taskID string) (*ASRTask, error)
    
    // ListTasks 查询任务列表
    ListTasks(ctx context.Context, userID string, page, pageSize int) (*TaskListResponse, error)
    
    // DeleteTask 删除任务
    DeleteTask(ctx context.Context, taskID string) error
    
    // RetryTask 重试失败的任务
    RetryTask(ctx context.Context, taskID string) (*ASRTask, error)
}
```

### 5. 安全设计

#### STS 临时凭证机制

**优势**:
- 前端不接触永久密钥,安全性高
- 临时凭证自动过期(15分钟),限制风险窗口
- 可通过 IAM 策略精确控制权限范围

**权限控制**:
- 只允许上传到指定前缀(如 `uploads/`)
- 只允许 PUT 操作,不允许 DELETE
- 限制文件大小(通过 IAM 策略)

**IAM 角色策略示例**:
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "tos:PutObject"
      ],
      "Resource": [
        "trn:tos:::your-bucket-name/uploads/*"
      ],
      "Condition": {
        "NumericLessThanEquals": {
          "tos:content-length": 104857600
        }
      }
    }
  ]
}
```

#### 预签名 URL 安全

- 短有效期(15分钟),限制恶意使用
- 包含签名校验,防止篡改
- 只针对特定文件,不能批量操作

### 6. 错误处理

#### TOS 错误处理

**场景**:
- STS 凭证获取失败 → 返回 500,记录错误日志
- 预签名 URL 生成失败 → 返回 500,检查配置
- 前端上传失败 → 回调时传递错误信息,记录到数据库

**容错**:
- 配置未初始化时,服务不可用,返回明确错误
- 网络超时重试(最多3次)

#### ASR 错误处理

**场景**:
- 音频 URL 无法访问 → 返回 400,提示 URL 无效
- ASR API 调用失败 → 返回 500,记录详细错误
- 识别失败 → 更新任务状态为 failed,保存错误信息

**容错**:
- 轮询超时(建议前端设置最大轮询次数)
- 支持手动重试失败任务

### 7. 性能优化

#### TOS 性能

- **前端直传**: 文件不经过后端,节省带宽和服务器资源
- **连接复用**: 使用 TOS SDK 的连接池
- **并发上传**: 前端支持多文件并发上传
- **CDN 加速**: TOS 原生支持 CDN 分发

#### ASR 性能

- **异步处理**: 识别任务异步执行,不阻塞接口
- **轮询间隔**: 建议前端 3-5 秒轮询一次,避免频繁请求
- **批量查询**: 支持批量查询任务状态(后续优化)
- **缓存结果**: 识别完成后结果持久化,无需重复识别

## Risks / Trade-offs

### 风险1: 外部服务依赖

**影响**: 依赖火山引擎服务可用性

**缓解措施**:
- 保留原有本地文件上传作为备用（本期任务不做）
- 配置可选,可随时切换
- 监控外部服务调用失败率
- 关键错误记录到事件日志

### 风险2: 成本

**影响**: TOS 存储和 ASR 识别产生费用

**缓解措施**:
- 设置存储生命周期策略,自动删除过期文件
- 限制单用户识别次数(通过积分系统)
- 监控用量,设置预算告警

### 风险3: 配置复杂度

**影响**: 需要在火山引擎控制台配置多个服务

**缓解措施**:
- 提供详细配置文档
- 提供配置模板
- 配置验证接口,检查配置是否正确

### Trade-off: 同步 vs 异步

**ASR 识别选择异步模式**:
- ✅ 优点: 不阻塞接口,适合长时音频
- ❌ 缺点: 前端需要实现轮询逻辑
- **决策**: 选择异步,因为识别耗时不可控(几秒到几分钟)

**TOS 上传选择前端直传**:
- ✅ 优点: 节省后端带宽,速度快
- ❌ 缺点: 需要实现 STS 凭证管理
- **决策**: 选择直传,因为性能提升明显

## Migration Plan

### 阶段1: 基础设施搭建
1. 在火山引擎控制台配置 TOS bucket 和 IAM
2. 在火山引擎语音技术控制台创建 ASR 应用
3. 创建数据库表和索引
4. 添加 Go 依赖包

### 阶段2: TOS 服务实现
1. 实现 TOS 服务层
2. 实现 TOS API 接口
3. 单元测试和集成测试

### 阶段3: ASR 服务实现
1. 实现 ASR 服务层
2. 实现 ASR API 接口
3. 单元测试和集成测试

### 阶段4: 前端集成(可选)
1. 实现 TOS 上传组件
2. 实现语音上传和识别界面
3. 端到端测试

### 阶段5: 文档和部署
1. 更新 API 文档
2. 编写配置指南
3. 生产环境部署

### 回滚方案
- 数据库: 保留表,停止使用
- 代码: 通过配置开关禁用服务
- 文件: 回退到本地上传方式
- 无破坏性,可随时回滚

## Open Questions

1. **文件保留策略?**
   - 建议: TOS 文件保留 90 天,超期自动删除
   - 实现: 配置 TOS 生命周期规则

2. **识别任务保留时长?**
   - 建议: 识别完成的任务保留 30 天
   - 实现: 定期清理任务(cron job)

3. **是否需要文件去重?**
   - 建议: 后续优化
   - 实现: 基于文件 hash 去重

4. **是否需要识别进度推送?**
   - 建议: 后续优化
   - 实现: 使用 WebSocket 推送进度更新

5. **如何限制用户使用量?**
   - 建议: 集成现有积分系统
   - 实现: 每次识别扣除积分,不足则拒绝
