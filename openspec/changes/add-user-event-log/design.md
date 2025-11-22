# Design: 用户事件日志系统

## Context

系统需要记录用户的关键操作用于：
1. **安全审计** - 追踪异常行为、登录失败
2. **运营分析** - 用户行为路径、功能使用率
3. **问题排查** - 错误上下文、用户操作历史
4. **付费对账** - 消费记录、订单流水

约束条件：
- 使用现有PostgreSQL数据库
- 不能影响主业务性能（异步记录）
- 需要支持按时间范围高效查询
- 日志数据量可能较大，需考虑存储和查询性能

## Goals / Non-Goals

### Goals
- 建立统一的事件日志记录机制
- 支持按时间、用户、事件类型查询
- 记录所有安全相关事件（登录、注册、密码操作）
- 为后续付费系统提供审计支持
- 提供管理员查询接口

### Non-Goals
- 不实现实时日志监控和告警（后续功能）
- 不实现日志归档和清理策略（后续优化）
- 不实现日志导出功能（后续功能）
- 不记录所有API调用（仅记录关键业务事件）
- 不替代系统错误日志（zap日志仍保留）

## Decisions

### 1. 数据库表设计

**表名**: `user_event_logs`

**字段设计**:
```sql
CREATE TABLE user_event_logs (
    id BIGSERIAL PRIMARY KEY,                     -- 自增主键
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- 事件发生时间
    
    user_id VARCHAR(20) NOT NULL,                 -- 用户ID（空字符串表示未登录）
    event_type VARCHAR(50) NOT NULL,              -- 事件类型
    event_category VARCHAR(20) NOT NULL,          -- 事件分类
    
    ip_address VARCHAR(45),                       -- IP地址（支持IPv6）
    user_agent TEXT,                              -- User-Agent
    
    resource_type VARCHAR(50),                    -- 资源类型（如resume、order）
    resource_id VARCHAR(50),                      -- 资源ID
    
    status VARCHAR(20) DEFAULT 'success',         -- 状态：success/failed/error
    error_message TEXT,                           -- 错误信息（如果失败）
    
    details JSONB,                                -- 事件详情（JSON格式）
    
    -- 索引
    INDEX idx_user_event_logs_time (created_at DESC),
    INDEX idx_user_event_logs_user (user_id, created_at DESC),
    INDEX idx_user_event_logs_type (event_type, created_at DESC),
    INDEX idx_user_event_logs_category (event_category, created_at DESC)
);
```

**索引策略**:
- `created_at DESC` - 时间倒序，最新日志优先
- `user_id + created_at` - 查询某用户的操作历史
- `event_type + created_at` - 统计某类事件
- `event_category + created_at` - 按分类查询

**理由**:
- BIGSERIAL自增ID，简单高效
- 时间字段独立，便于建立高效索引
- IP和UserAgent记录安全相关信息
- JSONB存储灵活的事件详情，支持PostgreSQL原生查询
- status字段区分成功/失败，便于统计
- resource_type/resource_id支持关联业务资源

### 2. 事件分类和类型

**分类 (event_category)**:
- `auth` - 认证相关
- `user` - 用户操作
- `resume` - 简历操作
- `payment` - 付费相关
- `system` - 系统事件

**事件类型 (event_type)**:

```go
const (
    // 认证相关 (auth)
    EventSMSSent        = "sms_sent"         // 发送验证码
    EventUserRegister   = "user_register"    // 用户注册
    EventUserLogin      = "user_login"       // 用户登录
    EventLoginFailed    = "login_failed"     // 登录失败
    EventPasswordReset  = "password_reset"   // 密码重置
    EventPasswordChange = "password_change"  // 密码修改
    EventUserLogout     = "user_logout"      // 退出登录
    
    // 用户操作 (user)
    EventProfileUpdate  = "profile_update"   // 修改资料
    EventAvatarUpload   = "avatar_upload"    // 上传头像
    
    // 简历操作 (resume)
    EventResumeUpload   = "resume_upload"    // 上传简历
    EventResumeOptimize = "resume_optimize"  // 简历优化
    EventResumeExport   = "resume_export"    // 导出简历
    
    // 系统事件 (system)
    EventBusinessError  = "business_error"   // 业务错误
    EventSystemError    = "system_error"     // 系统错误
    
    // 付费相关 (payment) - 预留
    EventOrderCreate    = "order_create"     // 创建订单
    EventPaymentSuccess = "payment_success"  // 支付成功
    EventPaymentFailed  = "payment_failed"   // 支付失败
    EventBalanceChange  = "balance_change"   // 余额变动
)
```

**理由**:
- 使用常量定义，避免硬编码字符串
- 事件类型命名清晰，便于理解和维护
- 分类+类型两级结构，支持灵活查询

### 3. 记录方式 - 异步 vs 同步

**决策**: 使用**同步记录 + 快速写入**

**理由**:
- PostgreSQL写入性能优秀，单条INSERT < 1ms
- 日志记录需要保证可靠性（不能丢失）
- Go的数据库连接池已优化，不会阻塞
- 事件日志不频繁（每次关键操作），不会成为瓶颈
- 同步记录代码简单，不需要消息队列

**替代方案考虑**:
- 异步批量写入：增加复杂度，可能丢失日志
- 消息队列：过度设计，当前规模不需要

