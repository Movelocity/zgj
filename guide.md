根据你的项目结构和需求，我将提供一个更详细的规划和实现方案，并检查可能忽略的细节。

## 详细项目结构

```
server/
├── config.yaml                    # 配置文件
├── main.go                       # 入口文件
├── go.mod                        # Go模块定义
├── README.md                     # 项目说明
├── api/                          # API接口定义层
│   ├── enter.go                  # API层入口文件
│   ├── user/                     # 用户相关API
│   │   ├── request.go            # 请求结构体
│   │   ├── response.go           # 响应结构体
│   │   └── user.go               # 用户API定义
│   ├── system/                   # 系统管理API
│   │   ├── request.go
│   │   ├── response.go
│   │   └── system.go
│   └── app/                      # 应用API
│       ├── request.go
│       ├── response.go
│       └── app.go
├── service/                      # 业务逻辑层
│   ├── enter.go
│   ├── user/
│   │   └── user_service.go
│   ├── system/
│   │   └── system_service.go
│   └── app/
│       └── app_service.go
├── router/                       # 路由层
│   ├── enter.go
│   ├── public.go                 # 公开路由
│   ├── private.go                # 需要认证的路由
│   └── admin.go                  # 管理员路由
├── config/                       # 配置结构体
│   └── config.go
├── global/                       # 全局变量
│   ├── global.go
│   └── cache.go                  # 内存缓存（替代Redis）
├── initialize/                   # 初始化模块
│   ├── router.go                 # 路由初始化
│   ├── db.go                     # 数据库初始化
│   ├── config.go                 # 配置初始化
│   └── cache.go                  # 缓存初始化
├── model/                        # 数据模型
│   ├── enter.go
│   ├── user.go
│   ├── user_profile.go
│   ├── conversation.go
│   └── workflows.go
├── middleware/                   # 中间件
│   ├── cors.go                   # 跨域中间件
│   ├── jwt.go                    # JWT认证
│   └── admin_auth.go             # 管理员权限验证
└── utils/                        # 工具包
    ├── hash.go                   # 哈希工具
    ├── jwt.go                    # JWT工具
    ├── zap_log.go                # 日志工具
    ├── token_claims.go           # Token声明
    ├── tlid.go                   # 时间有序ID生成
    ├── sms.go                    # 短信工具
    └── file.go                   # 文件操作
```

## 详细配置设计

### config.yaml
```yaml
server:
  port: 8888
  mode: "debug" # release/debug/test

cors:
  mode: "strict-whitelist"
  whitelist:
    - allow-origin: "http://localhost:3000"
      allow-methods: "POST, GET, OPTIONS, DELETE, PUT"
      allow-headers: "Content-Type,AccessToken,X-CSRF-Token, Authorization, Token,X-Token,X-User-Id,user_id"
      expose-headers: "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type, New-Token, New-Expires-At"
      allow-credentials: true

pgsql:
  host: "localhost"
  port: 5666
  db-name: "your_db_name"
  username: "postgres"
  password: "minecraft123"
  sslmode: "disable"
  max-idle-conns: 10
  max-open-conns: 100
  log-mode: "info" # silent/error/warn/info

spug-sms:
  token: "your_spug_token"
  api-url: "https://api.spug.cc/api/sms/"

jwt:
  signing-key: "fPiMcrpgB1qv98PSsmnwY6L9zSvkNbRj7EaNUi8M87k3XQTfiXdeFw5I"
  expires-time: "168h" # 7天
  buffer-time: "24h"   # 1天
  issuer: "CLOUD"

local:
  path: "uploads/file"
  store-path: "uploads/file"
  max-size: 10 # MB

upload:
  image-max-size: 5   # MB
  file-max-size: 10   # MB
  allow-image-types: "image/jpeg,image/png,image/gif"
  allow-file-types: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

log:
  level: "info"
  prefix: "[CLOUD]"
  format: "json" # text/json
  director: "log"
  show-line: true
  encode-level: "LowercaseColorLevelEncoder" # LowercaseLevelEncoder/LowercaseColorLevelEncoder/CapitalLevelEncoder/CapitalColorLevelEncoder
```

## 数据库模型详细设计

### model/user.go
```go
package model

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID         string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`
    Name       string    `gorm:"size:100;not null" json:"name"`
    HeaderImg  string    `gorm:"size:255" json:"header_img"`
    Phone      string    `gorm:"size:20;not null;index:idx_phone_active,unique,where:active=true" json:"phone"`
    Password   string    `gorm:"size:255;not null" json:"-"`
    Email      string    `gorm:"size:100" json:"email"`
    Active     bool      `gorm:"default:false" json:"active"`
    Role       int       `gorm:"default:666" json:"role"` // 888: admin, 666: user
    LastLogin  time.Time `json:"last_login"`
}

// 表名
func (User) TableName() string {
    return "users"
}
```

### model/user_profile.go
```go
package model

import (
    "time"
    "gorm.io/gorm"
)

