# ChatFlow 会话上下文支持更新

## 更新时间
2025-10-15

## 更新概述

增强了 ChatFlow API 的支持，现在可以通过 `conversation_id` 保持多轮对话的上下文连续性。

## 主要变更

### 1. 后端改动

#### 1.1 类型定义更新 (`server/service/app/types.go`)

- **WorkflowAPIRequest** 新增字段：
  ```go
  ConversationID string `json:"conversation_id,omitempty"` // ChatFlow API 的会话ID
  ```

#### 1.2 核心逻辑更新 (`server/service/app/app_service.go`)

- **callWorkflowAPI()**: 
  - 自动识别 ChatFlow API（URL 以 `chat-messages` 结尾）
  - 提取 `__conversation_id` 参数并添加到请求体
  - 在响应中返回 `conversation_id`

- **callWorkflowStreamAPIDirect()**:
  - 流式执行同样支持 `conversation_id` 传递

- **ExecuteWorkflow() 和 ExecuteWorkflowAPI()**:
  - 响应数据中新增 `conversation_id` 字段（仅 ChatFlow）

### 2. API 变更

#### 2.1 请求参数

新增特殊变量：
- `__conversation_id`: ChatFlow API 的会话ID，用于保持上下文（可选）

#### 2.2 响应数据

ChatFlow API 的成功响应新增：
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_xxx",  // 新增字段
    "outputs": {
      "answer": "...",
      "conversation_id": "conv_xxx",
      "message_id": "msg_xxx"
    },
    ...
  }
}
```

## 使用方式

### 首次对话

```bash
POST /api/app/workflows/{workflow_id}/execute
```

```json
{
  "inputs": {
    "__query": "你好"
  }
}
```

### 继续对话

从首次对话的响应中获取 `conversation_id`，并在后续请求中传递：

```json
{
  "inputs": {
    "__query": "继续上面的话题",
    "__conversation_id": "conv_xxx"
  }
}
```

## 工作原理

1. **前端传递**: 在 inputs 中包含 `__conversation_id`
2. **后端识别**: 检查 API URL 是否以 `chat-messages` 结尾
3. **参数提取**: 提取 `__conversation_id` 并从 inputs 中删除
4. **请求发送**: 将 `conversation_id` 添加到请求体发送给服务商
5. **响应处理**: 将服务商返回的 `conversation_id` 包含在响应数据中

## 兼容性说明

- ✅ **向后兼容**: 不传递 `__conversation_id` 时行为不变
- ✅ **自动识别**: 根据 URL 自动判断是否需要处理 conversation_id
- ✅ **标准工作流**: 标准工作流 API 会忽略 `__conversation_id` 参数
- ✅ **流式支持**: blocking 和 streaming 模式都支持

## 数据存储

所有执行记录（包括 conversation_id）都会存储在 `workflow_executions` 表中：
- `inputs` 字段包含原始输入（包括 `__conversation_id`）
- `outputs` 字段包含完整输出（包括 `conversation_id`）

## 文档更新

- ✅ 更新了 `CHATFLOW_API_SUPPORT.md`，添加了会话上下文管理说明
- ✅ 添加了完整的使用示例和前端集成代码
- ✅ 更新了发送给服务商的请求格式说明

## 测试建议

1. **首次对话测试**: 验证返回的 `conversation_id`
2. **继续对话测试**: 验证传递 `conversation_id` 后的上下文连续性
3. **流式执行测试**: 验证流式模式下的 conversation_id 传递
4. **标准工作流测试**: 验证标准工作流不受影响

## 相关文件

- `server/service/app/types.go`
- `server/service/app/app_service.go`
- `docs/CHATFLOW_API_SUPPORT.md`
- `docs/CHATFLOW_CONVERSATION_UPDATE.md` (本文件)

