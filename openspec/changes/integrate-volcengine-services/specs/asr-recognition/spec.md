# ASR 语音识别服务规范

## ADDED Requirements

### Requirement: 提交识别任务

系统SHALL提供提交语音识别任务的接口,支持异步识别录音文件并返回任务ID。

#### Scenario: 提交识别任务成功
- **WHEN** 用户请求提交识别任务（`POST /api/asr/tasks`）
- **THEN** 系统SHALL验证必填参数audioUrl
- **AND** 系统SHALL生成唯一的任务ID（UUID）
- **AND** 系统SHALL调用火山引擎ASR API提交任务
- **AND** 系统SHALL在数据库中创建任务记录
- **AND** 系统SHALL返回：
  ```json
  {
    "code": 0,
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "processing"
    },
    "msg": "操作成功"
  }
  ```

#### Scenario: 指定音频格式
- **WHEN** 用户指定audioFormat参数（如"mp3"）
- **THEN** 系统SHALL验证格式为：raw、wav、mp3、ogg之一
- **AND** 系统SHALL在调用ASR API时传递该格式

#### Scenario: 启用文本规范化
- **WHEN** 用户设置enableItn参数为true
- **THEN** 系统SHALL在ASR API请求中启用ITN（数字、日期等转换）

#### Scenario: 启用语气词删除
- **WHEN** 用户设置enableDdc参数为true
- **THEN** 系统SHALL在ASR API请求中启用DDC（删除"嗯"、"啊"等）

#### Scenario: 启用说话人分离
- **WHEN** 用户设置enableSpeakerInfo参数为true
- **THEN** 系统SHALL在ASR API请求中启用说话人识别
- **AND** 识别结果SHALL包含speaker字段区分不同说话人

#### Scenario: 提供上下文信息
- **WHEN** 用户提供context参数（如"客服通话录音"）
- **THEN** 系统SHALL将上下文传递给ASR API
- **AND** ASR模型SHALL利用上下文提高识别准确率

#### Scenario: 参数验证失败
- **WHEN** 请求缺少audioUrl参数
- **THEN** 系统SHALL返回400错误
- **AND** 响应消息SHALL为"音频URL不能为空"

#### Scenario: 音频格式验证失败
- **WHEN** audioFormat参数不在支持的格式列表中
- **THEN** 系统SHALL返回400错误
- **AND** 响应消息SHALL为"音频格式必须是 raw、wav、mp3 或 ogg"

#### Scenario: ASR API调用失败
- **WHEN** 调用火山引擎ASR API失败（如网络错误、配置错误）
- **THEN** 系统SHALL返回500错误
- **AND** 系统SHALL记录详细错误到日志
- **AND** 响应消息SHALL为"提交识别任务失败"

### Requirement: 查询任务详情

系统SHALL提供查询识别任务详情的接口,返回任务当前状态和结果。

#### Scenario: 查询任务成功
- **WHEN** 用户请求查询任务（`GET /api/asr/tasks/:id`）
- **THEN** 系统SHALL从数据库中查询任务记录
- **AND** 系统SHALL返回任务完整信息：
  - id: 任务ID
  - audioUrl: 音频URL
  - audioFormat: 音频格式
  - status: 任务状态
  - progress: 进度（0-100）
  - result: 识别结果（如已完成）
  - error_message: 错误信息（如失败）
  - created_at: 创建时间
  - updated_at: 更新时间

#### Scenario: 任务处理中
- **WHEN** 任务状态为"processing"
- **THEN** result字段SHALL为null
- **AND** progress字段SHALL显示当前进度（如果有）

#### Scenario: 任务已完成
- **WHEN** 任务状态为"completed"
- **THEN** result字段SHALL包含完整识别结果：
  - text: 完整识别文本
  - utterances: 句子列表（含时间戳和说话人）

#### Scenario: 任务失败
- **WHEN** 任务状态为"failed"
- **THEN** error_message字段SHALL包含失败原因
- **AND** result字段SHALL为null

#### Scenario: 任务不存在
- **WHEN** 查询的任务ID不存在
- **THEN** 系统SHALL返回404错误
- **AND** 响应消息SHALL为"任务不存在"