type Resume struct {
    Name      string    `json:"name"`
    URL       string    `json:"url"`
    Size      int64     `json:"size"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type UserProfile struct {
    ID        string          `gorm:"primaryKey;type:varchar(20)" json:"id"`
    UserID    string          `gorm:"type:varchar(20);uniqueIndex" json:"user_id"`
    Data      JSON            `gorm:"type:jsonb" json:"data"` // 用户画像数据
    Resumes   []Resume        `gorm:"type:jsonb" json:"resumes"`
    CreatedAt time.Time       `json:"created_at"`
    UpdatedAt time.Time       `json:"updated_at"`
    User      User            `gorm:"foreignKey:UserID" json:"-"`
}

// 自定义JSON类型处理
type JSON []byte

func (j JSON) Value() (driver.Value, error) {
    if len(j) == 0 {
        return nil, nil
    }
    return string(j), nil
}

func (j *JSON) Scan(value interface{}) error {
    if value == nil {
        *j = nil
        return nil
    }
    s, ok := value.([]byte)
    if !ok {
        return errors.New("invalid scan source")
    }
    *j = JSON(s)
    return nil
}
```

### model/conversation.go
```go
package model

import (
    "time"
)

type Message struct {
    Role    string    `json:"role"` // user/assistant
    Content string    `json:"content"`
    Time    time.Time `json:"time"`
}

type Conversation struct {
    ID         string     `gorm:"primaryKey;type:varchar(20)" json:"id"`
    UserID     string     `gorm:"type:varchar(20);index" json:"user_id"`
    Title      string     `gorm:"size:255" json:"title"` // 对话标题
    Messages   []Message  `gorm:"type:jsonb" json:"messages"`
    CreatedAt  time.Time  `json:"created_at"`
    UpdatedAt  time.Time  `json:"updated_at"`
    IsArchived bool       `gorm:"default:false" json:"is_archived"`
}
```

### model/workflows.go
```go
package model

import (
    "time"
)

type Field struct {
    FieldName string `json:"field_name"`
    FieldType string `json:"field_type"` // string/number/boolean/file
    Required  bool   `json:"required"`
}

type Workflow struct {
    ID         string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
    ApiURL     string    `gorm:"size:500;not null" json:"api_url"`
    ApiKey     string    `gorm:"size:255;not null" json:"api_key"`
    Name       string    `gorm:"size:100;not null" json:"name"`
    Description string   `gorm:"size:500" json:"description"`
    CreatorID  string    `gorm:"type:varchar(20);index" json:"creator_id"`
    Inputs     []Field   `gorm:"type:jsonb" json:"inputs"`
    Outputs    []Field   `gorm:"type:jsonb" json:"outputs"`
    Used       int64     `gorm:"default:0" json:"used"`
    IsPublic   bool      `gorm:"default:false" json:"is_public"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`
}
```

## API路由设计

### router/enter.go
```go
package router

import (
    "github.com/gin-gonic/gin"
    "server/middleware"
)

func Routers() *gin.Engine {
    Router := gin.Default()
  
    // 公共路由
    PublicGroup := Router.Group("")
    PublicRouter(PublicGroup)
  
    // 私有路由（需要认证）
    PrivateGroup := Router.Group("")
    PrivateGroup.Use(middleware.JWTAuth())
    PrivateRouter(PrivateGroup)
  
    // 管理员路由
    AdminGroup := Router.Group("")
    AdminGroup.Use(middleware.JWTAuth(), middleware.AdminAuth())
    AdminRouter(AdminGroup)
  
    return Router
}
```

### router/public.go
```go
package router

import (
    "github.com/gin-gonic/gin"
    "server/api"
)

func PublicRouter(Router *gin.RouterGroup) {
    // 用户相关
    UserRouter := Router.Group("/api/user")
    {
        UserRouter.POST("/register", api.Register)      // 用户注册
        UserRouter.POST("/login", api.Login)            // 用户登录
        UserRouter.POST("/send_sms", api.SendSMS)       // 发送短信验证码
        UserRouter.POST("/verify_sms", api.VerifySMS)   // 验证短信验证码
        UserRouter.POST("/reset_password", api.ResetPassword) // 重置密码
    }
}
```

### router/private.go
```go
package router

import (
    "github.com/gin-gonic/gin"
    "server/api"
)

func PrivateRouter(Router *gin.RouterGroup) {
    // 用户相关
    UserRouter := Router.Group("/api/user")
    {
        UserRouter.GET("/profile", api.GetUserProfile)      // 获取用户信息
        UserRouter.PUT("/profile", api.UpdateUserProfile)   // 更新用户信息
        UserRouter.POST("/logout", api.Logout)              // 用户登出
        UserRouter.POST("/upload_avatar", api.UploadAvatar) // 上传头像
        UserRouter.POST("/upload_resume", api.UploadResume) // 上传简历
    }
  
    // 对话相关
    ConversationRouter := Router.Group("/api/conversation")
    {
        ConversationRouter.GET("", api.GetConversations)        // 获取对话列表
        ConversationRouter.GET("/:id", api.GetConversation)     // 获取特定对话
        ConversationRouter.POST("", api.CreateConversation)     // 创建对话
        ConversationRouter.PUT("/:id", api.UpdateConversation)  // 更新对话
        ConversationRouter.DELETE("/:id", api.DeleteConversation) // 删除对话
    }
  
    // 工作流相关
    WorkflowRouter := Router.Group("/api/workflow")
    {
        WorkflowRouter.GET("", api.GetWorkflows)           // 获取工作流列表
        WorkflowRouter.GET("/:id", api.GetWorkflow)        // 获取特定工作流
        WorkflowRouter.POST("", api.CreateWorkflow)        // 创建工作流
        WorkflowRouter.PUT("/:id", api.UpdateWorkflow)     // 更新工作流
        WorkflowRouter.DELETE("/:id", api.DeleteWorkflow)  // 删除工作流
        WorkflowRouter.POST("/:id/execute", api.ExecuteWorkflow) // 执行工作流
    }
}
```

### router/admin.go
```go
package router

import (
    "github.com/gin-gonic/gin"
    "server/api"
)

func AdminRouter(Router *gin.RouterGroup) {
    // 用户管理
    AdminUserRouter := Router.Group("/api/admin/user")
    {
        AdminUserRouter.GET("", api.GetAllUsers)           // 获取所有用户
        AdminUserRouter.GET("/:id", api.GetUserByID)       // 获取特定用户
        AdminUserRouter.PUT("/:id", api.UpdateUserByAdmin) // 更新用户信息
        AdminUserRouter.DELETE("/:id", api.DeleteUser)     // 删除用户
        AdminUserRouter.POST("/:id/activate", api.ActivateUser) // 激活用户
        AdminUserRouter.POST("/:id/deactivate", api.DeactivateUser) // 停用用户
    }
  
    // 系统统计
    AdminSystemRouter := Router.Group("/api/admin/system")
    {
        AdminSystemRouter.GET("/stats", api.GetSystemStats) // 获取系统统计
        AdminSystemRouter.GET("/logs", api.GetSystemLogs)   // 获取系统日志
    }
  
    // 工作流管理
    AdminWorkflowRouter := Router.Group("/api/admin/workflow")
    {
        AdminWorkflowRouter.GET("/all", api.GetAllWorkflows) // 获取所有工作流
        AdminWorkflowRouter.PUT("/:id", api.AdminUpdateWorkflow) // 管理员更新工作流
    }
}
```

## 关键实现细节

### 1. 内存缓存实现 (global/cache.go)
```go
package global

import (
    "sync"
    "time"
)

type CacheItem struct {
    Value      interface{}
    Expiration time.Time
}

type MemoryCache struct {
    items map[string]CacheItem
    mutex sync.RWMutex
}

var Cache *MemoryCache

func InitCache() {
    Cache = &MemoryCache{
        items: make(map[string]CacheItem),
    }
    // 启动定期清理过期项目的goroutine
    go Cache.cleanup()
}

func (c *MemoryCache) Set(key string, value interface{}, duration time.Duration) {
    c.mutex.Lock()
    defer c.mutex.Unlock()
    c.items[key] = CacheItem{
        Value:      value,
        Expiration: time.Now().Add(duration),
    }
}

func (c *MemoryCache) Get(key string) (interface{}, bool) {
    c.mutex.RLock()
    defer c.mutex.RUnlock()
    item, exists := c.items[key]
    if !exists || time.Now().After(item.Expiration) {
        return nil, false
    }
    return item.Value, true
}

func (c *MemoryCache) cleanup() {
    ticker := time.NewTicker(time.Hour)
    defer ticker.Stop()
  
    for range ticker.C {
        c.mutex.Lock()
        now := time.Now()
        for key, item := range c.items {
            if now.After(item.Expiration) {
                delete(c.items, key)
            }
        }
        c.mutex.Unlock()
    }
}
```

### 2. JWT中间件 (middleware/jwt.go)
```go
package middleware

import (
    "github.com/gin-gonic/gin"
    "server/global"
    "server/utils"
    "strings"
)

func JWTAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 跳过OPTIONS请求
        if c.Request.Method == "OPTIONS" {
            c.Next()
            return
        }
      
        authHeader := c.Request.Header.Get("Authorization")
        if authHeader == "" {
            utils.FailWithMessage("请登录", c)
            c.Abort()
            return
        }
      
        parts := strings.SplitN(authHeader, " ", 2)
        if !(len(parts) == 2 && parts[0] == "Bearer") {
            utils.FailWithMessage("Token格式错误", c)
            c.Abort()
            return
        }
      
        claims, err := utils.ParseToken(parts[1])
        if err != nil {
            utils.FailWithMessage("Token无效或已过期", c)
            c.Abort()
            return
        }
      
        // 将用户信息存入上下文
        c.Set("userID", claims.UserID)
        c.Set("userRole", claims.Role)
        c.Next()
    }
}
```

### 3. 短信验证码服务 (utils/sms.go)
```go
package utils

import (
    "fmt"
    "math/rand"
    "time"
    "server/global"
)

// 生成6位数字验证码
func GenerateSMSCode() string {
    rand.Seed(time