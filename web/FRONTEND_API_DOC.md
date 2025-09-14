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

### 2. 统一认证（推荐）
```http
POST /api/user/auth
Content-Type: application/json

{
  "phone": "13800138000",
  "sms_code": "1234",
  "name": "张三"  // 可选，首次注册时提供
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
    },
    "is_new_user": false  // true表示新注册用户
  }
}
```

### 3. 用户登录（传统方式）
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

### 4. 发送短信验证码
```http
POST /api/user/send_sms
Content-Type: application/json

{
  "phone": "13800138000"
}
```

### 5. 验证短信验证码
```http
POST /api/user/verify_sms
Content-Type: application/json

{
  "phone": "13800138000",
  "sms_code": "1234"
}
```

### 6. 重置密码
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

### 7. 获取用户信息
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

### 8. 更新用户信息
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

### 9. 用户登出
```http
POST /api/user/logout
Authorization: Bearer <token>
```

### 10. 上传头像
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

### 11. 上传简历（旧版）
```http
POST /api/user/upload_resume
Authorization: Bearer <token>
Content-Type: multipart/form-data

// FormData with file field
```

---

## 📄 简历管理接口

### 12. 获取用户简历列表
```http
GET /api/user/resumes?page=1&page_size=10
Authorization: Bearer <token>
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "resume123",
        "resume_number": "R123456001",
        "name": "我的简历",
        "version": 1,
        "original_filename": "resume.pdf",
        "file_path": "/uploads/file/resumes/resume123.pdf",
        "file_size": 12345,
        "file_type": "application/pdf",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

### 13. 获取特定简历详情
```http
GET /api/user/resumes/:id
Authorization: Bearer <token>
```

### 14. 更新简历信息
```http
PUT /api/user/resumes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的简历名称"
}
```

### 15. 删除简历
```http
DELETE /api/user/resumes/:id
Authorization: Bearer <token>
```

### 16. 上传简历（新版）
```http
POST /api/user/resumes/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

// FormData with file field
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "id": "resume123",
    "resume_number": "R123456001",
    "name": "resume.pdf",
    "url": "http://localhost:8888/uploads/file/resumes/resume123.pdf",
    "size": 12345,
    "type": "application/pdf"
  }
}
```

### 17. 获取用户工作流使用历史
```http
GET /api/user/workflow_history?page=1&page_size=10
Authorization: Bearer <token>
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "exec123",
        "workflow_id": "workflow123",
        "workflow_name": "简历优化工作流",
        "resume_id": "resume123",
        "status": "success",
        "execution_time": 1500,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

---

## 💬 对话管理接口

### 18. 获取对话列表
```http
GET /api/conversation
Authorization: Bearer <token>
```

### 19. 获取特定对话
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

### 20. 创建对话
```http
POST /api/conversation
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新的简历优化对话"
}
```

### 21. 更新对话
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

### 22. 删除对话
```http
DELETE /api/conversation/:id
Authorization: Bearer <token>
```

---

## 🔄 工作流管理接口

### 23. 获取工作流列表
```http
GET /api/workflow
Authorization: Bearer <token>
```

### 24. 获取特定工作流
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

### 25. 创建工作流
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

### 26. 更新工作流
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

### 27. 删除工作流
```http
DELETE /api/workflow/:id
Authorization: Bearer <token>
```

### 28. 执行工作流
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

### 29. 获取工作流执行历史
```http
GET /api/workflow/:id/history?page=1&page_size=10
Authorization: Bearer <token>
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "exec123",
        "user_id": "user123",
        "resume_id": "resume123",
        "inputs": {"param1": "value1"},
        "outputs": {"result1": "output1"},
        "status": "success",
        "execution_time": 1500,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

### 30. 获取工作流统计信息
```http
GET /api/workflow/:id/stats
Authorization: Bearer <token>
```

**响应数据:**
```json
{
  "code": 0,
  "data": {
    "total_executions": 100,
    "success_rate": 95.5,
    "average_execution_time": 1200,
    "last_execution": "2024-01-01T00:00:00Z"
  }
}
```

### 31. 获取执行详情
```http
GET /api/execution/:id
Authorization: Bearer <token>
```

---

## 🔧 管理员接口

> **注意**: 需要管理员权限 (role: 888)

### 用户管理
- `GET /api/admin/user?page=1&page_size=10` - 获取所有用户（分页）
- `GET /api/admin/user/:id` - 获取特定用户
- `PUT /api/admin/user/:id` - 更新用户信息
- `DELETE /api/admin/user/:id` - 删除用户
- `POST /api/admin/user/:id/activate` - 激活用户
- `POST /api/admin/user/:id/deactivate` - 停用用户
- `GET /api/admin/user/:id/resumes?page=1&page_size=10` - 管理员查看用户简历（分页）

### 系统管理
- `GET /api/admin/system/stats` - 获取系统统计
- `GET /api/admin/system/logs?page=1&page_size=10` - 获取系统日志（分页）

### 工作流管理
- `GET /api/admin/workflow/all` - 获取所有工作流
- `PUT /api/admin/workflow/:id` - 管理员更新工作流

### 文件管理
- `GET /api/admin/files/stats` - 获取文件统计信息
- `GET /api/admin/files?page=1&page_size=10&type=resume` - 获取文件列表（分页，支持类型筛选）
- `DELETE /api/admin/files/:id` - 删除文件
- `POST /api/admin/files/batch_delete` - 批量删除文件

### 数据迁移
- `POST /api/admin/migration/resume` - 迁移旧简历数据

**文件统计响应示例:**
```json
{
  "code": 0,
  "data": {
    "total_files": 150,
    "resume_count": 120,
    "avatar_count": 30,
    "total_size": 52428800,
    "storage_usage": "50MB"
  }
}
```

**文件列表响应示例:**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "file123",
        "filename": "resume.pdf",
        "file_type": "resume",
        "file_size": 12345,
        "user_id": "user123",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 120,
    "page": 1,
    "page_size": 10
  }
}
```

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
