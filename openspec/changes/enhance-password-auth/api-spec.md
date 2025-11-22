# API 接口规范 - 密码认证增强

## 接口设计原则

1. **向后兼容**：所有现有接口保持兼容，只扩展字段
2. **后端优先**：接口设计以简化后端实现为主
3. **统一响应**：所有接口遵循统一响应格式
4. **最小改动**：复用现有API，不新增额外端点

---

## 1. 密码登录接口（已存在，需增强）

### 基本信息
- **接口路径**: `POST /api/user/login`
- **鉴权**: 无需认证
- **说明**: 使用手机号+密码登录，**需添加IP黑名单检查**

### 请求参数

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "phone": "13800138000",      // 必填，手机号
  "password": "123456"          // 必填，密码
}
```

**类型定义 (Go - 已存在):**
```go
type LoginRequest struct {
    Phone    string `json:"phone" binding:"required"`
    Password string `json:"password" binding:"required"`
}
```

### 后端实现要点

**改动位置**: `server/api/user/user.go` 的 `Login` 函数

```go
func Login(c *gin.Context) {
    var req userService.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.FailWithMessage(err.Error(), c)
        return
    }

    // ====== 新增：获取客户端IP ======
    ipAddress := c.ClientIP()
    
    // ====== 新增：检查黑名单 ======
    if blocked, remainingTime := service.UserService.CheckLoginBlacklist(ipAddress); blocked {
        utils.FailWithMessage(fmt.Sprintf("登录失败次数过多，请%d分钟后再试", remainingTime), c)
        return
    }

    // 原有逻辑：调用服务层登录
    token, userInfo, err := service.UserService.Login(req.Phone, req.Password)
    if err != nil {
        // ====== 新增：记录失败 ======
        service.UserService.RecordLoginFailure(ipAddress)
        utils.FailWithMessage(err.Error(), c)
        return
    }

    // ====== 新增：清除失败记录 ======
    service.UserService.ClearLoginFailures(ipAddress)

    // 原有逻辑：返回响应
    response := userService.LoginResponse{
        Token:     token,
        ExpiresAt: time.Now().Add(global.CONFIG.JWT.ExpiresTime),
        User:      *userInfo,
    }

    utils.OkWithData(response, c)
}
```

### 响应

**成功 (200):**
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-11-29T10:30:00Z",
    "user": {
      "id": "01HX...",
      "name": "张三",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "header_img": "",
      "role": 666,
      "active": true,
      "last_login": "2025-11-22T10:30:00Z",
      "created_at": "2025-01-01T00:00:00Z"
    }
  },
  "msg": "操作成功"
}
```

**失败 - 密码错误 (200, code非0):**
```json
{
  "code": 500,
  "data": null,
  "msg": "用户名或密码错误"  // 不透露具体是哪个字段错误
}
```

**失败 - 黑名单锁定 (200, code非0):**
```json
{
  "code": 429,  // 建议使用429表示Too Many Requests
  "data": null,
  "msg": "登录失败次数过多，请15分钟后再试"
}
```

**失败 - 参数错误 (200, code非0):**
```json
{
  "code": 400,
  "data": null,
  "msg": "参数错误: phone字段必填"
}
```

---

## 2. 用户注册接口（已存在，需扩展）

### 基本信息
- **接口路径**: `POST /api/user/register`
- **鉴权**: 无需认证
- **说明**: 使用手机号+短信验证码注册，**新增可选密码字段**

