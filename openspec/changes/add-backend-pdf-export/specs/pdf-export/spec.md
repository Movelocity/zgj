# PDF Export Capability

## ADDED Requirements

### Requirement: 导出任务创建
系统 SHALL 允许用户创建PDF导出任务，生成简历内容快照并加入导出队列。

#### Scenario: 用户创建导出任务
- **WHEN** 用户在简历编辑页点击"服务端导出"按钮
- **THEN** 系统调用 POST `/api/resume/export/create` API，传递简历ID
- **AND** 系统生成唯一的任务ID（TLID）
- **AND** 系统保存简历的 `structured_data` 快照到任务记录
- **AND** 系统生成一次性验证token（UUID v4）
- **AND** 系统设置任务状态为 `pending`
- **AND** 系统将任务推送到内存队列
- **AND** 返回任务ID给前端

#### Scenario: 创建任务时简历不存在
- **WHEN** 用户请求导出不存在的简历
- **THEN** 系统返回错误响应（code: 404, msg: "简历不存在"）
- **AND** 不创建任务记录

#### Scenario: 创建任务时用户无权限
- **WHEN** 用户请求导出其他用户的简历
- **THEN** 系统返回错误响应（code: 403, msg: "无权限访问该简历"）
- **AND** 不创建任务记录

### Requirement: 任务队列管理
系统 SHALL 使用内存队列管理导出任务，并通过goroutine消费者异步处理。

#### Scenario: 任务推送到队列
- **WHEN** 导出任务创建成功
- **THEN** 系统将任务ID推送到Go channel队列
- **AND** 队列容量为100
- **AND** 如果队列已满，返回错误提示"导出服务繁忙，请稍后重试"

#### Scenario: 消费者从队列获取任务
- **WHEN** 系统启动时
- **THEN** 系统启动3个goroutine消费者（可配置）
- **AND** 每个消费者持续从队列中获取任务ID
- **AND** 获取到任务后，更新任务状态为 `processing`
- **AND** 调用Node.js服务生成PDF
- **AND** 等待Node.js回调或超时（120秒）

#### Scenario: 任务处理超时
- **WHEN** 任务处理时间超过120秒
- **THEN** 系统标记任务状态为 `failed`
- **AND** 记录错误信息"任务超时"
- **AND** 释放消费者继续处理下一个任务

### Requirement: Node.js服务调用
系统 SHALL 通过HTTP POST调用独立的Node.js服务生成PDF文件。

#### Scenario: Go调用Node.js生成PDF
- **WHEN** 消费者获取到导出任务
- **THEN** 系统构建渲染URL：`{render_base_url}/export/{taskId}?token={token}`
- **AND** 系统调用Node.js服务 POST `/generate` API
- **AND** 请求体包含：task_id, render_url, callback_url, options
- **AND** 设置HTTP超时为120秒

#### Scenario: Node.js服务不可用
- **WHEN** Node.js服务未启动或网络不通
- **THEN** 系统重试最多3次，每次间隔5秒
- **AND** 3次重试失败后，标记任务为 `failed`
- **AND** 记录错误信息"PDF服务不可用"

#### Scenario: Node.js服务返回错误
- **WHEN** Node.js服务返回非200状态码
- **THEN** 系统标记任务为 `failed`
- **AND** 记录Node.js返回的错误信息

### Requirement: Puppeteer PDF生成
Node.js服务 SHALL 使用Puppeteer无头浏览器访问渲染页面并生成PDF文件。

#### Scenario: Puppeteer访问渲染页面
- **WHEN** Node.js服务收到 `/generate` 请求
- **THEN** 服务启动Puppeteer无头浏览器实例
- **AND** 设置视口为A4尺寸（210mm × 297mm）
- **AND** 访问 `render_url`（包含token参数）
- **AND** 等待页面完全加载（networkidle0）
- **AND** 超时设置为60秒

#### Scenario: Puppeteer生成PDF文件
- **WHEN** 渲染页面加载完成
- **THEN** Puppeteer调用 `page.pdf()` 方法
- **AND** PDF配置：format='A4', printBackground=true, margin='2rem'
- **AND** 生成PDF文件到临时目录
- **AND** 关闭浏览器实例释放资源

#### Scenario: Puppeteer渲染失败
- **WHEN** 渲染页面加载超时或出错
- **THEN** Node.js服务捕获错误
- **AND** 关闭浏览器实例
- **AND** 通过callback API返回失败状态和错误信息

### Requirement: PDF文件回传
Node.js服务 SHALL 通过HTTP POST multipart/form-data将生成的PDF文件和结果回传给Go后端。

#### Scenario: 成功回传PDF文件
- **WHEN** Puppeteer生成PDF成功
- **THEN** Node.js服务构建multipart/form-data请求
- **AND** 包含字段：task_id, status='success', pdf_file（二进制）
- **AND** POST到 `callback_url`（Go后端 `/api/resume/export/callback`）
- **AND** 删除临时PDF文件

