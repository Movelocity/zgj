# 事件日志服务使用指南

## 设计理念

事件日志服务采用**核心接口最小化 + 便捷方法辅助**的设计：
- **核心接口**：只包含 `Log` 方法，保持简洁和扩展性
- **事件类型**：通过常量枚举定义（如 `EventUserLogin`）
- **自定义数据**：通过 `Details` JSONB 字段存储任意结构
- **便捷方法**：封装常见操作，降低使用门槛

## 基础使用

### 1. 使用便捷方法（推荐用于常见场景）

```go
import (
    "server/global"
)

// 记录用户登录
global.EventLogService.LogUserLogin(userID, ipAddress, userAgent)

// 记录登录失败
global.EventLogService.LogLoginFailed(phone, ipAddress, userAgent, "密码错误")

// 记录用户注册
global.EventLogService.LogUserRegister(userID, phone, ipAddress, userAgent)

// 记录发送验证码
global.EventLogService.LogSMSSent(phone, code, ipAddress, userAgent, true, retryCount)

// 记录密码重置
global.EventLogService.LogPasswordReset(userID, ipAddress, userAgent)

// 记录简历操作
global.EventLogService.LogResumeUpload(userID, resumeID, ipAddress, userAgent)
global.EventLogService.LogResumeOptimize(userID, resumeID, ipAddress, userAgent)
global.EventLogService.LogResumeExport(userID, resumeID, ipAddress, userAgent)
```

### 2. 使用 Log 方法（灵活方式，支持自定义数据）

```go
import (
    "context"
    "encoding/json"
    "server/global"
    "server/model"
    "server/service/eventlog"
)

// 记录带自定义数据的事件
details, _ := json.Marshal(map[string]interface{}{
    "phone":      "138****1234",
    "reason":     "invalid_code",
    "attempts":   3,
    "ip_region":  "Beijing",
    "device_id":  "ABC123",
})

err := global.EventLogService.Log(context.Background(), &model.EventLog{
    UserID:        "",  // 登录失败时可能没有 userID
    EventType:     eventlog.EventLoginFailed,
    EventCategory: eventlog.CategoryAuth,
    IPAddress:     ipAddress,
    UserAgent:     userAgent,
    ErrorMessage:  "验证码错误",
    Status:        eventlog.StatusFailed,
    Details:       details,
})
```

## 事件类型常量

### 认证相关 (CategoryAuth)
- `EventSMSSent` - 发送验证码
- `EventUserRegister` - 用户注册
- `EventUserLogin` - 用户登录
- `EventLoginFailed` - 登录失败
- `EventPasswordReset` - 密码重置
- `EventPasswordChange` - 密码修改
- `EventUserLogout` - 退出登录

### 用户操作 (CategoryUser)
- `EventProfileUpdate` - 修改资料
- `EventAvatarUpload` - 上传头像

### 简历操作 (CategoryResume)
- `EventResumeUpload` - 上传简历
- `EventResumeOptimize` - 简历优化
- `EventResumeExport` - 导出简历

### 系统事件 (CategorySystem)
- `EventBusinessError` - 业务错误
- `EventSystemError` - 系统错误

### 付费相关 (CategoryPayment) - 预留
- `EventOrderCreate` - 创建订单
- `EventPaymentSuccess` - 支付成功
- `EventPaymentFailed` - 支付失败
- `EventBalanceChange` - 余额变动

## 事件状态
- `StatusSuccess` - 成功
- `StatusFailed` - 失败
- `StatusError` - 错误

## 扩展新事件类型

添加新事件类型无需修改接口，只需三步：

### 步骤1：添加事件类型常量

在 `types.go` 中添加：

```go
const (
    // 新增事件类型
    EventTwoFactorAuth   = "two_factor_auth"    // 二次认证
    EventTwoFactorFailed = "two_factor_failed"  // 二次认证失败
)
```

### 步骤2：在业务代码中使用

