# 流式工作流执行 API 文档

## 概述

一个支持 SSE (Server-Sent Events) 的流式工作流执行 API，支持客户端断开时自动取消执行

## API 端点

```
POST /api/workflow/{id}/execute
```

### 请求头
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: text/event-stream
```

### 请求体
```json
{
  "inputs": {
    "key1": "value1",  // 具体变量由应用层决定
    "key2": "value2"
  },
  "response_mode": "streaming" // | "blocking"
}
```

### 响应格式

响应是标准的 SSE 格式：

```
data: {"event": "workflow_started", "data": {...}}

data: {"event": "node_started", "data": {...}}

data: {"event": "text_chunk", "workflow_run_id": "xxx", "task_id": "xxx", "data": {"text": "一小段文本","from_variable_selector": ["1758814311711","text"]}}

data: {"event": "workflow_finished", "data": {"id": "run_id", "workflow_id": "workflow_id", "outputs": {...}, "status": "succeeded", "elapsed_time": 0.324, "total_tokens": 63127864, "total_steps": "1", "created_at": 1679586595, "finished_at": 1679976595}}


data: [DONE]
```

## 使用示例

### JavaScript 客户端（使用封装的 API）
```javascript
import { workflowAPI } from '@/api/workflow';

// 执行流式工作流
await workflowAPI.executeWorkflowStream(
  'workflow_id',
  { input1: 'value1', input2: 'value2' },
  // 消息回调
  (data) => {
    console.log('Event:', data.event, 'Data:', data.data);
    
    switch (data.event) {
      case 'workflow_started':
        console.log('工作流已启动');
        break;
      case 'workflow_finished':
        console.log('工作流完成，输出:', data.data.outputs);
        break;
      case 'error':
        console.error('执行错误:', data.data.message);
        break;
    }
  },
  // 错误回调
  (error) => {
    console.error('Stream error:', error);
  }
);
```

### React 组件使用
```jsx
import { StreamWorkflowExecutor } from '@/components/workflow/StreamWorkflowExecutor';

function MyComponent() {
  return (
    <StreamWorkflowExecutor
      workflowId="your_workflow_id"
      inputs={{ query: "优化这份简历", content: "..." }}
      onComplete={(outputs) => {
        console.log('工作流完成:', outputs);
      }}
      onProgress={(event) => {
        console.log('进度更新:', event);
      }}
    />
  );
}
```

### 原生 JavaScript 客户端
```javascript
const response = await fetch('/api/workflow/workflow_id/execute/stream', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({ inputs: { key: 'value' } })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.substring(6).trim();
      if (data === '[DONE]') return;
      
      try {
        const event = JSON.parse(data);
        console.log('Event:', event.event, 'Data:', event.data);
      } catch (e) {
        console.warn('Failed to parse:', data);
      }
    }
  }
}
```

### cURL 测试
```bash
curl -X POST \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"inputs": {"query": "test"}}' \
  http://localhost:8080/api/workflow/your_workflow_id/execute/stream
```

## 数据库记录

执行完成后，系统会自动在 `workflow_executions` 表中记录：

- 执行 ID、工作流 ID、用户 ID
- 输入参数和输出结果
- 执行状态（success/failed）
- 错误信息（如有）
- 执行时间（毫秒）

## 技术实现细节

### 关键组件

1. **StreamContext**：管理单次执行的上下文
2. **processSSEStreamDirect**：处理 SSE 流并转发
3. **parseWorkflowFinishedEvent**：解析完成事件
4. **streamContexts**：全局并发管理

### 并发安全
- 使用 `sync.RWMutex` 保护并发访问
- Context 取消机制处理中断
- 自动清理过期连接

### 性能优化
- 直接流式转发，减少内存占用
- 异步日志记录，不阻塞响应
- 合理的超时设置（5分钟）

## 文件结构

### 后端文件
```
server/
├── service/app/
│   ├── types.go           # 流式执行相关类型定义
│   └── app_service.go     # 流式执行核心逻辑
├── api/app/
│   └── app.go            # API 端点处理
└── router/
    └── workflow.go       # 路由配置
```

### 前端文件
```
web/src/
├── api/
│   └── workflow.ts       # 工作流 API 封装
└── components/workflow/
    └── StreamWorkflowExecutor.tsx  # React 组件
```

## 注意事项

1. **网络稳定性**：长连接对网络稳定性要求较高
2. **超时设置**：根据实际工作流执行时间调整超时
3. **资源清理**：确保异常情况下正确清理资源
4. **日志监控**：关注执行日志，及时发现问题

## 后续扩展

- 添加执行进度百分比
- 支持执行暂停/恢复
- 增加执行队列管理
- 实现执行结果缓存
- 添加执行统计和监控
- 支持工作流执行优先级
