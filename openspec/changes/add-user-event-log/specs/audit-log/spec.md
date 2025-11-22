## ADDED Requirements

### Requirement: 事件日志持久化存储

系统SHALL将所有关键用户操作和系统事件持久化存储到数据库，以支持审计、分析和问题排查。

#### Scenario: 记录用户登录成功事件
- **WHEN** 用户成功登录系统
- **THEN** 系统SHALL在 `user_event_logs` 表中创建一条记录
- **AND** 记录SHALL包含：用户ID、事件类型(user_login)、IP地址、User-Agent、时间戳、状态(success)

#### Scenario: 记录登录失败事件
- **WHEN** 用户登录失败（密码错误、账号不存在等）
- **THEN** 系统SHALL记录登录失败事件（event_type: login_failed）
- **AND** 记录SHALL包含：手机号、失败原因、IP地址、状态(failed)
- **AND** 用户ID字段可为空（因为可能账号不存在）

#### Scenario: 记录用户注册事件
- **WHEN** 用户成功注册账号
- **THEN** 系统SHALL记录用户注册事件（event_type: user_register）
- **AND** 记录SHALL包含：新用户ID、IP地址、User-Agent、是否使用邀请码

#### Scenario: 记录验证码发送事件
- **WHEN** 系统发送短信验证码给用户
- **THEN** 系统SHALL记录验证码发送事件（event_type: sms_sent）
- **AND** 记录SHALL包含：手机号、发送时间、发送状态（成功/失败）

#### Scenario: 记录密码重置事件
- **WHEN** 用户通过短信验证码重置密码成功
- **THEN** 系统SHALL记录密码重置事件（event_type: password_reset）
- **AND** 记录SHALL包含：用户ID、IP地址、重置时间

#### Scenario: 记录密码修改事件
- **WHEN** 用户在个人中心修改密码成功
- **THEN** 系统SHALL记录密码修改事件（event_type: password_change）
- **AND** 记录SHALL包含：用户ID、IP地址、修改时间

### Requirement: 事件日志查询接口

系统SHALL提供管理员接口，支持按多种条件查询和筛选事件日志。

#### Scenario: 按用户ID查询日志
- **WHEN** 管理员请求查询特定用户的操作日志
- **THEN** 系统SHALL返回该用户的所有事件记录，按时间倒序排列
- **AND** 结果SHALL支持分页

#### Scenario: 按事件类型查询日志
- **WHEN** 管理员请求查询特定类型的事件（如所有登录失败）
- **THEN** 系统SHALL返回匹配该事件类型的所有记录
- **AND** 结果SHALL按时间倒序排列

#### Scenario: 按时间范围查询日志
- **WHEN** 管理员指定时间范围（开始时间和结束时间）
- **THEN** 系统SHALL返回该时间范围内的所有事件记录
- **AND** 查询SHALL使用时间索引保证性能

#### Scenario: 组合条件查询
- **WHEN** 管理员同时指定用户ID、事件类型、时间范围等多个条件
- **THEN** 系统SHALL返回满足所有条件的事件记录
- **AND** 查询响应时间SHALL少于500毫秒（在有索引的情况下）

#### Scenario: 分页查询
- **WHEN** 管理员请求查询日志并指定页码和每页条数
- **THEN** 系统SHALL返回对应页的数据
- **AND** 响应SHALL包含总记录数、当前页、每页条数
- **AND** 每页最多返回100条记录

### Requirement: 事件日志数据结构

系统SHALL使用统一的数据结构存储所有事件日志，确保可扩展性和查询效率。

#### Scenario: 存储事件基本信息
- **WHEN** 记录任何事件
- **THEN** 系统SHALL存储以下必填字段：
  - 自增主键ID
  - 创建时间（created_at）
  - 用户ID（user_id，可为空）
  - 事件类型（event_type）
  - 事件分类（event_category）
  - 状态（status: success/failed/error）

#### Scenario: 存储安全相关信息
- **WHEN** 记录认证相关事件（登录、注册、密码操作）
- **THEN** 系统SHALL存储IP地址和User-Agent
- **AND** IP地址字段SHALL支持IPv6（最长45字符）

#### Scenario: 存储事件详情
- **WHEN** 事件包含额外的上下文信息
- **THEN** 系统SHALL将详情存储在 `details` JSONB字段中
- **AND** 详情字段SHALL仅包含必要信息，不得包含敏感数据（如密码原文）

#### Scenario: 关联业务资源
- **WHEN** 事件涉及具体业务资源（如简历、订单）
- **THEN** 系统SHALL记录资源类型（resource_type）和资源ID（resource_id）
- **AND** 这些字段SHALL便于后续关联查询

### Requirement: 事件记录性能要求

系统SHALL确保事件日志记录不影响主业务性能。