**性能保证**:
- 使用连接池复用连接
- 事件记录失败不影响主业务（仅记录到系统日志）
- 后续如性能瓶颈，可切换到异步批量

### 4. 服务层设计

**服务接口**:
```go
type EventLogService interface {
    // 记录事件
    Log(ctx context.Context, event *EventLog) error
    
    // 查询日志（管理员）
    Query(ctx context.Context, req *QueryRequest) (*QueryResponse, error)
    
    // 统计事件（管理员）
    Stats(ctx context.Context, req *StatsRequest) (*StatsResponse, error)
}
```

**便捷函数**:
```go
// 快捷记录函数
func LogUserLogin(userID, ip, userAgent string) {
    eventLogService.Log(context.Background(), &EventLog{
        UserID:        userID,
        EventType:     EventUserLogin,
        EventCategory: "auth",
        IPAddress:     ip,
        UserAgent:     userAgent,
        Status:        "success",
    })
}

func LogLoginFailed(phone, ip, reason string) {
    eventLogService.Log(context.Background(), &EventLog{
        UserID:        "",  // 登录失败时可能还没有userID
        EventType:     EventLoginFailed,
        EventCategory: "auth",
        IPAddress:     ip,
        ErrorMessage:  reason,
        Status:        "failed",
        Details:       map[string]interface{}{"phone": phone},
    })
}
```

**理由**:
- 统一接口，便于维护
- 快捷函数降低使用门槛
- context传递超时控制

### 5. 查询接口设计

**管理员查询API**:
```
GET /api/admin/event-logs?page=1&page_size=50&user_id=xxx&event_type=user_login&start_time=2025-01-01&end_time=2025-01-31
```

**查询参数**:
- `page` - 页码（默认1）
- `page_size` - 每页条数（默认50，最大100）
- `user_id` - 用户ID（可选）
- `event_type` - 事件类型（可选）
- `event_category` - 事件分类（可选）
- `start_time` - 开始时间（可选）
- `end_time` - 结束时间（可选）
- `status` - 状态筛选（可选）

**响应格式**:
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 12345,
        "created_at": "2025-11-22T10:30:00Z",
        "user_id": "01HX...",
        "event_type": "user_login",
        "event_category": "auth",
        "ip_address": "192.168.1.1",
        "status": "success",
        "details": {...}
      }
    ],
    "total": 1000,
    "page": 1,
    "page_size": 50
  },
  "msg": "操作成功"
}
```

### 6. 业务埋点位置

**认证相关** (`server/api/user/user.go`):
- `SendSMS()` - 发送验证码成功/失败
- `Register()` - 注册成功/失败
- `Login()` - 登录成功/失败
- `ResetPassword()` - 密码重置成功
- `ChangePassword()` - 密码修改成功
- `Logout()` - 退出登录

**用户操作** (`server/api/user/user.go`):
- `UpdateUserProfile()` - 更新资料
- `UploadAvatar()` - 上传头像

**简历操作** (`server/api/resume/resume.go`):
- 简历上传、优化、导出

**错误处理** (全局中间件):
- 捕获业务错误和系统错误

## Risks / Trade-offs

### 风险1: 数据量增长

**预估**:
- 每用户每天约10-20条日志
- 1000活跃用户/天 → 10,000-20,000条/天
- 一年约730万条记录

**影响**:
- PostgreSQL单表支持数亿条记录
- 有索引的查询仍然很快
- 存储成本可接受

**缓解措施**:
- 建立合理的时间索引
- 后续可实现日志归档（超过1年的迁移到归档表）
- 定期清理超过3年的日志（如需要）

### 风险2: 写入性能影响

**影响**: 每次关键操作增加1次数据库写入

**缓解措施**:
- 使用连接池，单次INSERT < 1ms
- 失败不影响主业务（仅记录到系统日志）
- 后续可优化为异步批量写入

### Trade-off: 同步记录 vs 可靠性

**决策**: 选择同步记录，保证可靠性

**理由**:
- 日志记录是关键功能，不能丢失
- 当前规模下性能影响可忽略
- 代码简单，易维护

## Migration Plan

### 阶段1: 数据库和基础服务
1. 创建数据库表和索引
2. 实现EventLogService服务层
3. 实现快捷记录函数
4. 单元测试

### 阶段2: 认证相关埋点
1. 在Login、Register等接口添加日志记录
2. 发送验证码记录
3. 密码重置/修改记录
4. 集成测试

### 阶段3: 查询接口和管理界面
1. 实现管理员查询API
2. 实现统计API（可选）
3. 前端管理界面（可选）

### 阶段4: 其他业务埋点
1. 用户资料操作
2. 简历操作
3. 系统错误记录

### 回滚方案
- 数据库：保留表，停止写入
- 代码：注释掉日志记录调用
- 无破坏性，可随时回滚

## Open Questions

1. **日志保留时长？**
   - 建议：关键日志（登录、支付）保留3年
   - 普通日志（浏览、查询）保留1年
   - 实现：后续添加定期清理任务

2. **是否需要实时告警？**
   - 建议：后续功能
   - 当前：管理员可定期查看异常日志

3. **是否需要导出功能？**
   - 建议：后续功能
   - 可先通过直接查询数据库实现

4. **details字段存储什么？**
   - 规范：仅存储必要信息，不存储敏感数据（如密码）
   - 示例：登录失败可存储{phone, reason}
   - 原则：可序列化为JSON的map