### Requirement: 轮询任务结果

系统SHALL提供轮询接口,主动查询ASR API并更新任务状态。

#### Scenario: 轮询更新任务状态
- **WHEN** 客户端请求轮询任务（`POST /api/asr/tasks/:id/poll`）
- **THEN** 系统SHALL调用火山引擎ASR查询API
- **AND** 系统SHALL根据API返回更新数据库中的任务状态
- **AND** 系统SHALL返回最新的任务信息

#### Scenario: 轮询时任务完成
- **WHEN** ASR API返回识别完成（状态码20000000）
- **THEN** 系统SHALL更新任务状态为"completed"
- **AND** 系统SHALL保存识别结果到result字段
- **AND** 系统SHALL更新updated_at时间戳

#### Scenario: 轮询时任务仍在处理
- **WHEN** ASR API返回处理中（状态码20000001）
- **THEN** 系统SHALL保持任务状态为"processing"
- **AND** 系统SHALL更新progress字段（如果API返回进度）
- **AND** 客户端SHALL继续轮询（建议间隔3-5秒）

#### Scenario: 轮询时任务失败
- **WHEN** ASR API返回错误状态
- **THEN** 系统SHALL更新任务状态为"failed"
- **AND** 系统SHALL保存错误信息到error_message字段
- **AND** 客户端SHALL停止轮询

#### Scenario: 轮询接口性能
- **WHEN** 客户端调用轮询接口
- **THEN** 接口响应时间SHALL少于3秒（包含调用ASR API的时间）

### Requirement: 任务列表查询

系统SHALL提供查询用户任务列表的接口。

#### Scenario: 查询当前用户的任务列表
- **WHEN** 用户请求查询任务列表（`GET /api/asr/tasks`）
- **THEN** 系统SHALL返回当前用户的所有任务
- **AND** 任务SHALL按创建时间倒序排列
- **AND** 每条记录SHALL包含：id、audioUrl、audioFormat、status、created_at、updated_at

#### Scenario: 分页查询
- **WHEN** 用户指定page和page_size参数
- **THEN** 系统SHALL返回对应页的数据
- **AND** 响应SHALL包含：
  - items: 任务列表
  - total: 总记录数
  - page: 当前页
  - page_size: 每页条数

#### Scenario: 按状态筛选
- **WHEN** 用户指定status参数（如"completed"）
- **THEN** 系统SHALL仅返回匹配状态的任务

### Requirement: 删除任务

系统SHALL支持删除识别任务记录。

#### Scenario: 删除任务成功
- **WHEN** 用户请求删除任务（`DELETE /api/asr/tasks/:id`）
- **THEN** 系统SHALL验证任务属于当前用户
- **AND** 系统SHALL从数据库中删除任务记录
- **AND** 系统SHALL返回：
  ```json
  {
    "code": 0,
    "data": { "ok": true },
    "msg": "操作成功"
  }
  ```

#### Scenario: 删除他人任务
- **WHEN** 用户尝试删除不属于自己的任务
- **THEN** 系统SHALL返回403错误
- **AND** 响应消息SHALL为"无权操作该任务"

#### Scenario: 任务不存在
- **WHEN** 删除的任务ID不存在
- **THEN** 系统SHALL返回404错误
- **AND** 响应消息SHALL为"任务不存在"

### Requirement: 重试失败任务

系统SHALL支持重新查询失败任务的识别结果。

#### Scenario: 重试失败任务
- **WHEN** 用户请求重试任务（`POST /api/asr/tasks/:id/retry`）
- **THEN** 系统SHALL验证任务状态为"failed"
- **AND** 系统SHALL重新调用ASR查询API
- **AND** 系统SHALL根据结果更新任务状态和信息
- **AND** 系统SHALL返回最新的任务信息

#### Scenario: 重试非失败任务
- **WHEN** 任务状态不是"failed"
- **THEN** 系统SHALL返回400错误
- **AND** 响应消息SHALL为"只能重试失败的任务"