#### Scenario: 同步记录不阻塞主流程
- **WHEN** 系统记录事件日志
- **THEN** 单次记录操作SHALL在5毫秒内完成
- **AND** 记录失败SHALL不导致主业务失败
- **AND** 记录失败SHALL记录到系统错误日志

#### Scenario: 数据库写入优化
- **WHEN** 系统执行日志写入
- **THEN** 系统SHALL使用数据库连接池复用连接
- **AND** 系统SHALL使用单条INSERT语句，不使用事务（提高性能）

### Requirement: 事件类型定义

系统SHALL支持以下事件类型，并预留扩展能力。

#### Scenario: 认证事件类型
- **GIVEN** 系统支持以下认证相关事件类型：
  - `sms_sent` - 发送验证码
  - `user_register` - 用户注册
  - `user_login` - 用户登录
  - `login_failed` - 登录失败
  - `password_reset` - 密码重置
  - `password_change` - 密码修改
  - `user_logout` - 退出登录
- **WHEN** 发生上述操作时
- **THEN** 系统SHALL使用对应的事件类型记录

#### Scenario: 用户操作事件类型
- **GIVEN** 系统支持以下用户操作事件类型：
  - `profile_update` - 修改用户资料
  - `avatar_upload` - 上传头像
- **WHEN** 用户执行上述操作时
- **THEN** 系统SHALL记录对应事件

#### Scenario: 简历操作事件类型
- **GIVEN** 系统支持以下简历操作事件类型：
  - `resume_upload` - 上传简历
  - `resume_optimize` - 简历优化
  - `resume_export` - 导出简历
- **WHEN** 用户执行简历相关操作时
- **THEN** 系统SHALL记录对应事件

#### Scenario: 系统事件类型
- **GIVEN** 系统支持以下系统事件类型：
  - `business_error` - 业务逻辑错误
  - `system_error` - 系统错误
- **WHEN** 发生错误时
- **THEN** 系统SHALL记录错误事件和详细信息

#### Scenario: 付费事件类型（预留）
- **GIVEN** 系统为未来付费功能预留以下事件类型：
  - `order_create` - 创建订单
  - `payment_success` - 支付成功
  - `payment_failed` - 支付失败
  - `balance_change` - 余额变动
- **WHEN** 实现付费功能后
- **THEN** 系统SHALL使用这些事件类型记录交易

### Requirement: 数据库索引优化

系统SHALL为事件日志表创建合适的索引，确保查询性能。

#### Scenario: 时间索引支持时间范围查询
- **GIVEN** 事件日志表有时间字段索引（created_at DESC）
- **WHEN** 查询指定时间范围的日志
- **THEN** 数据库SHALL使用时间索引
- **AND** 查询响应时间SHALL少于100毫秒（对于百万级数据）

#### Scenario: 用户索引支持用户维度查询
- **GIVEN** 事件日志表有组合索引（user_id, created_at DESC）
- **WHEN** 查询某用户的操作历史
- **THEN** 数据库SHALL使用用户索引
- **AND** 查询响应时间SHALL少于50毫秒

#### Scenario: 事件类型索引支持统计分析
- **GIVEN** 事件日志表有组合索引（event_type, created_at DESC）
- **WHEN** 统计某类事件的数量或查询某类事件列表
- **THEN** 数据库SHALL使用事件类型索引
- **AND** 查询效率SHALL明显优于全表扫描

### Requirement: 管理员权限控制

系统SHALL确保只有管理员可以查询事件日志，保护用户隐私。

#### Scenario: 管理员可访问日志查询接口
- **WHEN** 具有管理员角色（role: 888）的用户请求查询事件日志
- **THEN** 系统SHALL允许访问并返回查询结果

#### Scenario: 普通用户无法访问日志查询接口
- **WHEN** 普通用户（role: 666）尝试访问事件日志查询接口
- **THEN** 系统SHALL返回403 Forbidden错误
- **AND** 响应消息SHALL为"无权访问"

#### Scenario: 未登录用户无法访问
- **WHEN** 未登录用户尝试访问事件日志查询接口
- **THEN** 系统SHALL返回401 Unauthorized错误
- **AND** 响应消息SHALL为"未登录或登录已过期"

### Requirement: 日志记录可靠性

系统SHALL确保关键事件日志不丢失，即使在异常情况下。

#### Scenario: 数据库写入失败不影响主业务
- **WHEN** 事件日志写入数据库失败（如数据库暂时不可用）
- **THEN** 主业务流程SHALL继续执行，不返回错误给用户
- **AND** 系统SHALL将写入失败记录到系统错误日志
- **AND** 系统SHALL记录失败的事件信息，便于后续补录

#### Scenario: 日志记录代码异常不影响主业务
- **WHEN** 日志记录代码抛出异常（如JSON序列化失败）
- **THEN** 系统SHALL捕获异常并恢复
- **AND** 主业务流程SHALL继续执行
- **AND** 异常信息SHALL记录到系统错误日志

