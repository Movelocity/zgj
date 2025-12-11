# TOS 文件存储服务规范

## ADDED Requirements

### Requirement: STS 临时凭证获取

系统SHALL提供获取火山引擎STS临时凭证的接口,支持前端直接上传文件到TOS,无需暴露永久密钥。

#### Scenario: 前端请求STS临时凭证
- **WHEN** 前端请求获取STS临时凭证（`GET /api/tos/sts`）
- **THEN** 系统SHALL调用火山引擎STS API获取临时凭证
- **AND** 系统SHALL返回包含以下信息的响应：
  - bucket名称
  - endpoint地址
  - region区域
  - keyPrefix存储路径前缀
  - expireAt凭证过期时间
  - credentials临时凭证（accessKeyId、secretAccessKey、sessionToken）
- **AND** 临时凭证SHALL在15分钟内有效

#### Scenario: STS凭证获取失败
- **WHEN** STS API调用失败（如配置错误、网络故障）
- **THEN** 系统SHALL返回500错误
- **AND** 响应消息SHALL包含"获取临时凭证失败"
- **AND** 系统SHALL记录详细错误到系统日志

#### Scenario: STS凭证权限范围限制
- **WHEN** 系统签发STS临时凭证
- **THEN** 凭证SHALL仅允许PUT操作
- **AND** 凭证SHALL仅允许上传到配置的前缀路径（如`uploads/`）
- **AND** 凭证SHALL不允许DELETE或LIST操作

### Requirement: 上传预签名URL生成

系统SHALL支持生成预签名URL,允许客户端直接PUT上传文件到TOS。

#### Scenario: 生成上传预签名URL
- **WHEN** 客户端请求生成上传预签名URL（`POST /api/tos/presign`）
- **THEN** 系统SHALL验证请求参数（filename必填）
- **AND** 系统SHALL生成唯一的对象Key（前缀 + UUID + 扩展名）
- **AND** 系统SHALL调用TOS SDK生成预签名URL
- **AND** 系统SHALL返回：
  - uploadUrl: 预签名URL
  - method: "PUT"
  - key: 对象存储Key
  - expiresAt: URL过期时间
  - headers: 需要携带的HTTP头（如Content-Type）

#### Scenario: 自定义存储路径前缀
- **WHEN** 客户端指定keyPrefix参数（如`audio/2025/`）
- **THEN** 系统SHALL使用指定前缀而非默认前缀
- **AND** 生成的Key SHALL为 `keyPrefix + UUID + 扩展名`

#### Scenario: 指定Content-Type
- **WHEN** 客户端指定contentType参数（如`audio/mpeg`）
- **THEN** 系统SHALL在响应headers中包含Content-Type
- **AND** 客户端上传时SHALL使用该Content-Type

#### Scenario: 预签名URL有效期
- **WHEN** 系统生成预签名URL
- **THEN** URL SHALL在配置的时间内有效（默认15分钟）
- **AND** 超过有效期后URL SHALL无法使用

#### Scenario: 请求参数验证失败
- **WHEN** 请求缺少必填参数filename
- **THEN** 系统SHALL返回400错误
- **AND** 响应消息SHALL为"文件名不能为空"

### Requirement: 下载预签名URL生成

系统SHALL支持生成下载预签名URL,允许客户端临时访问TOS中的文件。

#### Scenario: 生成下载预签名URL
- **WHEN** 客户端请求生成下载URL（`GET /api/tos/presign/download?key={objectKey}`）
- **THEN** 系统SHALL验证key参数不为空
- **AND** 系统SHALL调用TOS SDK生成GET预签名URL
- **AND** 系统SHALL返回：
  - url: 预签名下载URL
  - method: "GET"
  - key: 对象Key
  - expiresAt: URL过期时间

#### Scenario: 下载URL用于ASR识别
- **WHEN** 需要将TOS文件URL提交给ASR服务
- **THEN** 系统SHALL生成带有足够有效期的下载URL（建议30分钟）
- **AND** URL SHALL在ASR识别完成前保持有效

#### Scenario: key参数缺失
- **WHEN** 请求未提供key参数
- **THEN** 系统SHALL返回400错误
- **AND** 响应消息SHALL为"对象Key不能为空"

### Requirement: 上传完成回调