### 请求参数

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "phone": "13800138000",           // 必填，手机号
  "sms_code": "123456",             // 必填，短信验证码
  "name": "张三",                    // 选填，用户名，默认为"用户+手机号后4位"
  "invitation_code": "ABCD-EFGH",   // 选填，邀请码
  "password": "abc123456",          // 选填，密码，未提供则使用默认密码"123456"
  "confirm_password": "abc123456"   // 选填，确认密码（仅当提供password时需要）
}
```

**类型定义 (Go - 需修改):**
```go
// 位置: server/service/user/types.go
type RegisterRequest struct {
    Phone           string `json:"phone" binding:"required"`
    SmsCode         string `json:"sms_code" binding:"required"`
    InvitationCode  string `json:"invitation_code"`  // 邀请码选填
    Name            string `json:"name"`             // 用户名选填
    Password        string `json:"password"`         // ====== 新增：密码选填 ======
    ConfirmPassword string `json:"confirm_password"` // ====== 新增：确认密码选填 ======
}
```

### 后端实现要点

**改动位置**: 
1. `server/service/user/types.go` - 添加字段
2. `server/api/user/user.go` 的 `Register` 函数 - 添加密码验证
3. `server/service/user/user_service.go` 的 `RegisterWithInvitation` 函数 - 处理密码

```go
// ====== 在 api/user/user.go 中添加验证 ======
func Register(c *gin.Context) {
    var req userService.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.FailWithMessage(err.Error(), c)
        return
    }

    // ====== 新增：密码验证 ======
    if req.Password != "" {
        // 如果提供了密码，必须提供确认密码
        if req.ConfirmPassword == "" {
            utils.FailWithMessage("请输入确认密码", c)
            return
        }
        // 两次密码必须一致
        if req.Password != req.ConfirmPassword {
            utils.FailWithMessage("两次密码输入不一致", c)
            return
        }
        // 密码长度验证
        if len(req.Password) < 6 {
            utils.FailWithMessage("密码长度至少为6位", c)
            return
        }
    }

    // 验证短信验证码
    if !utils.VerifySMSCode(req.Phone, req.SmsCode) {
        utils.FailWithMessage("验证码错误或已过期", c)
        return
    }

    // 获取IP和UserAgent
    ipAddress := c.ClientIP()
    userAgent := c.GetHeader("User-Agent")

    // 调用服务层注册（传入密码）
    token, userInfo, message, err := service.UserService.RegisterWithInvitation(
        req.Phone, req.Name, req.InvitationCode, req.Password, ipAddress, userAgent,
    )
    if err != nil {
        utils.FailWithMessage(err.Error(), c)
        return
    }

    // ... 原有返回逻辑
}
```

**服务层函数签名修改**:
```go
// 位置: server/service/user/user_service.go
// 原: func (s *userService) RegisterWithInvitation(phone, name, invitationCode, ipAddress, userAgent string) (...)
// 改为:
func (s *userService) RegisterWithInvitation(phone, name, invitationCode, password, ipAddress, userAgent string) (string, *UserInfo, string, error) {
    // ... 省略邀请码和用户检查逻辑 ...

    // ====== 修改：根据是否提供密码选择哈希逻辑 ======
    var hashedPassword string
    if password != "" {
        // 用户提供了自定义密码
        hashedPassword, _ = utils.HashPassword(password)
    } else {
        // 使用默认密码
        hashedPassword, _ = utils.HashPassword("123456")
    }

    // 创建用户
    newUser := model.User{
        ID:       utils.GenerateTLID(),
        Name:     name,
        Phone:    phone,
        Password: hashedPassword,  // 使用选择的密码
        Active:   true,
        Role:     userRole,
    }

    // ... 省略后续逻辑 ...
}
```

### 响应

**成功 (200):**
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-11-29T10:30:00Z",
    "user": {
      "id": "01HX...",
      "name": "张三",
      "phone": "13800138000",
      "email": "",
      "header_img": "",
      "role": 666,
      "active": true,
      "last_login": "2025-11-22T10:30:00Z",
      "created_at": "2025-11-22T10:30:00Z"
    },
    "message": "注册成功"  // 或 "已有账号，直接登录"
  },
  "msg": "操作成功"
}
```

**失败 - 密码不一致 (200, code非0):**
```json
{
  "code": 400,
  "data": null,
  "msg": "两次密码输入不一致"
}
```

**失败 - 密码太短 (200, code非0):**
```json
{
  "code": 400,
  "data": null,
  "msg": "密码长度至少为6位"
}
```

---

## 3. 服务层新增函数（后端实现）

### 3.1 检查登录黑名单

**位置**: `server/service/user/user_service.go`

