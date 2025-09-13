# Resume Polisher Backend

基于Go + Gin + PostgreSQL的简历优化平台后端服务。

## 功能特性

- 用户注册/登录/认证
- 简历上传和管理
- 对话管理
- 工作流管理
- 管理员功能
- JWT认证
- 内存缓存
- 短信验证码
- 文件上传
- 日志记录

## 技术栈

- **框架**: Gin
- **数据库**: PostgreSQL
- **ORM**: GORM
- **认证**: JWT
- **日志**: Zap
- **配置**: Viper
- **缓存**: 内存缓存

## 项目结构

```
server/
├── api/                    # API接口层
│   ├── user/              # 用户相关API
│   ├── app/               # 应用API
│   └── system/            # 系统管理API
├── service/               # 业务逻辑层
├── router/                # 路由层
├── model/                 # 数据模型
├── middleware/            # 中间件
├── utils/                 # 工具包
├── global/                # 全局变量
├── initialize/            # 初始化模块
├── config/                # 配置结构体
├── config.yaml            # 配置文件
└── main.go                # 入口文件
```

## 快速开始

### 1. 环境要求

- Go 1.21+
- PostgreSQL 12+

### 2. 安装依赖

```bash
cd server
go mod tidy
```

### 3. 配置数据库

修改 `config.yaml` 中的数据库配置：

```yaml
pgsql:
  host: "localhost"
  port: 5666
  db-name: "your_db_name"
  username: "postgres"
  password: "your_password"
  sslmode: "disable"
```

### 4. 运行项目

```bash
go run main.go
```

服务器将在 `http://localhost:8888` 启动。

## API文档

### 公共接口

- `POST /api/user/register` - 用户注册
- `POST /api/user/login` - 用户登录
- `POST /api/user/send_sms` - 发送短信验证码
- `POST /api/user/verify_sms` - 验证短信验证码
- `POST /api/user/reset_password` - 重置密码

### 用户接口 (需要JWT认证)

- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息
- `POST /api/user/logout` - 用户登出
- `POST /api/user/upload_avatar` - 上传头像
- `POST /api/user/upload_resume` - 上传简历

### 对话接口

- `GET /api/conversation` - 获取对话列表
- `GET /api/conversation/:id` - 获取特定对话
- `POST /api/conversation` - 创建对话
- `PUT /api/conversation/:id` - 更新对话
- `DELETE /api/conversation/:id` - 删除对话

### 工作流接口

- `GET /api/workflow` - 获取工作流列表
- `GET /api/workflow/:id` - 获取特定工作流
- `POST /api/workflow` - 创建工作流
- `PUT /api/workflow/:id` - 更新工作流
- `DELETE /api/workflow/:id` - 删除工作流
- `POST /api/workflow/:id/execute` - 执行工作流

### 管理员接口 (需要管理员权限)

- `GET /api/admin/user` - 获取所有用户
- `GET /api/admin/user/:id` - 获取特定用户
- `PUT /api/admin/user/:id` - 更新用户信息
- `DELETE /api/admin/user/:id` - 删除用户
- `POST /api/admin/user/:id/activate` - 激活用户
- `POST /api/admin/user/:id/deactivate` - 停用用户
- `GET /api/admin/system/stats` - 获取系统统计
- `GET /api/admin/system/logs` - 获取系统日志

## 配置说明

### 服务器配置

```yaml
server:
  port: 8888              # 服务端口
  mode: "debug"           # 运行模式: debug/release/test
```

### 数据库配置

```yaml
pgsql:
  host: "localhost"       # 数据库主机
  port: 5666             # 数据库端口
  db-name: "your_db"     # 数据库名
  username: "postgres"    # 用户名
  password: "password"    # 密码
  max-idle-conns: 10     # 最大空闲连接数
  max-open-conns: 100    # 最大打开连接数
```

### JWT配置

```yaml
jwt:
  signing-key: "your_secret_key"  # JWT签名密钥
  expires-time: "168h"            # 过期时间(7天)
  buffer-time: "24h"              # 缓冲时间(1天)
  issuer: "CLOUD"                 # 签发者
```

## 开发说明

### 添加新的API接口

1. 在 `model/` 中定义数据模型
2. 在 `api/` 中定义请求和响应结构体
3. 在 `service/` 中实现业务逻辑
4. 在 `api/` 中实现API处理函数
5. 在 `router/` 中注册路由

### 数据库迁移

项目启动时会自动执行数据库迁移，创建所需的表结构。

### 日志

日志文件存储在 `log/` 目录下，支持日志轮转。

## 许可证

MIT License
