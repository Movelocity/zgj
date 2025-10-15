# ChatFlow API 支持说明

## 概述

系统现在支持两种类型的工作流 API：

1. **标准工作流 API** - 返回 `WorkflowAPIResponse` 格式
2. **ChatFlow API (chat-messages)** - 返回 `ChatFlowAPIResponse` 格式

两种 API 都会被统一处理并存储到 `workflow_executions` 表中。

## API 类型识别

系统通过 API URL 自动识别 API 类型：

- 如果 URL 以 `chat-messages` 结尾，则识别为 **ChatFlow API**
- 否则识别为**标准工作流 API**

## 响应结构

### 标准工作流 API 响应

```json
{
  "workflow_run_id": "run_xxx",
  "task_id": "task_xxx",
  "data": {
    "id": "xxx",
    "workflow_id": "wf_xxx",
    "status": "succeeded",
    "outputs": {
      "result": "...",
      "other_field": "..."
    },
    "elapsed_time": 1.23,
    "total_tokens": 1000,
    "total_steps": 5
  }
}
```

### ChatFlow API 响应

```json
{
  "message_id": "msg_xxx",
  "conversation_id": "conv_xxx",
  "task_id": "task_xxx",
  "answer": "这是回答内容..."
}
```

## 数据转换和存储

ChatFlow API 的响应会被自动转换为标准工作流响应格式：

| ChatFlow 字段 | 映射到 WorkflowAPIResponse |
|--------------|---------------------------|
| `message_id` | `workflow_run_id` 和 `data.id` |
| `conversation_id` | `data.workflow_id` |
| `task_id` | `task_id` |
| `answer` | `data.outputs.answer` |

转换后的响应示例：

```json
{
  "workflow_run_id": "msg_xxx",
  "task_id": "task_xxx",
  "data": {
    "id": "msg_xxx",
    "workflow_id": "conv_xxx",
    "status": "succeeded",
    "outputs": {
      "answer": "这是回答内容...",
      "message_id": "msg_xxx",
      "conversation_id": "conv_xxx"
    },
    "elapsed_time": 0,
    "total_tokens": 0,
    "total_steps": 0
  }
}
```

## 工作流配置示例

### 创建 ChatFlow 工作流

```bash
POST /api/app/workflows
```

```json
{
  "api_url": "https://api.dify.ai/v1/chat-messages",
  "api_key": "app-xxx",
  "name": "智能问答助手",
  "description": "基于ChatFlow的智能问答",
  "inputs": [
    {
      "field_name": "__query",
      "field_type": "string",
      "required": true
    }
  ],
  "outputs": [
    {
      "field_name": "answer",
      "field_type": "string",
      "required": true
    }
  ],
  "is_public": true
}
```

### 执行 ChatFlow 工作流

```bash
POST /api/app/workflows/{workflow_id}/execute
```

```json
{
  "inputs": {
    "__query": "请帮我分析这份简历"
  }
}
```

## 执行记录存储

无论是标准工作流 API 还是 ChatFlow API，所有执行记录都会统一存储在 `workflow_executions` 表中，包含以下字段：

- `id`: 执行记录ID
- `workflow_id`: 工作流ID
- `user_id`: 用户ID
- `inputs`: 输入参数（JSON）
- `outputs`: 输出结果（JSON）
- `status`: 执行状态（success/failed）
- `error_message`: 错误信息（如果失败）
- `execution_time`: 执行时间（毫秒）
- `created_at`: 创建时间

## 特殊变量说明

- `__query`: ChatFlow API 的查询参数，会被自动提取并放入请求体的 `query` 字段
- `__conversation_id`: ChatFlow API 的会话ID，用于保持上下文连续性，只在 chat-messages API 中生效
- 所有以 `__` 开头的变量都被视为特殊变量，会被单独处理

## ChatFlow 会话上下文管理

### 首次对话（创建新会话）

第一次调用 ChatFlow 工作流时，不需要传递 `conversation_id`：

```json
{
  "inputs": {
    "__query": "你好，请介绍一下你自己"
  }
}
```

响应会包含新创建的 `conversation_id`：

```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_xxx",
    "outputs": {
      "answer": "你好！我是...",
      "message_id": "msg_xxx",
      "conversation_id": "conv_xxx"
    },
    ...
  }
}
```

### 继续对话（使用已有会话）

后续对话中传递 `conversation_id` 以保持上下文：

```json
{
  "inputs": {
    "__query": "那你能做什么？",
    "__conversation_id": "conv_xxx"
  }
}
```

系统会自动识别这是 chat-messages API，并将 `conversation_id` 添加到请求体中发送给服务商。

### 会话ID的处理流程

1. **前端调用**: 传递 `__conversation_id` 参数（仅对 ChatFlow 有效）
2. **后端识别**: 根据 API URL 是否以 `chat-messages` 结尾判断是否为 ChatFlow
3. **请求发送**: 如果是 ChatFlow，将 `__conversation_id` 提取并放入请求体的 `conversation_id` 字段
4. **响应返回**: 将服务商返回的 `conversation_id` 包含在响应数据中

## 发送给服务商的请求格式

### 标准工作流 API 请求

```json
{
  "inputs": {
    "field1": "value1",
    "field2": "value2"
  },
  "response_mode": "blocking",
  "user": "user_xxx"
}
```

