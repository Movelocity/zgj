# 工作流管理API文档

## 概述

本文档描述了简历润色工具的工作流管理相关API接口。工作流执行功能暂时搁置，本文档主要涵盖工作流的CRUD操作、历史记录查询和统计信息获取。

## 数据模型

### Workflow 工作流模型

```go
type Workflow struct {
    ID          string    `json:"id"`          // 自动生成的TLID，主键
    ApiURL      string    `json:"api_url"`     // 接口地址，必填，最大500字符
    ApiKey      string    `json:"api_key"`     // API密钥，必填，最大255字符，明文存储
    Name        string    `json:"name"`        // 工作流名称，必填，最大100字符
    Description string    `json:"description"` // 工作流描述，可选，最大500字符
    CreatorID   string    `json:"creator_id"`  // 创建者用户ID
    Inputs      JSON      `json:"inputs"`      // 输入参数配置，JSON格式，默认为 {}
    Outputs     JSON      `json:"outputs"`     // 输出参数配置，JSON格式，默认为 {}
    Used        int64     `json:"used"`        // 使用次数，默认为0
    IsPublic    bool      `json:"is_public"`   // 是否公开，默认false
    Enabled     bool      `json:"enabled"`     // 工作流是否启用，默认true
    CreatedAt   time.Time `json:"created_at"`  // 创建时间
    UpdatedAt   time.Time `json:"updated_at"`  // 更新时间
}
```

### Field 字段定义模型

```go
type Field struct {
    FieldName string `json:"field_name"` // 字段名称
    FieldType string `json:"field_type"` // 字段类型: string/number/boolean/file
    Required  bool   `json:"required"`   // 是否必填
}
```

## 重要规则

1. **工作流名称唯一性**: `enabled` 状态的工作流不能重名（需要在业务逻辑中实现此验证）
2. **权限控制**: 用户只能管理自己创建的工作流，或访问公开的工作流
3. **管理员权限**: 管理员可以管理所有工作流

## API接口

### 用户工作流管理

#### 1. 获取工作流列表

**接口地址**: `GET /api/workflow`

**请求头**: 
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
    "code": 200,
    "data": [
        {
            "id": "wf_1234567890abcdef",
            "name": "简历优化工作流",
            "description": "自动优化简历内容和格式",
            "inputs": {},
            "outputs": {},
            "used": 25,
            "is_public": false,
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z"
        }
    ],
    "message": "success"
}
```

**说明**: 返回用户创建的工作流和公开的工作流列表，按更新时间倒序排列。

#### 2. 获取特定工作流

**接口地址**: `GET /api/workflow/{id}`

**请求头**: 
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 工作流ID

**响应示例**:
```json
{
    "code": 200,
    "data": {
        "id": "wf_1234567890abcdef",
        "name": "简历优化工作流",
        "description": "自动优化简历内容和格式",
        "inputs": {
            "resume_content": {
                "field_name": "resume_content",
                "field_type": "string",
                "required": true
            }
        },
        "outputs": {
            "optimized_content": {
                "field_name": "optimized_content",
                "field_type": "string",
                "required": true
            }
        },
        "used": 25,
        "is_public": false,
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z"
    },
    "message": "success"
}
```

#### 3. 创建工作流

**接口地址**: `POST /api/workflow`

**请求头**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
    "api_url": "https://api.example.com/workflow",
    "api_key": "sk-1234567890abcdef",
    "name": "新工作流",
    "description": "工作流描述",
    "inputs": {
        "input_field": {
            "field_name": "input_field",
            "field_type": "string",
            "required": true
        }
    },
    "outputs": {
        "output_field": {
            "field_name": "output_field",
            "field_type": "string",
            "required": true
        }
    },
    "is_public": false
}
```

**字段说明**:
- `api_url` (必填): 工作流接口地址
- `api_key` (必填): API密钥
- `name` (必填): 工作流名称
- `description` (可选): 工作流描述
- `inputs` (可选): 输入参数配置
- `outputs` (可选): 输出参数配置
- `is_public` (可选): 是否公开，默认false

**响应示例**:
```json
{
    "code": 200,
    "data": {
        "id": "wf_1234567890abcdef",
        "name": "新工作流",
        "description": "工作流描述",
        "inputs": {...},
        "outputs": {...},
        "used": 0,
        "is_public": false,
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z"
    },
    "message": "success"
}
```

#### 4. 更新工作流

**接口地址**: `PUT /api/workflow/{id}`

**请求头**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
- `id`: 工作流ID

**请求体**:
```json
{
    "api_url": "https://api.example.com/workflow-v2",
    "api_key": "sk-new1234567890abcdef",
    "name": "更新后的工作流",
    "description": "更新后的描述",
    "inputs": {...},
    "outputs": {...},
    "is_public": true
}
```

**说明**: 所有字段都是可选的，只更新提供的字段。用户只能更新自己创建的工作流。

**响应示例**:
```json
{
    "code": 200,
    "data": null,
    "message": "更新成功"
}
```

#### 5. 删除工作流

**接口地址**: `DELETE /api/workflow/{id}`

**请求头**: 
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 工作流ID

**说明**: 用户只能删除自己创建的工作流。

**响应示例**:
```json
{
    "code": 200,
    "data": null,
    "message": "删除成功"
}
```

### 工作流历史和统计

#### 6. 获取工作流执行历史

**接口地址**: `GET /api/workflow/{id}/history`

**请求头**: 
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 工作流ID

**查询参数**:
- `page`: 页码，默认1
- `page_size`: 每页数量，默认10，最大100

