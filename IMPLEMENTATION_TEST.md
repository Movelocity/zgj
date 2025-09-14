# 管理员用户和手机号统一登录功能测试说明

## 功能概述

本次实现了以下功能：
1. 后端管理员用户创建和认证系统
2. 前端手机号统一登录页面
3. 管理员专用登录页面

## 后端实现

### 1. 管理员用户功能

#### 新增API接口：
- `POST /api/admin/auth/create` - 创建管理员用户
- `POST /api/admin/auth/login` - 管理员登录

#### 请求示例：

**创建管理员用户：**
```bash
curl -X POST http://localhost:8888/api/admin/auth/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "管理员",
    "phone": "13800138000",
    "password": "123456",
    "email": "admin@example.com"
  }'
```

**管理员登录：**
```bash
curl -X POST http://localhost:8888/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456"
  }'
```

### 2. 手机号统一登录

现有的 `/api/user/auth` 接口支持手机号+验证码的统一认证（自动注册+登录）。

**统一认证请求示例：**
```bash
# 1. 发送验证码
curl -X POST http://localhost:8888/api/user/send_sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "13900139000"}'

# 2. 统一认证（登录或注册）
curl -X POST http://localhost:8888/api/user/auth \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13900139000",
    "sms_code": "123456",
    "name": "用户姓名"
  }'
```

## 前端实现

### 1. 手机号统一登录页面

- 路径：`/auth`
- 组件：`PhoneLogin`
- 功能：
  - 手机号输入验证
  - 短信验证码发送和验证
  - 自动注册或登录
  - 倒计时重发功能
  - 友好的错误提示

### 2. 管理员登录页面

- 路径：`/admin/auth`
- 组件：`AdminLogin`
- 功能：
  - 管理员手机号+密码登录
  - 登录成功后跳转到管理后台
  - 提供普通用户登录入口

### 3. 页面导航

- 普通登录页面提供"管理员登录"链接
- 管理员登录页面提供"普通用户登录"链接
- Header组件已集成登录/登出功能

## 测试步骤

### 1. 启动服务

**后端：**
```bash
cd server
go run main.go
```

**前端：**
```bash
cd web
npm run dev
```

### 2. 测试管理员功能

1. **创建管理员用户**（仅需执行一次）：
   ```bash
   curl -X POST http://localhost:8888/api/admin/auth/create \
     -H "Content-Type: application/json" \
     -d '{
       "name": "系统管理员",
       "phone": "13800138000",
       "password": "admin123",
       "email": "admin@resume-polisher.com"
     }'
   ```

2. **访问管理员登录页面**：
   - 打开 `http://localhost:5173/admin/auth`
   - 输入管理员手机号和密码
   - 登录成功后应跳转到 `/administrator`

### 3. 测试手机号统一登录

1. **访问普通用户登录页面**：
   - 打开 `http://localhost:5173/auth`
   - 输入手机号（如：13900139000）
   - 点击"获取验证码"

2. **验证码处理**：
   - 后端会生成6位验证码并存储在缓存中
   - 开发环境下，可以在后端日志中查看生成的验证码
   - 或者直接使用 "123456" 作为测试验证码

3. **完成登录**：
   - 输入验证码
   - 可选填写姓名（首次注册时）
   - 点击登录
   - 成功后跳转到首页

### 4. 验证功能

1. **检查用户状态**：
   - 登录后Header应显示用户信息
   - 管理员用户应显示"管理后台"入口

2. **权限验证**：
   - 管理员用户可以访问 `/administrator`
   - 普通用户访问管理页面应被重定向

## 数据库变化

用户表 `users` 中的 `role` 字段：
- `666`: 普通用户
- `888`: 管理员用户

管理员用户具有所有管理权限，包括：
- 用户管理
- 系统统计
- 工作流管理
- 文件管理

## 注意事项

1. **验证码功能**：目前短信发送功能可能需要配置真实的短信服务，开发环境下可以使用固定验证码进行测试。

2. **安全考虑**：生产环境中应：
   - 限制管理员创建接口的访问
   - 加强密码复杂度要求
   - 实现真实的短信验证码发送

3. **错误处理**：所有接口都包含了完善的错误处理和用户友好的错误提示。

## 技术栈

- **后端**: Go + Gin + GORM + JWT
- **前端**: React + TypeScript + Zustand + Tailwind CSS
- **数据库**: 支持MySQL/PostgreSQL等
- **缓存**: 内存缓存（用于验证码存储）