### ChatFlow API 请求（无会话ID）

```json
{
  "inputs": {
    "field1": "value1"
  },
  "response_mode": "blocking",
  "user": "user_xxx",
  "query": "用户的问题"
}
```

### ChatFlow API 请求（带会话ID）

```json
{
  "inputs": {
    "field1": "value1"
  },
  "response_mode": "blocking",
  "user": "user_xxx",
  "query": "用户的问题",
  "conversation_id": "conv_xxx"
}
```

## 注意事项

1. **响应模式**: 支持 `blocking` 和 `streaming` 两种模式，ChatFlow API 在两种模式下都能正常工作
2. **状态判断**: ChatFlow API 成功返回即视为 `succeeded` 状态
3. **缺失字段**: ChatFlow API 不返回 `elapsed_time`、`total_tokens`、`total_steps` 等字段，这些字段会被设置为默认值 0
4. **URL 匹配**: URL 匹配会去除尾部斜杠后再判断是否以 `chat-messages` 结尾
5. **会话ID**: `conversation_id` 只在 ChatFlow API（chat-messages 端点）中生效，标准工作流 API 会忽略此参数
6. **流式执行**: 流式执行同样支持 `conversation_id`，处理方式与阻塞模式一致

## 代码实现

核心实现在 `server/service/app/app_service.go` 中：

- `callWorkflowAPI()`: 根据 URL 自动识别并调用对应的 API
- `convertChatFlowToWorkflowResponse()`: 将 ChatFlow 响应转换为标准格式
- `callWorkflowStreamAPIDirect()`: 流式执行时同样支持 ChatFlow 和 conversation_id

相关类型定义在 `server/service/app/types.go` 中：

- `WorkflowAPIRequest`: 工作流请求结构（包含 conversation_id 字段）
- `WorkflowAPIResponse`: 标准工作流响应
- `ChatFlowAPIResponse`: ChatFlow 响应
- `WorkflowAPIData`: 工作流响应数据部分

## 完整使用示例

### 场景：创建一个智能简历分析助手

#### 1. 创建 ChatFlow 工作流

```bash
POST /api/app/workflows
Authorization: Bearer <user_token>
```

```json
{
  "api_url": "https://api.dify.ai/v1/chat-messages",
  "api_key": "app-your-chatflow-key",
  "name": "智能简历分析助手",
  "description": "基于ChatFlow的智能简历分析，支持多轮对话",
  "inputs": [
    {
      "field_name": "__query",
      "field_type": "string",
      "required": true
    },
    {
      "field_name": "__conversation_id",
      "field_type": "string",
      "required": false
    }
  ],
  "outputs": [
    {
      "field_name": "answer",
      "field_type": "string",
      "required": true
    }
  ],
  "is_public": true
}
```

#### 2. 首次对话（创建会话）

```bash
POST /api/app/workflows/{workflow_id}/execute
Authorization: Bearer <user_token>
```

```json
{
  "inputs": {
    "__query": "请帮我分析这份简历的优点和缺点"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "workflow_run_id": "msg_abc123",
    "task_id": "task_xyz789",
    "conversation_id": "conv_def456",
    "outputs": {
      "answer": "根据您的简历，我发现以下优点：...",
      "message_id": "msg_abc123",
      "conversation_id": "conv_def456"
    },
    "elapsed_time": 0,
    "total_tokens": 0,
    "total_steps": 0
  },
  "message": "工作流执行成功"
}
```

#### 3. 继续对话（使用会话上下文）

从上一步响应中提取 `conversation_id`，用于后续对话：

```bash
POST /api/app/workflows/{workflow_id}/execute
Authorization: Bearer <user_token>
```

```json
{
  "inputs": {
    "__query": "那我应该如何改进这些缺点？",
    "__conversation_id": "conv_def456"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "workflow_run_id": "msg_ghi789",
    "task_id": "task_jkl012",
    "conversation_id": "conv_def456",
    "outputs": {
      "answer": "基于您刚才提到的简历，我建议：...",
      "message_id": "msg_ghi789",
      "conversation_id": "conv_def456"
    },
    "elapsed_time": 0,
    "total_tokens": 0,
    "total_steps": 0
  },
  "message": "工作流执行成功"
}
```

### 前端集成示例

```typescript
// 前端状态管理
let conversationId: string | null = null;

// 首次对话
async function startConversation(query: string) {
  const response = await fetch('/api/app/workflows/{workflow_id}/execute', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: {
        __query: query
      }
    })
  });
  
  const result = await response.json();
  
  // 保存 conversation_id 用于后续对话
  if (result.success) {
    conversationId = result.data.conversation_id;
    return result.data.outputs.answer;
  }
}

// 继续对话
async function continueConversation(query: string) {
  if (!conversationId) {
    throw new Error('No active conversation');
  }
  
  const response = await fetch('/api/app/workflows/{workflow_id}/execute', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: {
        __query: query,
        __conversation_id: conversationId
      }
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    return result.data.outputs.answer;
  }
}

// 使用示例
const answer1 = await startConversation('请帮我分析这份简历');
console.log('AI:', answer1);

const answer2 = await continueConversation('那我应该如何改进？');
console.log('AI:', answer2);
```