#### Scenario: 重试成功
- **WHEN** 重试后ASR API返回成功结果
- **THEN** 系统SHALL更新任务状态为"completed"
- **AND** 系统SHALL保存识别结果

### Requirement: 配置管理

系统SHALL支持通过配置文件管理ASR服务的各项参数。

#### Scenario: ASR配置项
- **GIVEN** 系统配置文件包含ASR配置段
- **THEN** 配置SHALL包含：
  - app_key: 火山引擎应用的APP ID
  - access_key: 火山引擎应用的Access Token
  - resource_id: 识别模型ID（如"volc.bigasr.auc"）
  - base_url: ASR API基础地址
  - timeout: API超时时间（秒）

#### Scenario: 配置验证
- **WHEN** 系统启动时
- **THEN** 系统SHALL验证ASR配置完整性
- **AND** 如果配置缺失关键项,系统SHALL记录警告日志
- **AND** ASR服务SHALL标记为不可用

### Requirement: 识别结果结构

系统SHALL使用标准化的结构存储和返回识别结果。

#### Scenario: 完整识别结果结构
- **WHEN** 识别任务完成
- **THEN** result字段SHALL包含：
  - text: 完整识别文本（String）
  - utterances: 句子数组（Array）

#### Scenario: utterances结构
- **WHEN** result包含utterances数组
- **THEN** 每个utterance SHALL包含：
  - text: 句子文本
  - start_time: 开始时间（毫秒）
  - end_time: 结束时间（毫秒）
  - speaker: 说话人ID（如启用说话人分离）
  - words: 单词数组（可选，包含词级时间戳）

#### Scenario: words结构
- **WHEN** utterance包含words数组
- **THEN** 每个word SHALL包含：
  - text: 单词文本
  - start_time: 开始时间（毫秒）
  - end_time: 结束时间（毫秒）

### Requirement: 安全控制

系统SHALL确保ASR服务的安全性,保护用户数据和系统资源。

#### Scenario: 用户认证
- **WHEN** 用户访问ASR相关接口
- **THEN** 系统SHALL验证JWT Token
- **AND** 未登录用户SHALL返回401错误

#### Scenario: 任务隔离
- **WHEN** 用户查询或操作任务
- **THEN** 系统SHALL验证任务属于当前用户
- **AND** 无权访问他人任务SHALL返回403错误

#### Scenario: 音频URL可访问性
- **WHEN** 用户提交识别任务时提供audioUrl
- **THEN** audioUrl SHALL为公网可访问的URL
- **AND** 建议使用TOS生成的预签名下载URL

### Requirement: 错误处理和日志

系统SHALL妥善处理ASR服务的各种异常情况,并记录关键操作。

#### Scenario: ASR API超时
- **WHEN** 调用ASR API超时
- **THEN** 系统SHALL返回500错误
- **AND** 响应消息SHALL提示"识别服务暂时不可用"
- **AND** 系统SHALL记录详细错误到日志

#### Scenario: 配置错误处理
- **WHEN** ASR配置不正确导致API调用失败
- **THEN** 系统SHALL返回500错误
- **AND** 响应消息SHALL提示"语音识别服务配置错误"
- **AND** 系统SHALL记录配置错误详情

#### Scenario: 记录关键操作
- **WHEN** 用户提交识别任务成功
- **THEN** 系统SHALL记录事件日志（如集成了EventLogService）
- **AND** 日志SHALL包含用户ID、任务ID、音频URL、提交时间

#### Scenario: 记录识别完成事件
- **WHEN** 识别任务完成
- **THEN** 系统SHALL记录事件日志
- **AND** 日志SHALL包含任务ID、识别耗时、是否成功

### Requirement: 性能优化

系统SHALL确保ASR服务的高性能和良好的用户体验。

#### Scenario: 异步处理
- **WHEN** 用户提交识别任务
- **THEN** 接口SHALL立即返回任务ID
- **AND** 识别过程SHALL在后台异步进行
- **AND** 接口响应时间SHALL少于1秒

#### Scenario: 轮询间隔建议
- **WHEN** 客户端实现轮询逻辑
- **THEN** 建议轮询间隔为3-5秒
- **AND** 避免过于频繁的请求导致性能问题