```go
details, _ := json.Marshal(map[string]interface{}{
    "method":      "totp",
    "device_id":   deviceID,
    "trust_level": "high",
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

### 步骤3：（可选）添加便捷方法

在 `event_log_service.go` 中添加：

```go
// LogTwoFactorAuth 记录二次认证
func (s *eventLogService) LogTwoFactorAuth(userID, method, ip, userAgent string) {
    details, _ := json.Marshal(map[string]interface{}{"method": method})
    s.Log(context.Background(), &model.EventLog{
        UserID:        userID,
        EventType:     EventTwoFactorAuth,
        EventCategory: CategoryAuth,
        IPAddress:     ip,
        UserAgent:     userAgent,
        Status:        StatusSuccess,
        Details:       details,
    })
}
```

## Details 字段最佳实践

### ✅ 推荐的做法

```go
// 1. 登录失败 - 记录关键信息
{"phone": "138****1234", "reason": "invalid_password", "attempts": 3}

// 2. 简历优化 - 记录处理参数
{
    "model": "gpt-4",
    "tokens": 1523,
    "duration_ms": 2341,
    "sections": ["education", "experience"]
}

// 3. 支付成功 - 记录交易信息
{
    "order_id": "ORD123",
    "amount": 99.00,
    "currency": "CNY",
    "payment_method": "alipay"
}

// 4. API 调用失败 - 记录请求上下文
{
    "endpoint": "/api/v1/resume/optimize",
    "status_code": 500,
    "error_type": "timeout",
    "retry_count": 2
}
```

### ❌ 应该避免的做法

```go
// 1. 存储敏感信息
{"password": "123456", "credit_card": "1234-5678-9012-3456"}

// 2. 存储过大数据
{"resume_content": "超长简历内容..."}  // 应该存储 resume_id，而非完整内容

// 3. 存储无意义信息
{"random": "abc123", "useless": true}
```

### 脱敏规则
- **手机号**：`138****1234`（保留前3后4位）
- **邮箱**：`abc***@example.com`（保留部分前缀和完整域名）
- **IP地址**：可以完整存储（用于安全分析）
- **密码**：永不存储
- **验证码**：永不存储完整码，可存储"已使用"、"已过期"等状态

## 获取 IP 和 UserAgent

在 Gin 路由处理函数中：

```go
func SomeHandler(c *gin.Context) {
    // 获取 IP 地址
    ipAddress := c.ClientIP()
    
    // 获取 UserAgent
    userAgent := c.GetHeader("User-Agent")
    
    // 记录事件
    global.EventLogService.LogUserLogin(userID, ipAddress, userAgent)
}
```

## 查询事件日志（管理员）

使用管理员 API 查询：

```bash
GET /api/admin/event-logs?page=1&page_size=50&user_id=xxx&event_type=user_login&start_time=2025-01-01T00:00:00&end_time=2025-01-31T23:59:59
```

查询参数：
- `page` - 页码（默认1）
- `page_size` - 每页条数（默认50，最大100）
- `user_id` - 用户ID（可选）
- `event_type` - 事件类型（可选）
- `event_category` - 事件分类（可选）
- `status` - 状态筛选（可选）
- `start_time` - 开始时间（可选，格式：2006-01-02T15:04:05）
- `end_time` - 结束时间（可选）

## 性能考虑

- 事件记录采用**同步写入**，单次操作 < 1ms
- 如果记录失败，不会影响主业务，只会记录到系统日志
- 数据库使用索引优化查询性能
- Details 字段建议控制在 1KB 以内

## 架构优势

### 对比旧设计

**旧设计**（每个事件一个接口方法）：
```go
type EventLogService interface {
    LogUserLogin(userID, ip, userAgent string)
    LogUserRegister(userID, phone, ip, userAgent string)
    LogPasswordReset(userID, ip, userAgent string)
    // ... 每添加新事件都要改接口
}
```

**新设计**（统一 Log 方法 + 事件类型枚举）：
```go
type EventLogServiceInterface interface {
    Log(ctx context.Context, event *model.EventLog) error
}
```

### 优势
✅ **扩展性强**：新增事件只需添加常量，无需修改接口  
✅ **灵活性高**：通过 Details 字段支持任意自定义数据  
✅ **接口简洁**：核心接口只有一个方法  
✅ **向后兼容**：保留便捷方法，现有代码无需大改  
✅ **易于维护**：事件定义集中在常量中，一目了然  

