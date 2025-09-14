# 工作流执行API文档

## 执行工作流

### 接口信息
- **URL**: `/api/private/workflows/{workflow_id}/execute`
- **方法**: POST
- **认证**: 需要JWT Token

### 请求参数

#### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| workflow_id | string | 是 | 工作流ID |

#### 请求头
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |
| Content-Type | string | 是 | application/json |

#### 请求体
```json
{
  "inputs": {
    "key1": "value1",
    "key2": "value2",
    "resume_id": "optional_resume_id"
  }
}
```

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| inputs | object | 是 | 工作流输入参数，具体字段根据工作流配置而定 |

### 响应格式

#### 成功响应 (200)
```json
{
  "code": 0,
  "data": {
    "success": true,
    "data": {
      "workflow_run_id": "djflajgkldjgd",
      "task_id": "9da23599-e713-473b-982c-4328d4f5c78a",
      "outputs": {
        "text": "Nice to meet you."
      },
      "elapsed_time": 0.875,
      "total_tokens": 3562,
      "total_steps": 8
    },
    "message": "工作流执行成功"
  },
  "msg": "查询成功"
}
```

#### 失败响应 (200 - 业务失败)
```json
{
  "code": 0,
  "data": {
    "success": false,
    "data": {
      "workflow_run_id": "djflajgkldjgd",
      "task_id": "9da23599-e713-473b-982c-4328d4f5c78a",
      "status": "failed"
    },
    "message": "工作流执行失败: 具体错误信息"
  },
  "msg": "查询成功"
}
```

#### 错误响应 (500)
```json
{
  "code": 500,
  "data": {},
  "msg": "工作流不存在"
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 执行是否成功 |
| data.workflow_run_id | string | 远程工作流运行ID |
| data.task_id | string | 远程任务ID |
| data.outputs | object | 工作流输出结果 |
| data.elapsed_time | number | 执行耗时（秒） |
| data.total_tokens | number | 使用的token总数 |
| data.total_steps | number | 执行步骤总数 |
| data.status | string | 执行状态（失败时） |
| message | string | 执行结果消息 |

### 使用示例

#### curl 示例
```bash
curl -X POST 'http://localhost:8888/api/private/workflows/workflow_123/execute' \
  --header 'Authorization: Bearer your_jwt_token' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "text": "Hello, world!",
      "resume_id": "resume_456"
    }
  }'
```

#### JavaScript 示例
```javascript
const response = await fetch('/api/private/workflows/workflow_123/execute', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: {
      text: "Hello, world!",
      resume_id: "resume_456"
    }
  })
});

const result = await response.json();
console.log(result);
```

### 注意事项

1. **认证要求**: 必须提供有效的JWT Token
2. **权限检查**: 只能执行自己创建的工作流或公开的工作流
3. **输入验证**: inputs字段必须是有效的JSON对象
4. **超时设置**: 远程API调用超时时间为60秒
5. **响应模式**: 目前只支持blocking模式，即同步等待执行完成
6. **错误处理**: 网络错误、远程API错误都会返回详细的错误信息

### 远程API调用

系统会将请求转发到工作流配置中的`api_url`，请求格式为：
```json
{
  "inputs": {...},
  "response_mode": "blocking",
  "user": "user_id_from_jwt"
}
```

远程API的认证使用工作流配置中的`api_key`。
