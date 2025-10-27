# 网站变量管理 API 文档

## 概述

网站变量管理功能允许管理员创建、更新、删除和查询网站全局变量，非管理员用户可以通过key查询获取变量的值和描述。

## 数据库表结构

表名：`site_variables`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int64 | 自增主键 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |
| key | varchar(100) | 变量键名（唯一） |
| value | text | 变量值 |
| description | varchar(500) | 变量描述 |

## API 接口

### 1. 管理员接口

#### 1.1 创建网站变量

**请求**
```
POST /api/admin/site-variables
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**
```json
{
  "key": "site_name",
  "value": "我的网站",
  "description": "网站名称"
}
```

**响应**
```json
{
  "code": 0,
  "message": "创建成功"
}
```

---

#### 1.2 更新网站变量

**请求**
```
PUT /api/admin/site-variables/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**
```json
{
  "value": "新的网站名称",
  "description": "更新后的描述"
}
```

**响应**
```json
{
  "code": 0,
  "message": "更新成功"
}
```

---

#### 1.3 删除网站变量

**请求**
```
DELETE /api/admin/site-variables/{id}
Authorization: Bearer {token}
```

**响应**
```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

#### 1.4 获取网站变量列表

**请求**
```
GET /api/admin/site-variables?page=1&pageSize=20&key=site
Authorization: Bearer {token}
```

**查询参数**
- `page`: 页码（可选，默认 1）
- `pageSize`: 每页数量（可选，默认 20）
- `key`: 键名模糊搜索（可选）

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "created_at": "2025-10-27T10:00:00Z",
        "updated_at": "2025-10-27T10:00:00Z",
        "key": "site_name",
        "value": "我的网站",
        "description": "网站名称"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### 1.5 通过ID获取网站变量详情

**请求**
```
GET /api/admin/site-variables/{id}
Authorization: Bearer {token}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "created_at": "2025-10-27T10:00:00Z",
    "updated_at": "2025-10-27T10:00:00Z",
    "key": "site_name",
    "value": "我的网站",
    "description": "网站名称"
  }
}
```

---

### 2. 公开接口

#### 2.1 通过key获取网站变量

**请求**
```
GET /api/public/site-variables/by-key?key=site_name
```

**查询参数**
- `key`: 变量键名（必填）

**响应**
```json
{
  "code": 0,
  "data": {
    "value": "我的网站",
    "description": "网站名称"
  }
}
```

---

## 前端使用示例

### 管理员使用

```typescript
import { siteVariableAPI } from '@/api/siteVariable';

// 创建网站变量
const createVariable = async () => {
  const response = await siteVariableAPI.createSiteVariable({
    key: 'site_name',
    value: '我的网站',
    description: '网站名称'
  });
  
  if (response.code === 0) {
    console.log('创建成功');
  }
};

// 更新网站变量
const updateVariable = async (id: number) => {
  const response = await siteVariableAPI.updateSiteVariable(id, {
    value: '新的网站名称',
    description: '更新后的描述'
  });
  
  if (response.code === 0) {
    console.log('更新成功');
  }
};

// 删除网站变量
const deleteVariable = async (id: number) => {
  const response = await siteVariableAPI.deleteSiteVariable(id);
  
  if (response.code === 0) {
    console.log('删除成功');
  }
};

// 获取变量列表
const getVariables = async () => {
  const response = await siteVariableAPI.getSiteVariableList({
    page: 1,
    pageSize: 20,
    key: 'site' // 可选，模糊搜索
  });
  
  if (response.code === 0) {
    console.log('变量列表:', response.data.list);
  }
};
```

### 普通用户使用

```typescript
import { siteVariableAPI } from '@/api/siteVariable';

// 通过key获取网站变量
const getVariableByKey = async () => {
  const response = await siteVariableAPI.getSiteVariableByKey('site_name');
  
  if (response.code === 0) {
    console.log('变量值:', response.data.value);
    console.log('变量描述:', response.data.description);
  }
};
```

---

## 常见变量键名建议

| Key | Value 示例 | Description |
|-----|-----------|-------------|
| site_name | 简历润色工具 | 网站名称 |
| site_description | 专业的AI简历优化平台 | 网站描述 |
| contact_email | support@example.com | 联系邮箱 |
| announcement | 系统维护通知 | 公告信息 |
| max_file_size | 10485760 | 最大文件大小（字节） |
| enable_registration | true | 是否开放注册 |
| maintenance_mode | false | 维护模式 |

---

## 注意事项

1. **key 必须唯一**：创建时如果 key 已存在会返回错误
2. **key 不可修改**：编辑时只能修改 value 和 description
3. **权限控制**：
   - 创建、更新、删除、获取列表：需要管理员权限
   - 通过key查询：公开接口，无需认证
4. **value 类型**：value 字段为 text 类型，可以存储较长的文本，包括JSON格式的数据
5. **命名规范**：建议 key 使用下划线分隔的小写字母，如 `site_name`、`max_file_size`

---

## 错误码

| Code | Message | 说明 |
|------|---------|------|
| 0 | 成功 | 操作成功 |
| -1 | 失败 | 通用错误 |
| 具体错误信息 | 变量键名已存在 | key 重复 |
| 具体错误信息 | 变量不存在 | id 或 key 不存在 |
| 具体错误信息 | key参数不能为空 | 缺少必填参数 |

