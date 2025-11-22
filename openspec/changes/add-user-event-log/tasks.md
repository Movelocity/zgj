# Implementation Tasks - 用户事件日志系统

## 1. 数据库设计和迁移
- [ ] 1.1 创建数据库迁移脚本 `scripts/migration_add_event_logs.sql`
  - [ ] 创建 `user_event_logs` 表
  - [ ] 创建时间索引 `idx_user_event_logs_time`
  - [ ] 创建用户索引 `idx_user_event_logs_user`
  - [ ] 创建事件类型索引 `idx_user_event_logs_type`
  - [ ] 创建事件分类索引 `idx_user_event_logs_category`
- [ ] 1.2 执行迁移脚本并验证

## 2. 后端 - 数据模型定义
- [ ] 2.1 创建 `server/model/event_log.go`
  - [ ] 定义 `EventLog` 结构体（对应数据库表）
  - [ ] 实现 `TableName()` 方法
  - [ ] 定义 `JSON` 类型用于details字段
- [ ] 2.2 在 `server/model/enter.go` 中注册模型（如需要）

## 3. 后端 - 服务层实现
- [ ] 3.1 创建 `server/service/eventlog/` 目录
- [ ] 3.2 创建 `server/service/eventlog/types.go`
  - [ ] 定义事件类型常量（EventUserLogin, EventUserRegister等）
  - [ ] 定义事件分类常量（CategoryAuth, CategoryUser等）
  - [ ] 定义 `QueryRequest` 结构体
  - [ ] 定义 `QueryResponse` 结构体
- [ ] 3.3 创建 `server/service/eventlog/event_log_service.go`
  - [ ] 实现 `Log(event *EventLog) error` 方法
  - [ ] 实现 `Query(req *QueryRequest) (*QueryResponse, error)` 方法
  - [ ] 实现快捷记录函数（LogUserLogin, LogLoginFailed等）
- [ ] 3.4 在 `server/service/enter.go` 中注册服务

## 4. 后端 - API接口实现（管理员查询）
- [ ] 4.1 创建 `server/api/eventlog/` 目录
- [ ] 4.2 创建 `server/api/eventlog/event_log.go`
  - [ ] 实现 `QueryEventLogs(c *gin.Context)` - 查询日志接口
  - [ ] 参数验证和分页处理
- [ ] 4.3 创建 `server/router/eventlog.go`
  - [ ] 注册管理员路由 `GET /api/admin/event-logs`
- [ ] 4.4 在 `server/initialize/router.go` 中初始化路由

## 5. 后端 - 认证相关埋点
- [ ] 5.1 修改 `server/api/user/user.go` 的 `SendSMS` 函数
  - [ ] 发送成功记录事件（EventSMSSent）
  - [ ] 发送失败记录事件（status: failed）
- [ ] 5.2 修改 `server/api/user/user.go` 的 `Register` 函数
  - [ ] 注册成功记录事件（EventUserRegister）
  - [ ] 注册失败记录事件（status: failed）
- [ ] 5.3 修改 `server/api/user/user.go` 的 `Login` 函数
  - [ ] 登录成功记录事件（EventUserLogin）
  - [ ] 登录失败记录事件（EventLoginFailed）
- [ ] 5.4 修改 `server/api/user/user.go` 的 `ResetPassword` 函数
  - [ ] 密码重置成功记录事件（EventPasswordReset）
- [ ] 5.5 修改 `server/api/user/user.go` 的 `ChangePassword` 函数
  - [ ] 密码修改成功记录事件（EventPasswordChange）
- [ ] 5.6 修改 `server/api/user/user.go` 的 `Logout` 函数
  - [ ] 退出登录记录事件（EventUserLogout）
- [ ] 5.7 修改 `server/api/user/user.go` 的 `UnifiedAuth` 函数
  - [ ] 统一认证成功记录事件

## 6. 后端 - 用户操作埋点
- [ ] 6.1 修改 `server/api/user/user.go` 的 `UpdateUserProfile` 函数
  - [ ] 资料更新成功记录事件（EventProfileUpdate）
- [ ] 6.2 修改 `server/api/user/user.go` 的 `UploadAvatar` 函数
  - [ ] 头像上传成功记录事件（EventAvatarUpload）

## 7. 后端 - 简历操作埋点（可选，根据现有接口）
- [ ] 7.1 在简历上传接口添加日志记录（EventResumeUpload）
- [ ] 7.2 在简历优化接口添加日志记录（EventResumeOptimize）
- [ ] 7.3 在简历导出接口添加日志记录（EventResumeExport）

## 8. 后端 - 错误记录（可选）
- [ ] 8.1 在全局错误处理中间件添加系统错误记录
  - [ ] 记录500错误（EventSystemError）
- [ ] 8.2 在业务错误处理添加记录
  - [ ] 记录业务逻辑错误（EventBusinessError）

## 9. 前端 - 管理员日志查看界面（可选）
- [ ] 9.1 创建 `web/src/api/eventlog.ts`
  - [ ] 实现 `queryEventLogs` API调用
- [ ] 9.2 创建 `web/src/pages/admin/components/EventLogViewer.tsx`
  - [ ] 实现日志列表展示
  - [ ] 实现筛选条件（用户、事件类型、时间范围）
  - [ ] 实现分页
  - [ ] 实现详情展开（details字段）
- [ ] 9.3 在管理员页面添加入口

## 10. 测试和验证
- [ ] 10.1 单元测试
  - [ ] 测试 `EventLogService.Log` 方法
  - [ ] 测试 `EventLogService.Query` 方法
- [ ] 10.2 集成测试
  - [ ] 测试各个埋点是否正确记录
  - [ ] 测试查询接口（筛选、分页）
- [ ] 10.3 性能测试
  - [ ] 测试日志记录对主业务的影响（应<5ms）
  - [ ] 测试查询性能（有索引应<100ms）
- [ ] 10.4 数据验证
  - [ ] 执行各种操作，验证日志记录完整性
  - [ ] 验证索引有效性

## 11. 文档更新
- [ ] 11.1 更新后端API文档
  - [ ] 添加事件日志查询接口说明
  - [ ] 添加事件类型列表
- [ ] 11.2 创建运维文档
  - [ ] 数据库表结构说明
  - [ ] 日志查询示例SQL
  - [ ] 日志保留策略（建议）

## 实现顺序建议

### Phase 1: 基础设施（P0）
- 任务 1: 数据库
- 任务 2: 数据模型
- 任务 3: 服务层

### Phase 2: 认证埋点（P0）
- 任务 5: 认证相关埋点（最重要）

### Phase 3: 查询功能（P1）
- 任务 4: API接口

### Phase 4: 其他埋点（P1）
- 任务 6: 用户操作
- 任务 7: 简历操作

### Phase 5: 管理界面（P2）
- 任务 9: 前端界面

### Phase 6: 测试和文档（P1）
- 任务 10: 测试
- 任务 11: 文档