系统SHALL提供上传完成回调接口,记录用户的上传历史和状态。

#### Scenario: 记录成功上传
- **WHEN** 客户端上传到TOS成功后调用完成接口（`POST /api/tos/uploads/complete`）
- **THEN** 系统SHALL在数据库中创建上传记录
- **AND** 记录SHALL包含：
  - user_id: 当前登录用户ID
  - key: TOS对象Key
  - filename: 原始文件名
  - content_type: MIME类型（可选）
  - status: "success"
  - created_at: 上传时间

#### Scenario: 记录失败上传
- **WHEN** 客户端上传失败并调用完成接口（status参数为"failed"）
- **THEN** 系统SHALL记录失败状态
- **AND** 系统SHALL保存error参数中的错误信息

#### Scenario: 响应格式
- **WHEN** 上传记录成功保存
- **THEN** 系统SHALL返回：
  ```json
  {
    "code": 0,
    "data": { "ok": true },
    "msg": "操作成功"
  }
  ```

### Requirement: 上传记录查询

系统SHALL支持查询用户的文件上传历史记录。

#### Scenario: 查询当前用户的上传记录
- **WHEN** 用户请求查询上传记录（`GET /api/tos/uploads`）
- **THEN** 系统SHALL返回当前用户的所有上传记录
- **AND** 记录SHALL按上传时间倒序排列
- **AND** 每条记录SHALL包含：key、filename、content_type、size、status、created_at

#### Scenario: 分页查询（可选）
- **WHEN** 用户指定page和page_size参数
- **THEN** 系统SHALL返回对应页的数据
- **AND** 响应SHALL包含total总记录数

#### Scenario: 按状态筛选（可选）
- **WHEN** 用户指定status参数（如"success"）
- **THEN** 系统SHALL仅返回匹配状态的记录

### Requirement: 配置管理

系统SHALL支持通过配置文件管理TOS服务的各项参数。

#### Scenario: STS配置项
- **GIVEN** 系统配置文件包含STS配置段
- **THEN** 配置SHALL包含：
  - access_key: IAM用户的AccessKey
  - secret_key: IAM用户的SecretKey
  - role_trn: IAM角色的TRN标识符
  - session_name: STS会话名称
  - duration_seconds: 临时凭证有效期（秒）
  - endpoint: STS服务端点
  - region: 区域
  - policy: 权限策略（可选）

#### Scenario: TOS配置项
- **GIVEN** 系统配置文件包含TOS配置段
- **THEN** 配置SHALL包含：
  - endpoint: TOS服务端点
  - region: 区域
  - bucket: bucket名称
  - key_prefix: 默认存储路径前缀
  - presign_expires: 预签名URL有效期（秒）

#### Scenario: 配置验证
- **WHEN** 系统启动时
- **THEN** 系统SHALL验证TOS配置完整性
- **AND** 如果配置缺失关键项,系统SHALL记录警告日志
- **AND** TOS服务SHALL标记为不可用

### Requirement: 安全控制

系统SHALL确保TOS服务的安全性,保护用户数据和系统资源。

#### Scenario: 用户认证
- **WHEN** 用户访问TOS相关接口
- **THEN** 系统SHALL验证JWT Token
- **AND** 未登录用户SHALL返回401错误

#### Scenario: 文件Key隔离
- **WHEN** 系统生成对象Key
- **THEN** Key SHALL包含UUID确保唯一性
- **AND** Key SHALL包含用户ID或会话ID以隔离不同用户的文件

#### Scenario: 临时凭证时效性
- **WHEN** STS临时凭证过期
- **THEN** 客户端SHALL无法使用该凭证上传
- **AND** 客户端SHALL重新请求新的临时凭证

#### Scenario: 预签名URL时效性
- **WHEN** 预签名URL过期
- **THEN** 使用该URL的请求SHALL返回403错误
- **AND** 客户端SHALL请求生成新的预签名URL

### Requirement: 错误处理和日志

系统SHALL妥善处理TOS服务的各种异常情况,并记录关键操作。

#### Scenario: 网络超时处理
- **WHEN** 调用TOS或STS API超时
- **THEN** 系统SHALL返回500错误
- **AND** 响应消息SHALL提示"服务暂时不可用,请稍后重试"
- **AND** 系统SHALL记录详细错误到日志