```go
// CheckLoginBlacklist 检查IP是否在黑名单中
// 返回: (是否被锁定, 剩余锁定时间(分钟))
func (s *userService) CheckLoginBlacklist(ip string) (bool, int) {
    key := fmt.Sprintf("login_fail:%s", ip)
    
    // 从缓存获取失败信息
    value, exists := global.Cache.Get(key)
    if !exists {
        return false, 0
    }
    
    // 解析失败信息
    failInfo := value.(LoginFailInfo)  // 需定义此结构体
    
    // 检查是否被锁定
    if failInfo.LockedUntil.After(time.Now()) {
        // 仍在锁定期
        remainingMinutes := int(time.Until(failInfo.LockedUntil).Minutes()) + 1
        return true, remainingMinutes
    }
    
    return false, 0
}

// LoginFailInfo 登录失败信息（内部结构体）
type LoginFailInfo struct {
    Count       int       // 失败次数
    FirstAttempt time.Time // 首次失败时间
    LockedUntil  time.Time // 锁定到期时间
}
```

### 3.2 记录登录失败

**位置**: `server/service/user/user_service.go`

```go
// RecordLoginFailure 记录登录失败
func (s *userService) RecordLoginFailure(ip string) {
    key := fmt.Sprintf("login_fail:%s", ip)
    
    var failInfo LoginFailInfo
    value, exists := global.Cache.Get(key)
    
    if exists {
        // 已有记录，增加计数
        failInfo = value.(LoginFailInfo)
        failInfo.Count++
    } else {
        // 首次失败
        failInfo = LoginFailInfo{
            Count:        1,
            FirstAttempt: time.Now(),
        }
    }
    
    // 检查是否达到阈值
    if failInfo.Count >= 5 {
        // 锁定15分钟
        failInfo.LockedUntil = time.Now().Add(15 * time.Minute)
        
        // 记录日志
        fmt.Printf("[WARN] IP %s 登录失败达到5次，锁定至 %s\n", 
            ip, failInfo.LockedUntil.Format("2006-01-02 15:04:05"))
    }
    
    // 保存到缓存，15分钟TTL
    global.Cache.Set(key, failInfo, 15*time.Minute)
}
```

### 3.3 清除登录失败记录

**位置**: `server/service/user/user_service.go`

```go
// ClearLoginFailures 清除登录失败记录（登录成功后调用）
func (s *userService) ClearLoginFailures(ip string) {
    key := fmt.Sprintf("login_fail:%s", ip)
    global.Cache.Delete(key)
}
```

---

## 4. 前端调用说明

### 4.1 密码登录调用

**文件**: `web/src/api/auth.ts`

```typescript
// 已存在，无需修改
export const authAPI = {
  // 密码登录
  login: (credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/api/user/login', credentials);
  },
  // ...
}
```

**前端使用示例**:
```typescript
// PasswordLogin.tsx 中
try {
  const response = await authAPI.login({
    phone: formData.phone,
    password: formData.password,
  });
  
  // 保存token和用户信息
  setToken(response.data.token);
  setUser(response.data.user);
  
} catch (error: any) {
  const errorMsg = error.response?.data?.msg || '登录失败';
  
  // 特殊处理黑名单锁定（code 429）
  if (error.response?.data?.code === 429) {
    setError('登录失败次数过多，请稍后再试');
  } else {
    setError(errorMsg);
  }
}
```

### 4.2 注册调用（带密码）

**文件**: `web/src/api/auth.ts`

```typescript
// 需修改类型定义
export interface RegisterData {
  phone: string;
  sms_code: string;
  name?: string;
  invitation_code?: string;
  password?: string;           // 新增：可选密码
  confirm_password?: string;   // 新增：可选确认密码
}

// API方法无需修改
export const authAPI = {
  register: (data: RegisterData): Promise<ApiResponse<{ token: string; user: User; message?: string }>> => {
    return apiClient.post('/api/user/register', data);
  },
  // ...
}
```

**前端使用示例**:
```typescript
// PhoneLogin.tsx (注册模式) 中
const handleRegister = async () => {
  const requestData: RegisterData = {
    phone: formData.phone,
    sms_code: formData.smsCode,
    invitation_code: formData.inviteCode,
  };
  
  // 如果用户填写了密码，则包含密码字段
  if (formData.password) {
    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    requestData.password = formData.password;
    requestData.confirm_password = formData.confirmPassword;
  }
  
  try {
    const response = await authAPI.register(requestData);
    // 保存token和用户信息
    setToken(response.data.token);
    setUser(response.data.user);
    
    // 显示提示消息
    if (response.data.message) {
      showInfo(response.data.message);
    }
  } catch (error: any) {
    setError(error.response?.data?.msg || '注册失败');
  }
};
```