#### Scenario: 结果缓存
- **WHEN** 识别任务完成
- **THEN** 结果SHALL持久化到数据库
- **AND** 后续查询SHALL直接从数据库读取,无需重复调用ASR API

### Requirement: 数据库表设计

系统SHALL使用 `asr_tasks` 表存储识别任务记录。

#### Scenario: 表结构定义
- **GIVEN** 数据库表 `asr_tasks` 存在
- **THEN** 表SHALL包含以下字段：
  - id: VARCHAR(50)主键（UUID）
  - created_at: 创建时间
  - updated_at: 更新时间
  - user_id: 用户ID（VARCHAR(20)）
  - audio_url: 音频URL（TEXT）
  - audio_format: 音频格式（VARCHAR(20)）
  - status: 任务状态（VARCHAR(20)）
  - progress: 进度（INT, 0-100）
  - result: 识别结果（JSONB）
  - error_message: 错误信息（TEXT）
  - options: 识别选项（JSONB）

#### Scenario: 索引设计
- **GIVEN** `asr_tasks` 表有索引
- **THEN** 表SHALL创建以下索引：
  - idx_asr_tasks_user: (user_id, created_at DESC)
  - idx_asr_tasks_status: (status, created_at DESC)
  - idx_asr_tasks_time: (created_at DESC)

#### Scenario: 查询性能
- **WHEN** 查询用户的任务列表
- **THEN** 查询SHALL使用 `idx_asr_tasks_user` 索引
- **AND** 响应时间SHALL少于100毫秒

### Requirement: 任务状态定义

系统SHALL使用标准化的任务状态枚举。

#### Scenario: 任务状态类型
- **GIVEN** 系统定义任务状态
- **THEN** 状态SHALL包括：
  - pending: 等待提交（初始状态）
  - processing: 识别中
  - completed: 识别完成
  - failed: 识别失败

#### Scenario: 状态转换规则
- **WHEN** 任务从pending转为processing
- **THEN** 系统SHALL已成功调用ASR API提交任务
- **WHEN** 任务从processing转为completed
- **THEN** 系统SHALL已获取到完整识别结果
- **WHEN** 任务从processing转为failed
- **THEN** 系统SHALL已确认识别失败并记录错误

### Requirement: API响应格式

系统SHALL遵循项目统一的API响应格式。

#### Scenario: 成功响应格式
- **WHEN** ASR接口操作成功
- **THEN** 响应SHALL使用以下格式：
  ```json
  {
    "code": 0,
    "data": { /* 具体数据 */ },
    "msg": "操作成功"
  }
  ```

#### Scenario: 失败响应格式
- **WHEN** ASR接口操作失败
- **THEN** 响应SHALL使用以下格式：
  ```json
  {
    "code": 500,
    "data": null,
    "msg": "错误描述"
  }
  ```
- **AND** HTTP状态码仍为200

#### Scenario: 任务不存在响应
- **WHEN** 查询不存在的任务
- **THEN** code SHALL为404
- **AND** msg SHALL为"任务不存在"

### Requirement: 兼容性和扩展性

系统SHALL确保ASR服务的向后兼容性和未来扩展性。

#### Scenario: 配置开关
- **WHEN** ASR配置未设置或设置为禁用
- **THEN** ASR相关接口SHALL返回"服务未启用"错误
- **AND** 系统SHALL不尝试调用ASR API

#### Scenario: 识别选项扩展
- **WHEN** 需要支持新的识别选项
- **THEN** 系统SHALL使用 `options` JSONB字段存储
- **AND** 无需修改数据库表结构

#### Scenario: 支持多种识别模型
- **WHEN** 需要支持不同的识别模型
- **THEN** 系统SHALL通过配置的resource_id切换模型
- **AND** 代码逻辑无需修改

#### Scenario: 结果格式扩展
- **WHEN** ASR API返回新的结果字段
- **THEN** 系统SHALL将完整结果存储到result JSONB字段
- **AND** 前端可选择性使用新字段
