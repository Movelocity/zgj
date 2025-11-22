# Implementation Tasks - 用户事件日志系统

## 1. 数据库设计和迁移
- [x] 1.1 创建 `server/model/event_log.go` 定义模型和索引
  - [x] 定义 EventLog 结构体（包含所有字段和索引标签）
  - [x] 实现 TableName() 方法
- [x] 1.2 在 `server/initialize/db.go` 的 AutoMigrate 中注册 EventLog 模型
- [ ] 1.3 重启服务验证表和索引创建成功

## 2. 后端 - 数据模型定义
- [x] 2.1 创建 `server/model/event_log.go`
  - [x] 定义 `EventLog` 结构体（对应数据库表）
  - [x] 实现 `TableName()` 方法
  - [x] 定义 `JSON` 类型用于details字段（已存在）
- [x] 2.2 在 `server/model/enter.go` 中注册模型（不需要，JSON类型已存在）

## 3. 后端 - 服务层实现
- [x] 3.1 创建 `server/service/eventlog/` 目录
- [x] 3.2 创建 `server/service/eventlog/types.go`
  - [x] 定义事件类型常量（EventUserLogin, EventUserRegister等）
  - [x] 定义事件分类常量（CategoryAuth, CategoryUser等）
  - [x] 定义 `QueryRequest` 结构体
  - [x] 定义 `QueryResponse` 结构体
- [x] 3.3 创建 `server/service/eventlog/event_log_service.go`
  - [x] 实现 `Log(event *EventLog) error` 方法
  - [x] 实现 `Query(req *QueryRequest) (*QueryResponse, error)` 方法
  - [x] 实现快捷记录函数（LogUserLogin, LogLoginFailed等）
- [x] 3.4 在 `server/service/enter.go` 中注册服务

## 4. 后端 - API接口实现（管理员查询）
- [x] 4.1 创建 `server/api/eventlog/` 目录
- [x] 4.2 创建 `server/api/eventlog/event_log.go`
  - [x] 实现 `QueryEventLogs(c *gin.Context)` - 查询日志接口
  - [x] 参数验证和分页处理
- [x] 4.3 创建 `server/router/eventlog.go`
  - [x] 注册管理员路由 `GET /api/admin/event-logs`
- [x] 4.4 在 `server/initialize/router.go` 中初始化路由

## 5. 后端 - 认证相关埋点
- [x] 5.1 修改 `server/api/user/user.go` 的 `SendSMS` 函数
  - [x] 发送成功记录事件（EventSMSSent）
  - [x] 发送失败记录事件（status: failed）
- [x] 5.2 修改 `server/api/user/user.go` 的 `Register` 函数
  - [x] 注册成功记录事件（EventUserRegister）
  - [x] 注册失败记录事件（status: failed）
- [x] 5.3 修改 `server/api/user/user.go` 的 `Login` 函数
  - [x] 登录成功记录事件（EventUserLogin）
  - [x] 登录失败记录事件（EventLoginFailed）
- [x] 5.4 修改 `server/api/user/user.go` 的 `ResetPassword` 函数
  - [x] 密码重置成功记录事件（EventPasswordReset）
- [x] 5.5 修改 `server/api/user/user.go` 的 `ChangePassword` 函数
  - [x] 密码修改成功记录事件（EventPasswordChange）
- [x] 5.6 修改 `server/api/user/user.go` 的 `Logout` 函数
  - [x] 退出登录记录事件（EventUserLogout）
- [x] 5.7 修改 `server/api/user/user.go` 的 `UnifiedAuth` 函数
  - [x] 统一认证成功记录事件

## 6. 后端 - 用户操作埋点
- [x] 6.1 修改 `server/api/user/user.go` 的 `UpdateUserProfile` 函数
  - [x] 资料更新成功记录事件（EventProfileUpdate）
- [x] 6.2 修改 `server/api/user/user.go` 的 `UploadAvatar` 函数
  - [x] 头像上传成功记录事件（EventAvatarUpload）

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

## 11. 架构改进（扩展性优化）
- [x] 11.1 重构事件日志服务接口
  - [x] 简化核心接口为只包含 `Log` 方法
  - [x] 通过事件类型常量和 JSONB 字段实现灵活扩展
  - [x] 保留便捷方法作为辅助工具，但不作为接口定义
  - [x] 更新 `server/global/global.go` 接口定义
- [x] 11.2 更新设计文档
  - [x] 在 `design.md` 中说明新架构理念
  - [x] 添加扩展示例（如何添加新事件类型）
  - [x] 说明 Details 字段最佳实践
- [x] 11.3 创建使用指南
  - [x] 创建 `server/service/eventlog/USAGE.md`
  - [x] 提供基础使用示例
  - [x] 提供扩展指南
  - [x] 说明架构优势

## 12. 文档更新
- [ ] 12.1 更新后端API文档
  - [ ] 添加事件日志查询接口说明
  - [ ] 添加事件类型列表
- [ ] 12.2 创建运维文档
  - [ ] 数据库表结构说明
  - [ ] 日志查询示例SQL
  - [ ] 日志保留策略（建议）

## 实现顺序建议

### Phase 1: 基础设施（P0）✅ 已完成
- 任务 1: 数据库
- 任务 2: 数据模型
- 任务 3: 服务层
- 任务 11: 架构改进（扩展性优化）

### Phase 2: 认证埋点（P0）✅ 已完成
- 任务 5: 认证相关埋点（最重要）

### Phase 3: 查询功能（P1）✅ 已完成
- 任务 4: API接口

### Phase 4: 其他埋点（P1）✅ 已完成
- 任务 6: 用户操作

### Phase 5: 简历埋点（P1）⏳ 待实现
- 任务 7: 简历操作

### Phase 6: 管理界面（P2）⏳ 可选
- 任务 9: 前端界面

### Phase 7: 测试和文档（P1）⏳ 待完善
- 任务 10: 测试
- 任务 12: 文档

## 架构改进说明

### 改进内容（2025-11-22）

**问题**：原有设计中接口定义了13个具体方法（`LogUserLogin`, `LogLoginFailed` 等），每添加新事件类型都需要修改接口，违反开闭原则。

**解决方案**：
1. **简化核心接口**：只保留 `Log(ctx, event)` 方法
2. **事件类型枚举化**：通过常量定义事件类型（如 `EventUserLogin`）
3. **Details 字段灵活化**：使用 JSONB 存储任意结构的自定义数据
4. **便捷方法辅助化**：保留快捷方法（如 `LogUserLogin`），但作为实现的辅助工具

**优势**：
- ✅ 新增事件类型只需添加常量，无需修改接口
- ✅ 通过 Details 字段支持任意自定义数据结构
- ✅ 接口保持简洁，易于理解和维护
- ✅ 向后兼容，现有代码无需大改

**示例**：添加"二次认证"事件
```go
// 1. 添加常量
const EventTwoFactorAuth = "two_factor_auth"

// 2. 直接使用（无需修改接口）
global.EventLogService.Log(ctx, &model.EventLog{
    EventType:     eventlog.EventTwoFactorAuth,
    EventCategory: eventlog.CategoryAuth,
    Details:       json.Marshal(map[string]interface{}{"method": "totp"}),
})
```

