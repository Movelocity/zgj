# Resume Polisher API 前端开发文档

## 🚀 快速开始

### 服务器信息
- **基础URL**: `http://localhost:8888`
- **CORS**: 已配置支持前端 `http://localhost:3000`
- **认证方式**: JWT Token (Header: `Authorization: Bearer <token>`)

### 统一响应格式
```json
{
  "code": 0,        // 0=成功, 500=错误, 401=未授权, 403=禁止, 404=未找到
  "data": {},       // 响应数据
  "msg": "操作成功"  // 响应消息
}
```

---

## 👤 用户相关接口

### 1. 用户注册
```http
POST /api/user/register
Content-Type: application/json

{
  "name": "张三",
  "phone": "13800138000", 
  "password": "123456",
  "sms_code": "1234"
}
```

### 2. 用户登录
```http
POST /api/user/login
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "123456"
}
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-01T00:00:00Z",
    "user": {
      "id": "user123",
      "name": "张三",
      "phone": "13800138000",
      "email": "user@example.com",
      "header_img": "http://example.com/avatar.jpg",
      "role": 666,
      "active": true,
      "last_login": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 3. 发送短信验证码
```http
POST /api/user/send_sms
Content-Type: application/json

{
  "phone": "13800138000"
}
```

### 4. 验证短信验证码
```http
POST /api/user/verify_sms
Content-Type: application/json

{
  "phone": "13800138000",
  "sms_code": "1234"
}
```

### 5. 重置密码
```http
POST /api/user/reset_password
Content-Type: application/json

{
  "phone": "13800138000",
  "sms_code": "1234",
  "new_password": "newpass123"
}
```

---

## 🔐 需要认证的用户接口

> **注意**: 以下接口需要在请求头中添加 `Authorization: Bearer <token>`

### 6. 获取用户信息
```http
GET /api/user/profile
Authorization: Bearer <token>
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "user": {
      "id": "user123",
      "name": "张三",
      "phone": "13800138000",
      "email": "user@example.com",
      "header_img": "http://example.com/avatar.jpg",
      "role": 666,
      "active": true
    },
    "data": {},      // 用户扩展数据
    "resumes": []    // 简历列表
  }
}
```

### 7. 更新用户信息
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "email": "lisi@example.com",
  "header_img": "http://example.com/new-avatar.jpg",
  "data": {}
}
```

### 8. 用户登出
```http
POST /api/user/logout
Authorization: Bearer <token>
```

### 9. 上传头像
```http
POST /api/user/upload_avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

// FormData with file field
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "url": "http://localhost:8888/uploads/file/avatars/filename.jpg",
    "filename": "filename.jpg",
    "size": 12345
  }
}
```

### 10. 上传简历
```http
POST /api/user/upload_resume
Authorization: Bearer <token>
Content-Type: multipart/form-data

// FormData with file field
```

---

## 💬 对话管理接口

### 11. 获取对话列表
```http
GET /api/conversation
Authorization: Bearer <token>
```

### 12. 获取特定对话
```http
GET /api/conversation/:id
Authorization: Bearer <token>
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "id": "conv123",
    "title": "简历优化对话",
    "messages": [],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "is_archived": false
  }
}
```

### 13. 创建对话
```http
POST /api/conversation
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新的简历优化对话"
}
```

### 14. 更新对话
```http
PUT /api/conversation/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "更新后的标题",
  "messages": [],
  "is_archived": false
}
```

### 15. 删除对话
```http
DELETE /api/conversation/:id
Authorization: Bearer <token>
```

---

## 🔄 工作流管理接口

### 16. 获取工作流列表
```http
GET /api/workflow
Authorization: Bearer <token>
```

### 17. 获取特定工作流
```http
GET /api/workflow/:id
Authorization: Bearer <token>
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "id": "workflow123",
    "name": "简历优化工作流",
    "description": "自动优化简历内容",
    "inputs": {},
    "outputs": {},
    "used": 10,
    "is_public": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 18. 创建工作流
```http
POST /api/workflow
Authorization: Bearer <token>
Content-Type: application/json

{
  "api_url": "https://api.example.com/workflow",
  "api_key": "your-api-key",
  "name": "新工作流",
  "description": "工作流描述",
  "inputs": {},
  "outputs": {},
  "is_public": false
}
```

### 19. 更新工作流
```http
PUT /api/workflow/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的工作流名称",
  "description": "更新后的描述",
  "is_public": true
}
```

### 20. 删除工作流
```http
DELETE /api/workflow/:id
Authorization: Bearer <token>
```

### 21. 执行工作流
```http
POST /api/workflow/:id/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "inputs": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "success": true,
    "data": {
      "result1": "output1",
      "result2": "output2"
    },
    "message": "执行成功"
  }
}
```

---

## 🔧 管理员接口

> **注意**: 需要管理员权限 (role: 888)

### 用户管理
- `GET /api/admin/user` - 获取所有用户
- `GET /api/admin/user/:id` - 获取特定用户
- `PUT /api/admin/user/:id` - 更新用户信息
- `DELETE /api/admin/user/:id` - 删除用户
- `POST /api/admin/user/:id/activate` - 激活用户
- `POST /api/admin/user/:id/deactivate` - 停用用户

### 系统管理
- `GET /api/admin/system/stats` - 获取系统统计
- `GET /api/admin/system/logs` - 获取系统日志

### 工作流管理
- `GET /api/admin/workflow/all` - 获取所有工作流
- `PUT /api/admin/workflow/:id` - 管理员更新工作流

---

## 📁 文件上传说明

### 支持的文件类型
- **图片**: `image/jpeg`, `image/png`, `image/gif` (最大5MB)
- **文档**: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (最大10MB)

### 上传路径
- 头像: `/uploads/file/avatars/`
- 简历: `/uploads/file/resumes/`

---

## 🔒 认证说明

### JWT Token
- **获取**: 登录成功后从响应中获取 `token`
- **使用**: 请求头添加 `Authorization: Bearer <token>`
- **过期时间**: 7天
- **刷新**: Token过期前24小时内可自动刷新

### 用户角色
- `666`: 普通用户
- `888`: 管理员

---

## ⚠️ 错误处理

### 常见错误码
- `0`: 成功
- `401`: 未授权 (Token无效或过期)
- `403`: 禁止访问 (权限不足)
- `404`: 资源未找到
- `500`: 服务器内部错误

### 错误响应示例
```json
{
  "code": 401,
  "data": {},
  "msg": "Token已过期，请重新登录"
}
```

---

## 💡 开发建议

1. **Token管理**: 建议使用拦截器统一处理Token过期
2. **错误处理**: 根据响应码统一处理不同类型的错误
3. **文件上传**: 使用FormData进行文件上传
4. **类型定义**: 建议为所有接口定义TypeScript类型
5. **环境配置**: 开发和生产环境使用不同的baseURL

### 示例代码 (JavaScript/TypeScript)
```javascript
// API基础配置
const API_BASE_URL = 'http://localhost:8888';

// 请求拦截器
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
axios.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Token过期，跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

📝 **更新时间**: 2025年9月14日
📋 **更新内容**: 基于控制台路由验证，统一路由格式为 `:id` 形式
🔗 **项目地址**: [Resume Polisher](https://github.com/your-repo)