#### Scenario: 配置错误处理
- **WHEN** TOS配置不正确导致API调用失败
- **THEN** 系统SHALL返回500错误
- **AND** 系统SHALL记录配置错误详情
- **AND** 响应消息SHALL提示"文件服务配置错误"

#### Scenario: 记录关键操作（可选）
- **WHEN** 用户成功上传文件
- **THEN** 系统SHALL记录事件日志（如集成了EventLogService）
- **AND** 日志SHALL包含用户ID、文件Key、文件名、上传时间

### Requirement: 性能优化

系统SHALL确保TOS服务的高性能,不影响用户体验。

#### Scenario: 前端直传优势
- **WHEN** 客户端使用预签名URL或STS凭证直传
- **THEN** 文件流SHALL不经过应用服务器
- **AND** 服务器带宽消耗SHALL显著降低
- **AND** 上传速度SHALL提升（利用TOS的CDN加速）

#### Scenario: 接口响应时间
- **WHEN** 客户端请求STS凭证或预签名URL
- **THEN** 接口响应时间SHALL少于500毫秒
- **AND** 大部分时间消耗在外部API调用

#### Scenario: 并发上传支持
- **WHEN** 客户端需要上传多个文件
- **THEN** 系统SHALL支持并发生成多个预签名URL
- **AND** 客户端SHALL能够并发上传到TOS

### Requirement: 数据库表设计

系统SHALL使用 `tos_uploads` 表存储上传记录。

#### Scenario: 表结构定义
- **GIVEN** 数据库表 `tos_uploads` 存在
- **THEN** 表SHALL包含以下字段：
  - id: BIGSERIAL主键
  - created_at: 创建时间
  - updated_at: 更新时间
  - user_id: 用户ID（VARCHAR(20)）
  - key: TOS对象Key（VARCHAR(500)）
  - filename: 原始文件名（VARCHAR(255)）
  - content_type: MIME类型（VARCHAR(100)）
  - size: 文件大小（BIGINT）
  - status: 状态（VARCHAR(20)）
  - error_message: 错误信息（TEXT）
  - metadata: 元数据（JSONB）

#### Scenario: 索引设计
- **GIVEN** `tos_uploads` 表有索引
- **THEN** 表SHALL创建以下索引：
  - idx_tos_uploads_user: (user_id, created_at DESC)
  - idx_tos_uploads_key: (key)
  - idx_tos_uploads_time: (created_at DESC)

#### Scenario: 查询性能
- **WHEN** 查询用户的上传记录
- **THEN** 查询SHALL使用 `idx_tos_uploads_user` 索引
- **AND** 响应时间SHALL少于100毫秒

### Requirement: API响应格式

系统SHALL遵循项目统一的API响应格式。

#### Scenario: 成功响应格式
- **WHEN** TOS接口操作成功
- **THEN** 响应SHALL使用以下格式：
  ```json
  {
    "code": 0,
    "data": { /* 具体数据 */ },
    "msg": "操作成功"
  }
  ```

#### Scenario: 失败响应格式
- **WHEN** TOS接口操作失败
- **THEN** 响应SHALL使用以下格式：
  ```json
  {
    "code": 500,
    "data": null,
    "msg": "错误描述"
  }
  ```
- **AND** HTTP状态码仍为200

#### Scenario: 参数错误响应
- **WHEN** 请求参数验证失败
- **THEN** code SHALL为400
- **AND** msg SHALL描述具体错误（如"文件名不能为空"）

### Requirement: 兼容性和扩展性

系统SHALL确保TOS服务的向后兼容性和未来扩展性。

#### Scenario: 保留原有文件上传
- **WHEN** TOS服务启用
- **THEN** 系统SHALL保留原有的本地文件上传功能
- **AND** 两种上传方式SHALL可同时使用

#### Scenario: 配置开关
- **WHEN** TOS配置未设置或设置为禁用
- **THEN** TOS相关接口SHALL返回"服务未启用"错误
- **AND** 系统SHALL不尝试调用TOS/STS API

#### Scenario: 元数据扩展
- **WHEN** 需要存储额外的文件元数据
- **THEN** 系统SHALL使用 `metadata` JSONB字段存储
- **AND** 无需修改数据库表结构
