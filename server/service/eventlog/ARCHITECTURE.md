# 事件日志服务架构说明

## 核心设计理念

事件日志服务采用**核心接口最小化**的设计模式，通过**事件类型枚举 + JSONB 灵活字段**实现强扩展性。

## 架构演进

### 旧设计（不推荐）

```go
type EventLogServiceInterface interface {
    LogUserLogin(userID, ip, userAgent string)
    LogLoginFailed(phone, ip, userAgent, reason string)
    LogUserRegister(userID, phone, ip, userAgent string)
    LogSMSSent(phone, code, ip, userAgent string, success bool, retryCount int)
    // ... 每个事件一个方法，共13个方法
}
```

**问题**：
- ❌ 每添加新事件类型都需要修改接口（违反开闭原则）
- ❌ 接口膨胀，难以维护
- ❌ 缺乏灵活性，无法存储自定义事件数据

### 新设计（当前）

```go
// 核心接口 - 只包含通用的 Log 方法
type EventLogServiceInterface interface {
    Log(ctx context.Context, event *model.EventLog) error
}

// 完整服务类型 - 包含核心接口 + 便捷方法
type EventLogServiceType interface {
    EventLogServiceInterface
    // 便捷辅助方法
    LogUserLogin(userID, ip, userAgent string)
    LogLoginFailed(phone, ip, userAgent, reason string)
    // ...
}
```

**优势**：
- ✅ **扩展性强**：新增事件类型只需添加常量，无需修改接口
- ✅ **灵活性高**：通过 `Details` JSONB 字段支持任意自定义数据
- ✅ **接口简洁**：核心接口只有1个方法（vs 旧设计13个）
- ✅ **向后兼容**：保留便捷方法，现有代码无需大改
- ✅ **语义清晰**：核心接口是契约，便捷方法是工具

## 三层架构

### 第一层：核心接口（契约）

```go
type EventLogServiceInterface interface {
    Log(ctx context.Context, event *model.EventLog) error
}
```

**职责**：定义最小化的核心能力

### 第二层：完整服务类型（便捷）

```go
type EventLogServiceType interface {
    EventLogServiceInterface
    LogUserLogin(userID, ip, userAgent string)
    // ... 其他快捷方法
}
```

**职责**：为常见场景提供便捷方法

### 第三层：事件类型枚举（扩展）

```go
const (
    EventUserLogin      = "user_login"
    EventLoginFailed    = "login_failed"
    EventTwoFactorAuth  = "two_factor_auth"  // 新增无需改接口
)
```

**职责**：定义所有事件类型，易于扩展

## 数据结构

```go
type EventLog struct {
    ID            int64
    CreatedAt     time.Time
    
    UserID        string    // 用户ID
    EventType     string    // 事件类型（使用常量）
    EventCategory string    // 事件分类
    
    IPAddress     string    // IP地址
    UserAgent     string    // User-Agent
    
    ResourceType  string    // 资源类型（可选）
    ResourceID    string    // 资源ID（可选）
    
    Status        string    // 状态：success/failed/error
    ErrorMessage  string    // 错误信息
    
    Details       JSON      // 自定义数据（JSONB）
}
```

## 使用模式

### 模式1：使用便捷方法（推荐 - 常见场景）

```go
// 直接调用，简单明了
global.EventLogService.LogUserLogin(userID, ipAddress, userAgent)
```

### 模式2：使用 Log 方法（灵活 - 自定义场景）

```go
// 构造完整的事件对象，支持自定义数据
details, _ := json.Marshal(map[string]interface{}{
    "method":      "totp",
    "device_id":   deviceID,
    "trust_level": "high",
    "location":    "Beijing",
})

global.EventLogService.Log(ctx, &model.EventLog{
    UserID:        userID,
    EventType:     eventlog.EventTwoFactorAuth,
    EventCategory: eventlog.CategoryAuth,
    IPAddress:     ip,
    UserAgent:     userAgent,
    Status:        eventlog.StatusSuccess,
    Details:       details,
})
```

## 扩展指南

### 添加新事件类型（零接口改动）

**步骤1**：在 `types.go` 添加常量

```go
const (
    EventAPIKeyCreated = "api_key_created"
    EventAPIKeyRevoked = "api_key_revoked"
)
```

**步骤2**：业务代码直接使用

```go
details, _ := json.Marshal(map[string]interface{}{
    "key_id":     keyID,
    "expires_at": expiresAt,
    "scope":      "read:all",
})

global.EventLogService.Log(ctx, &model.EventLog{
    UserID:        userID,
    EventType:     eventlog.EventAPIKeyCreated,
    EventCategory: eventlog.CategoryUser,
    IPAddress:     ip,
    Details:       details,
})
```

**步骤3**（可选）：添加便捷方法

```go
func (s *eventLogService) LogAPIKeyCreated(userID, keyID, ip string) {
    details, _ := json.Marshal(map[string]interface{}{"key_id": keyID})
    s.Log(context.Background(), &model.EventLog{
        UserID:        userID,
        EventType:     EventAPIKeyCreated,
        EventCategory: CategoryUser,
        IPAddress:     ip,
        Status:        StatusSuccess,
        Details:       details,
    })
}
```

## Details 字段规范

### 存储什么

- ✅ 关键业务参数（订单金额、处理时长）
- ✅ 上下文信息（设备ID、地理位置）
- ✅ 状态变化（从A到B）
- ✅ 脱敏后的敏感信息（138****1234）

### 不存储什么

- ❌ 原始密码或密钥
- ❌ 完整的验证码
- ❌ 大量数据（>1KB，应存关联ID）
- ❌ 无意义的随机数据

### 示例

```go
// ✅ 好的例子
{
    "order_id": "ORD123456",
    "amount": 99.00,
    "currency": "CNY",
    "payment_method": "alipay",
    "transaction_id": "TXN789"
}

// ❌ 坏的例子
{
    "password": "123456",           // 不要存密码
    "full_resume_text": "...",      // 太大，应存 resume_id
    "random_value": "abc123"        // 无意义数据
}
```

## 性能特性

- **写入性能**：同步写入，单次 < 1ms
- **失败处理**：记录失败不影响主业务
- **查询性能**：多字段索引，查询 < 100ms
- **存储规模**：支持数千万级别记录

## 文档参考

- [使用指南](./USAGE.md) - 详细的 API 使用说明
- [设计文档](../../../openspec/changes/add-user-event-log/design.md) - 完整的设计决策
- [实现任务](../../../openspec/changes/add-user-event-log/tasks.md) - 实现进度追踪