**响应示例**:
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": "exec_1234567890abcdef",
                "workflow_id": "wf_1234567890abcdef",
                "workflow_name": "简历优化工作流",
                "resume_id": "resume_1234567890abcdef",
                "resume_name": "我的简历.pdf",
                "inputs": {...},
                "outputs": {...},
                "status": "success",
                "error_message": "",
                "execution_time": 1500,
                "created_at": "2024-01-01T12:00:00Z"
            }
        ],
        "total": 50,
        "page": 1,
        "page_size": 10
    },
    "message": "success"
}
```

#### 7. 获取用户工作流使用历史

**接口地址**: `GET /api/user/workflow_history`

**请求头**: 
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码，默认1
- `page_size`: 每页数量，默认10，最大100

**响应示例**:
```json
{
    "code": 200,
    "data": {
        "list": [
            {
                "id": "exec_1234567890abcdef",
                "workflow_id": "wf_1234567890abcdef",
                "workflow_name": "简历优化工作流",
                "resume_id": "resume_1234567890abcdef",
                "resume_name": "我的简历.pdf",
                "inputs": {...},
                "outputs": {...},
                "status": "success",
                "error_message": "",
                "execution_time": 1500,
                "created_at": "2024-01-01T12:00:00Z"
            }
        ],
        "total": 100,
        "page": 1,
        "page_size": 10
    },
    "message": "success"
}
```

#### 8. 获取执行详情

**接口地址**: `GET /api/execution/{id}`

**请求头**: 
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 执行记录ID

**响应示例**:
```json
{
    "code": 200,
    "data": {
        "id": "exec_1234567890abcdef",
        "workflow_id": "wf_1234567890abcdef",
        "workflow_name": "简历优化工作流",
        "user_id": "user_1234567890abcdef",
        "user_name": "张三",
        "resume_id": "resume_1234567890abcdef",
        "resume_name": "我的简历.pdf",
        "inputs": {...},
        "outputs": {...},
        "status": "success",
        "error_message": "",
        "execution_time": 1500,
        "created_at": "2024-01-01T12:00:00Z"
    },
    "message": "success"
}
```

#### 9. 获取工作流统计信息

**接口地址**: `GET /api/workflow/{id}/stats`

**请求头**: 
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 工作流ID

**响应示例**:
```json
{
    "code": 200,
    "data": {
        "total_executions": 100,
        "success_executions": 95,
        "failed_executions": 5,
        "success_rate": 95.0,
        "avg_execution_time": 1200,
        "last_execution_at": "2024-01-01T12:00:00Z"
    },
    "message": "success"
}
```

### 管理员工作流管理

#### 10. 获取所有工作流（管理员）

**接口地址**: `GET /api/admin/workflow/all`

**请求头**: 
```
Authorization: Bearer <admin_token>
```

**说明**: 需要管理员权限。

**响应示例**:
```json
{
    "code": 200,
    "data": [
        {
            "id": "wf_1234567890abcdef",
            "name": "简历优化工作流",
            "description": "自动优化简历内容和格式",
            "inputs": {...},
            "outputs": {...},
            "used": 25,
            "is_public": false,
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z"
        }
    ],
    "message": "success"
}
```

#### 11. 管理员更新工作流

**接口地址**: `PUT /api/admin/workflow/{id}`

**请求头**: 
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**路径参数**:
- `id`: 工作流ID

**请求体**:
```json
{
    "api_url": "https://api.example.com/workflow-v2",
    "api_key": "sk-new1234567890abcdef",
    "name": "管理员更新的工作流",
    "description": "管理员更新的描述",
    "inputs": {...},
    "outputs": {...},
    "is_public": true
}
```

**说明**: 管理员可以更新任何工作流，所有字段都是可选的。

**响应示例**:
```json
{
    "code": 200,
    "data": null,
    "message": "更新成功"
}
```

## 错误响应

所有接口在出错时都会返回以下格式的错误响应：

```json
{
    "code": 400,
    "data": null,
    "message": "具体的错误信息"
}
```

**常见错误码**:
- `400`: 请求参数错误
- `401`: 未授权，需要登录
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 业务规则

### 工作流名称唯一性
- `enabled` 状态的工作流名称必须唯一
- 创建和更新工作流时需要验证名称重复性
- 建议在数据库层面添加唯一索引：`CREATE UNIQUE INDEX idx_workflow_name_enabled ON workflows(name) WHERE enabled = true;`

### 权限控制
- 普通用户只能查看和管理自己创建的工作流
- 普通用户可以查看所有公开的工作流
- 管理员可以查看和管理所有工作流

### 数据完整性
- `api_url` 和 `api_key` 为必填字段
- `name` 为必填字段且不能为空
- `inputs` 和 `outputs` 默认为空对象 `{}`
- 删除工作流时应该考虑级联删除相关的执行历史记录

## 注意事项

1. **API密钥安全**: API密钥以明文存储在数据库中，请确保数据库访问安全
2. **分页限制**: 历史记录查询支持分页，单页最大100条记录
3. **执行状态**: 执行状态包括 `success`、`failed` 等
4. **时间字段**: 所有时间字段均使用ISO 8601格式
5. **工作流执行**: 工作流执行功能暂时搁置，相关接口保留但不实现具体执行逻辑

## 数据库索引建议

为了提高查询性能，建议添加以下索引：

```sql
-- 工作流创建者索引
CREATE INDEX idx_workflows_creator_id ON workflows(creator_id);

-- 工作流公开状态索引  
CREATE INDEX idx_workflows_is_public ON workflows(is_public);

-- 工作流启用状态索引
CREATE INDEX idx_workflows_enabled ON workflows(enabled);

-- 工作流名称唯一性索引（仅针对启用的工作流）
CREATE UNIQUE INDEX idx_workflow_name_enabled ON workflows(name) WHERE enabled = true;

-- 执行历史工作流ID索引
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);

-- 执行历史用户ID索引
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);

-- 执行历史创建时间索引
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
```