---

## 5. 其他接口（无需修改）

以下接口保持不变，仅供参考：

### 5.1 发送短信验证码
- **路径**: `POST /api/user/send_sms`
- **参数**: `{ "phone": "13800138000" }`
- **说明**: 无需修改

### 5.2 重置密码
- **路径**: `POST /api/user/reset_password`
- **参数**: `{ "phone": "13800138000", "sms_code": "123456", "new_password": "newpass123" }`
- **说明**: 无需修改

### 5.3 修改密码（已登录用户）
- **路径**: `PUT /api/user/password`
- **参数**: `{ "current_password": "old123", "new_password": "new456" }`
- **说明**: 无需修改

---

## 6. 缓存设计

### 6.1 内存缓存结构

**位置**: `server/global/cache.go`

```go
// 无需修改缓存结构，使用现有的内存缓存即可
// 只需确保支持以下操作：
// - Set(key, value, ttl)
// - Get(key)
// - Delete(key)

// 缓存Key规范：
// - 登录失败记录: "login_fail:{ip}"
//   Value: LoginFailInfo{Count, FirstAttempt, LockedUntil}
//   TTL: 15分钟
```

---

## 7. 错误码规范

| HTTP Status | Code | 说明 | 示例消息 |
|-------------|------|------|---------|
| 200 | 0 | 成功 | "操作成功" |
| 200 | 400 | 请求参数错误 | "密码长度至少为6位" |
| 200 | 401 | 未认证 | "未登录或登录已过期" |
| 200 | 403 | 无权限 | "无权访问" |
| 200 | 404 | 资源不存在 | "用户不存在" |
| 200 | 429 | 请求过多（黑名单） | "登录失败次数过多，请15分钟后再试" |
| 200 | 500 | 服务器错误 | "用户名或密码错误" |

**说明**: 
- 所有API响应HTTP Status均为200
- 实际成功/失败由响应体的 `code` 字段判断
- `code == 0` 表示成功

---

## 8. 实现优先级

### P0 - 核心功能（必须实现）
1. ✅ `Login` 接口添加IP黑名单检查
2. ✅ `Register` 接口添加可选密码字段
3. ✅ 服务层实现黑名单相关函数

### P1 - 前端适配（紧接着实现）
4. ✅ 创建 `PasswordLogin.tsx` 组件
5. ✅ 修改 `PhoneLogin.tsx` 添加密码字段（注册模式）
6. ✅ 更新类型定义

### P2 - 优化项（可后续完善）
7. ⭕ 密码强度检查工具函数（前端实时检查）
8. ⭕ 浏览器autocomplete属性添加
9. ⭕ 日志记录优化

---

## 9. 接口测试清单

### 9.1 密码登录测试
- [ ] 正确密码登录成功
- [ ] 错误密码返回错误
- [ ] 连续5次失败触发锁定
- [ ] 锁定期间尝试登录被拒绝
- [ ] 成功登录后失败记录被清除

### 9.2 注册测试（带密码）
- [ ] 不提供密码，使用默认密码注册
- [ ] 提供密码但不提供确认密码，返回错误
- [ ] 密码和确认密码不一致，返回错误
- [ ] 密码少于6位，返回错误
- [ ] 正确提供密码和确认密码，注册成功

### 9.3 边界测试
- [ ] IP黑名单15分钟后自动解除
- [ ] 不同IP的失败记录互不影响
- [ ] 缓存重启后黑名单清空

---

## 10. 总结

### 改动最小化
- **新增接口**: 0个
- **修改接口**: 2个（Login、Register）
- **新增函数**: 3个（CheckLoginBlacklist、RecordLoginFailure、ClearLoginFailures）
- **数据库改动**: 0个

### 后端实现便利性
- ✅ 复用现有内存缓存，无需Redis
- ✅ 利用现有IP获取方法 `c.ClientIP()`
- ✅ 密码哈希复用现有 `utils.HashPassword`
- ✅ 响应格式保持一致
- ✅ 最小化代码改动，主要在现有函数中添加逻辑

### 兼容性保证
- ✅ Register接口新增字段为可选，不影响现有调用
- ✅ Login接口行为扩展，不改变正常登录流程
- ✅ 前端可渐进式升级，先支持登录黑名单，再添加密码注册