#### Scenario: Go接收PDF文件
- **WHEN** Go后端收到callback请求
- **THEN** 系统验证 `task_id` 存在且状态为 `processing`
- **AND** 系统保存PDF文件到 `server/uploads/pdf/YYYY-MM-DD/{taskId}.pdf`
- **AND** 系统更新任务状态为 `completed`
- **AND** 系统记录 `pdf_file_path` 和 `completed_at` 时间
- **AND** 返回成功响应给Node.js服务

#### Scenario: 回传失败处理
- **WHEN** Node.js服务回传PDF失败（网络错误）
- **THEN** Node.js服务重试最多3次
- **AND** 3次失败后记录日志
- **AND** 不删除临时PDF文件（便于排查）

### Requirement: 任务状态查询
系统 SHALL 提供API允许前端轮询任务状态。

#### Scenario: 查询任务状态
- **WHEN** 前端调用 GET `/api/resume/export/status/:taskId`
- **THEN** 系统查询数据库中的任务记录
- **AND** 返回任务状态（pending/processing/completed/failed）
- **AND** 如果状态为 `completed`，返回下载URL
- **AND** 如果状态为 `failed`，返回错误信息

#### Scenario: 查询不存在的任务
- **WHEN** 任务ID不存在
- **THEN** 系统返回错误响应（code: 404, msg: "任务不存在"）

#### Scenario: 查询其他用户的任务
- **WHEN** 用户查询非自己创建的任务
- **THEN** 系统返回错误响应（code: 403, msg: "无权限查看该任务"）

### Requirement: PDF文件下载
系统 SHALL 提供API允许用户下载生成的PDF文件。

#### Scenario: 下载完成的PDF
- **WHEN** 用户访问 GET `/api/resume/export/download/:taskId`
- **THEN** 系统验证任务存在且状态为 `completed`
- **AND** 系统验证用户为任务创建者
- **AND** 系统读取 `pdf_file_path` 指向的文件
- **AND** 返回PDF文件流（Content-Type: application/pdf）
- **AND** 设置Content-Disposition头（filename="{简历名称}_{日期}.pdf"）

#### Scenario: 下载未完成的任务
- **WHEN** 任务状态不是 `completed`
- **THEN** 系统返回错误响应（code: 400, msg: "PDF尚未生成完成"）

#### Scenario: PDF文件不存在
- **WHEN** 任务状态为 `completed` 但文件已被删除
- **THEN** 系统返回错误响应（code: 404, msg: "PDF文件不存在或已过期"）

### Requirement: 独立渲染页面
系统 SHALL 提供独立的前端页面用于渲染简历内容供Puppeteer访问。

#### Scenario: 访问渲染页面
- **WHEN** Puppeteer访问 `/export/:taskId?token=xxx`
- **THEN** 前端React路由匹配到 `ResumeExportView` 组件
- **AND** 组件从URL提取 `taskId` 和 `token`
- **AND** 组件调用后端API验证token并获取简历数据
- **AND** 组件渲染简历内容（与编辑页样式一致，去除交互元素）

#### Scenario: Token验证成功
- **WHEN** 前端调用token验证API
- **THEN** 后端验证token存在且未使用
- **AND** 后端标记token为已使用（token_used=true）
- **AND** 后端返回简历快照数据（resume_snapshot）
- **AND** 前端渲染简历内容

#### Scenario: Token验证失败
- **WHEN** token无效、已使用或过期
- **THEN** 后端返回错误响应（code: 401, msg: "无效的访问令牌"）
- **AND** 前端显示错误提示"页面已失效"

#### Scenario: 渲染页面样式
- **WHEN** 渲染页面加载完成
- **THEN** 页面应用A4打印样式
- **AND** 页面宽度固定为210mm
- **AND** 页面背景为白色
- **AND** 移除所有交互按钮和编辑功能
- **AND** 应用 `print-color-adjust: exact` 确保色彩保持

### Requirement: 前端状态轮询
前端 SHALL 在创建任务后轮询任务状态，并显示进度提示。

#### Scenario: 创建任务后开始轮询
- **WHEN** 用户点击"服务端导出"并成功创建任务
- **THEN** 前端显示进度提示"正在生成PDF，请稍候..."
- **AND** 前端开始轮询任务状态，每2秒请求一次
- **AND** 最多轮询60次（总计120秒）

#### Scenario: 任务完成停止轮询
- **WHEN** 轮询返回状态为 `completed`
- **THEN** 前端停止轮询
- **AND** 前端显示成功提示"PDF生成完成"
- **AND** 前端显示下载按钮，点击后下载PDF文件

#### Scenario: 任务失败停止轮询
- **WHEN** 轮询返回状态为 `failed`
- **THEN** 前端停止轮询
- **AND** 前端显示错误提示（包含错误信息）

