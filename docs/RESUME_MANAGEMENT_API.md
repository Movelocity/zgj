# 简历管理 API 文档

## 概述

本文档描述了简历管理系统的后端 API 接口，包括简历的上传、查看、更新、删除等功能。所有接口都需要用户认证。

## 基本信息

- **基础路径**: `/api/user/resumes`
- **认证方式**: JWT Token (通过 Authorization 头传递)
- **响应格式**: JSON

## 数据模型

### ResumeInfo (简历基本信息)
```typescript
interface ResumeInfo {
  id: string;               // 简历ID (TLID格式)
  resume_number: string;    // 简历编号 (格式: R{用户ID后6位}{序号})
  version: number;          // 版本号
  name: string;            // 简历名称
  original_filename: string; // 原始文件名
  file_id: string;         // 关联文件ID (可为空，纯文本简历)
  status: string;          // 状态 (active/deleted)
  created_at: string;      // 创建时间
  updated_at: string;      // 更新时间
}
```

### ResumeDetailInfo (简历详细信息)
```typescript
interface ResumeDetailInfo {
  id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  text_content: string;     // 纯文本内容
  structured_data: any;     // 结构化数据 (JSON)
  status: string;
  created_at: string;
  updated_at: string;
}
```

### ResumeListResponse (简历列表响应)
```typescript
interface ResumeListResponse {
  list: ResumeInfo[];       // 简历列表
  total: number;           // 总数量
  page: number;            // 当前页
  page_size: number;       // 每页大小
}
```

### UpdateResumeRequest (更新简历请求)
```typescript
interface UpdateResumeRequest {
  name?: string;           // 简历名称
  text_content?: string;   // 纯文本内容
  structured_data?: any;   // 结构化数据
}
```

### UploadResumeResponse (上传简历响应)
```typescript
interface UploadResumeResponse {
  id: string;              // 简历ID
  resume_number: string;   // 简历编号
  url: string;            // 文件访问URL
  filename: string;       // 文件名
  size: number;           // 文件大小 (字节)
}
```

## API 接口

### 1. 获取简历列表

**接口**: `GET /api/user/resumes`

**描述**: 获取当前用户的简历列表，支持分页

**请求参数**:
- `page` (query, optional): 页码，默认为 1
- `page_size` (query, optional): 每页数量，默认为 10，最大 100

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "T1234567890123456789",
        "resume_number": "R12345001",
        "version": 1,
        "name": "软件工程师简历.pdf",
        "original_filename": "resume.pdf",
        "file_id": "F1234567890123456789",
        "status": "active",
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

### 2. 获取简历详情

**接口**: `GET /api/user/resumes/{id}`

**描述**: 获取指定简历的详细信息

**路径参数**:
- `id` (required): 简历ID

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "T1234567890123456789",
    "resume_number": "R12345001",
    "version": 1,
    "name": "软件工程师简历.pdf",
    "original_filename": "resume.pdf",
    "file_id": "F1234567890123456789",
    "text_content": "简历文本内容...",
    "structured_data": {
      "personal_info": {
        "name": "张三",
        "email": "zhangsan@example.com"
      }
    },
    "status": "active",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### 3. 上传简历文件

**接口**: `POST /api/user/resumes/upload`

**描述**: 上传简历文件 (支持 PDF, DOC, DOCX)

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (required): 简历文件

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "T1234567890123456789",
    "resume_number": "R12345001",
    "url": "/api/files/F1234567890123456789/preview",
    "filename": "resume.pdf",
    "size": 1024000
  }
}
```

### 4. 创建纯文本简历

**接口**: `POST /api/user/resumes/create_text`

**描述**: 创建纯文本格式的简历

**请求体**:
```json
{
  "name": "我的简历",
  "text_content": "个人信息\n姓名：张三\n..."
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "T1234567890123456789",
    "resume_number": "R12345001",
    "url": "",
    "filename": "我的简历",
    "size": 500
  }
}
```

### 5. 更新简历信息

**接口**: `PUT /api/user/resumes/{id}`

**描述**: 更新简历的基本信息、文本内容或结构化数据

**路径参数**:
- `id` (required): 简历ID

**请求体**:
```json
{
  "name": "新的简历名称",
  "text_content": "更新后的文本内容",
  "structured_data": {
    "personal_info": {
      "name": "李四",
      "email": "lisi@example.com"
    }
  }
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "简历更新成功"
}
```

### 6. 删除简历

**接口**: `DELETE /api/user/resumes/{id}`

**描述**: 删除指定简历 (软删除)

**路径参数**:
- `id` (required): 简历ID

**响应示例**:
```json
{
  "code": 0,
  "message": "简历删除成功"
}
```

## 管理员接口

### 7. 管理员查看用户简历

**接口**: `GET /api/admin/users/{user_id}/resumes`

**描述**: 管理员查看指定用户的简历列表

**路径参数**:
- `user_id` (required): 用户ID

**请求参数**:
- `page` (query, optional): 页码，默认为 1
- `page_size` (query, optional): 每页数量，默认为 10

**权限要求**: 管理员权限

### 8. 简历数据迁移

**接口**: `POST /api/admin/resumes/migrate`

**描述**: 从旧的用户资料表迁移简历数据到新的简历表

**权限要求**: 管理员权限

**响应示例**:
```json
{
  "code": 0,
  "message": "简历数据迁移成功"
}
```

## 文件管理相关接口

### 9. 文件预览/下载

**接口**: `GET /api/files/{file_id}/preview`

**描述**: 预览或下载简历文件

**路径参数**:
- `file_id` (required): 文件ID

**请求参数**:
- `as_attachment` (query, optional): 是否作为附件下载，默认为 false

**响应**: 直接返回文件内容或下载文件

### 10. 获取文件信息

**接口**: `GET /api/files/{file_id}/info`

**描述**: 获取文件的基本信息

**路径参数**:
- `file_id` (required): 文件ID

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "F1234567890123456789",
    "name": "resume.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### JavaScript/TypeScript 示例

```typescript
// 获取简历列表
const getResumes = async (page = 1, pageSize = 10) => {
  const response = await fetch(`/api/user/resumes?page=${page}&page_size=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// 上传简历
const uploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/user/resumes/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};

// 删除简历
const deleteResume = async (resumeId: string) => {
  const response = await fetch(`/api/user/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## 注意事项

1. **文件限制**: 上传的简历文件大小不能超过 10MB，支持的格式为 PDF、DOC、DOCX
2. **编号规则**: 简历编号格式为 `R{用户ID后6位}{3位序号}`，如 `R123456001`
3. **软删除**: 删除操作为软删除，简历记录仍保留在数据库中，状态标记为 `deleted`
4. **权限控制**: 用户只能管理自己的简历，管理员可以查看所有用户的简历
5. **文件存储**: 简历文件通过统一的文件管理系统存储，通过 `file_id` 关联
6. **版本管理**: 当前版本固定为 1，后续可扩展版本控制功能
