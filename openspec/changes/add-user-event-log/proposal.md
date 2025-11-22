# Change: 用户关键操作日志系统

## Why

系统当前缺乏对用户关键操作的持久化记录，导致以下问题：
- 无法追踪用户行为路径（注册→登录→使用→付费）
- 安全事件（异常登录、密码重置）无法审计
- 错误排查困难，缺少用户上下文
- 运营数据分析依赖有限，无法评估功能使用情况
- 后续付费消费无法准确记录和对账

需要建立一个统一的、可查询的用户事件日志系统，记录所有关键操作。

## What Changes

### 数据库改动
- **新增表**: `user_event_logs` - 用户事件日志表
  - 主键：自增ID
  - 时间索引：高效按时间范围查询
  - 用户索引：快速查询某用户的所有操作
  - 事件类型索引：按事件类型统计分析
  - 支持JSON字段存储事件详情

### 后端改进
- **日志服务层**: 统一的事件记录接口
- **事件类型定义**: 枚举所有需要记录的事件
- **异步记录**: 不阻塞主业务流程
- **查询API**: 管理员可查询日志（支持筛选和分页）

### 记录的事件类型
**认证相关**:
- 发送验证码 (sms_sent)
- 用户注册 (user_register)
- 用户登录 (user_login)
- 登录失败 (login_failed)
- 密码重置 (password_reset)
- 密码修改 (password_change)
- 退出登录 (user_logout)

**用户操作**:
- 修改用户资料 (profile_update)
- 上传头像 (avatar_upload)

**简历操作**:
- 上传简历 (resume_upload)
- 简历优化 (resume_optimize)
- 导出简历 (resume_export)

**系统事件**:
- 业务错误 (business_error)
- 系统错误 (system_error)

**付费相关**（预留）:
- 付费订单创建 (order_create)
- 支付成功 (payment_success)
- 支付失败 (payment_failed)
- 余额变动 (balance_change)

## Impact

### Affected specs
- `audit-log` (新capability)：审计日志和事件记录规范

### Affected code

**数据库（PostgreSQL）**:
- 新增表 `user_event_logs`
- 创建时间索引和用户索引
- 迁移脚本

**后端（Go）**:
- `server/model/event_log.go` - 数据模型
- `server/service/eventlog/` - 新服务包
  - `event_log_service.go` - 事件记录服务
  - `types.go` - 事件类型定义
- `server/api/eventlog/` - 新API包
  - `event_log.go` - 日志查询接口
- `server/router/eventlog.go` - 新路由
- 现有业务代码埋点（Login、Register等）

**前端（React + TypeScript）** - 可选:
- `web/src/pages/admin/components/EventLogViewer.tsx` - 管理员查看日志界面

### 兼容性
- **完全向后兼容**：新增功能，不影响现有业务
- **逐步接入**：可先记录关键事件，后续逐步完善
- **性能影响极小**：异步记录，不阻塞主流程

### 优先级
- **P0 - 最高优先级**
- 先于密码认证增强功能实现
- 为后续所有功能提供审计能力