#### Scenario: 轮询超时
- **WHEN** 轮询60次后任务仍未完成
- **THEN** 前端停止轮询
- **AND** 前端显示提示"PDF生成超时，请稍后查看导出历史"

### Requirement: 配置管理
系统 SHALL 支持通过配置文件管理PDF导出服务的参数。

#### Scenario: 配置项定义
- **WHEN** 系统启动时
- **THEN** 系统从 `config.yaml` 读取 `pdf_export` 配置节
- **AND** 配置包含：node_service_url（Node.js服务地址）
- **AND** 配置包含：render_base_url（Puppeteer访问的基础URL）
- **AND** 配置包含：queue_size（队列容量，默认100）
- **AND** 配置包含：worker_count（消费者数量，默认3）
- **AND** 配置包含：task_timeout（任务超时秒数，默认120）
- **AND** 配置包含：max_retries（最大重试次数，默认3）

#### Scenario: 配置验证
- **WHEN** 系统启动时
- **THEN** 系统验证 `node_service_url` 和 `render_base_url` 不为空
- **AND** 如果配置缺失或无效，系统记录警告日志
- **AND** 系统使用默认值启动

### Requirement: 数据库模型
系统 SHALL 定义 `pdf_export_tasks` 表存储导出任务记录。

#### Scenario: 表结构定义
- **WHEN** 系统首次启动或迁移
- **THEN** GORM自动创建 `pdf_export_tasks` 表
- **AND** 表包含字段：id, user_id, resume_id, resume_snapshot, status, token, token_used, pdf_file_path, error_message, retry_count, created_at, updated_at, completed_at
- **AND** 创建索引：idx_user_id, idx_status, idx_token

#### Scenario: 数据完整性
- **WHEN** 插入或更新任务记录
- **THEN** 系统验证 `user_id` 和 `resume_id` 外键存在
- **AND** 系统验证 `status` 为枚举值之一（pending/processing/completed/failed）
- **AND** 系统自动更新 `updated_at` 时间戳

### Requirement: 错误处理和日志
系统 SHALL 记录详细的错误日志和事件日志，便于排查问题。

#### Scenario: 记录导出事件
- **WHEN** 用户创建导出任务
- **THEN** 系统记录事件日志（event_type="pdf_export_create"）
- **AND** 日志包含：user_id, task_id, resume_id

#### Scenario: 记录成功事件
- **WHEN** PDF生成成功
- **THEN** 系统记录事件日志（event_type="pdf_export_success"）
- **AND** 日志包含：task_id, duration（处理耗时）

#### Scenario: 记录失败事件
- **WHEN** PDF生成失败
- **THEN** 系统记录事件日志（event_type="pdf_export_failed"）
- **AND** 日志包含：task_id, error_message, retry_count

#### Scenario: 记录Node.js调用
- **WHEN** Go调用Node.js服务
- **THEN** 系统记录调用日志（请求URL、响应状态、耗时）
- **AND** 如果调用失败，记录错误详情

### Requirement: 安全性
系统 SHALL 确保导出功能的安全性，防止未授权访问和滥用。

#### Scenario: 任务创建权限验证
- **WHEN** 用户创建导出任务
- **THEN** 系统验证用户已登录（JWT认证）
- **AND** 系统验证用户有权访问目标简历

#### Scenario: 任务查询权限验证
- **WHEN** 用户查询或下载任务
- **THEN** 系统验证用户为任务创建者
- **AND** 非创建者无法查看任务状态或下载PDF

#### Scenario: 渲染页面Token安全
- **WHEN** 生成渲染页面URL
- **THEN** 系统生成随机UUID作为token
- **AND** token只能使用一次（验证后标记为已使用）
- **AND** token有效期10分钟（创建时间+10分钟）
- **AND** 过期或已使用的token无法访问简历数据

#### Scenario: 防止路径遍历攻击
- **WHEN** 系统读取或保存PDF文件
- **THEN** 系统验证文件路径在允许的目录内
- **AND** 禁止使用 `..` 等路径遍历字符
- **AND** 使用白名单验证文件扩展名（.pdf）

### Requirement: 性能和资源管理
系统 SHALL 合理管理资源，防止过度消耗。

#### Scenario: 并发控制
- **WHEN** 多个导出请求同时到达
- **THEN** 系统通过队列容量限制排队任务数（100）
- **AND** 系统通过消费者数量限制并发处理数（3）
- **AND** 超过队列容量的请求返回"服务繁忙"错误

#### Scenario: Puppeteer资源清理
- **WHEN** Puppeteer生成PDF后
- **THEN** Node.js服务立即关闭浏览器实例
- **AND** Node.js服务删除临时文件
- **AND** 如果进程崩溃，系统重启时清理孤立的浏览器进程

#### Scenario: 文件清理策略
- **WHEN** PDF文件存储超过30天（未来功能）
- **THEN** 定时任务自动删除过期文件
- **AND** 保留任务记录但清空 `pdf_file_path`
- **AND** 用户访问过期任务时提示"文件已过期"

