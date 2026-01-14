# 聊天消息 API 文档

## 概述

聊天消息功能用于管理简历内的对话消息。与旧的 `conversation` 表不同，新的 `chat_messages` 表将每条消息单独存储，支持分页加载和上滑加载历史消息，降低网络负载。

## 数据模型

### ChatMessage 结构

```typescript
interface ChatMessage {
  id: string;              // 消息ID
  resume_id: string;       // 简历ID
  user_id: string;         // 用户ID
  sender_name: string;     // 发送者名称
  message: MessageContent; // 消息内容
  created_at: string;      // 创建时间（ISO 8601格式）
}
```

### MessageContent 结构

```typescript
interface MessageContent {
  content: string;  // 文本消息内容
  // 未来可扩展：
  // file_id?: string;   // 文件消息ID
  // image_id?: string;  // 图片消息ID
}
```

## API 端点

### 1. 创建聊天消息

创建一条新的聊天消息。

**请求**

```http
POST /api/chat-messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "resume_id": "resume123",
  "sender_name": "用户名称",
  "message": {
    "content": "这是一条文本消息"
  }
}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resume_id | string | 是 | 简历ID |
| sender_name | string | 是 | 发送者名称 |
| message | object | 是 | 消息内容（普通消息为 {content: string}） |

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "msg123",
    "resume_id": "resume123",
    "user_id": "user123",
    "sender_name": "用户名称",
    "message": {
      "content": "这是一条文本消息"
    },
    "created_at": "2024-12-04T10:30:00Z"
  },
  "msg": "success"
}
```

---

### 2. 获取聊天消息列表

获取指定简历的聊天消息列表，支持分页和上滑加载历史消息。

**请求**

```http
GET /api/chat-messages?resume_id=resume123&page=1&page_size=20
Authorization: Bearer <token>
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| resume_id | string | 是 | - | 简历ID |
| page | number | 否 | 1 | 页码（从1开始） |
| page_size | number | 否 | 20 | 每页条数（1-100） |
| before_time | string | 否 | - | 获取此时间之前的消息（ISO 8601格式），用于上滑加载 |

**上滑加载示例**

首次加载：
```http
GET /api/chat-messages?resume_id=resume123&page=1&page_size=20
```

上滑加载更早的消息（使用最早消息的 `created_at`）：
```http
GET /api/chat-messages?resume_id=resume123&page=1&page_size=20&before_time=2024-12-04T10:00:00Z
```

**响应**

```json
{
  "code": 0,
  "data": {
    "messages": [
      {
        "id": "msg125",
        "resume_id": "resume123",
        "user_id": "user123",
        "sender_name": "AI助手",
        "message": {
          "content": "最新的消息"
        },
        "created_at": "2024-12-04T10:32:00Z"
      },
      {
        "id": "msg124",
        "resume_id": "resume123",
        "user_id": "user123",
        "sender_name": "用户名称",
        "message": {
          "content": "上一条消息"
        },
        "created_at": "2024-12-04T10:31:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20,
    "has_more": true
  },
  "msg": "success"
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| messages | array | 消息列表（按时间倒序，最新的在前） |
| total | number | 总消息数 |
| page | number | 当前页码 |
| page_size | number | 每页条数 |
| has_more | boolean | 是否还有更多消息 |

---

### 3. 删除单条聊天消息

删除指定的单条聊天消息。

**请求**

```http
DELETE /api/chat-messages/:id
Authorization: Bearer <token>
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 消息ID |

**响应**

```json
{
  "code": 0,
  "data": null,
  "msg": "删除成功"
}
```

---

### 4. 删除简历下的所有消息

删除指定简历下的所有聊天消息。

**请求**

```http
DELETE /api/chat-messages/resume/:resume_id
Authorization: Bearer <token>
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resume_id | string | 是 | 简历ID |

**响应**

```json
{
  "code": 0,
  "data": null,
  "msg": "删除成功"
}
```

---

## 错误响应

所有API在出错时返回统一的错误格式：

```json
{
  "code": 1,
  "data": null,
  "msg": "错误信息"
}
```

**常见错误**

| 错误信息 | 说明 |
|---------|------|
| 简历不存在 | 指定的简历ID不存在或不属于当前用户 |
| 消息格式错误 | 消息内容JSON格式不正确 |
| 消息不存在 | 指定的消息ID不存在或不属于当前用户 |
| 时间格式错误 | before_time参数格式不正确（应为ISO 8601格式） |

---

## 使用示例

### JavaScript/TypeScript

```typescript
// 1. 创建消息
async function createMessage(resumeId: string, senderName: string, content: string) {
  const response = await fetch('/api/chat-messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resume_id: resumeId,
      sender_name: senderName,
      message: { content }
    })
  });
  return await response.json();
}

// 2. 获取消息列表
async function getMessages(resumeId: string, page = 1, pageSize = 20) {
  const response = await fetch(
    `/api/chat-messages?resume_id=${resumeId}&page=${page}&page_size=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
}

// 3. 上滑加载更多消息
async function loadMoreMessages(resumeId: string, beforeTime: string) {
  const response = await fetch(
    `/api/chat-messages?resume_id=${resumeId}&page=1&page_size=20&before_time=${beforeTime}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
}

// 4. 删除消息
async function deleteMessage(messageId: string) {
  const response = await fetch(`/api/chat-messages/${messageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// 5. 删除简历下所有消息
async function deleteAllMessages(resumeId: string) {
  const response = await fetch(`/api/chat-messages/resume/${resumeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}
```

---

## 迁移说明

### 从旧的 Conversation 迁移到 ChatMessage

**旧的结构（Conversation）**
- 一个对话包含多条消息的数组
- 每次获取都需要加载所有消息
- 更新消息需要更新整个数组

**新的结构（ChatMessage）**
- 每条消息单独存储
- 支持分页和上滑加载
- 独立操作每条消息

**数据迁移考虑**
1. `Conversation` 表保留但不再使用（已弃用）
2. 新功能应使用 `ChatMessage` 表
3. 历史数据迁移脚本需要：
   - 遍历所有 conversations
   - 将每个 conversation 的 messages 数组拆分
   - 为每条消息创建独立的 ChatMessage 记录

---

## 性能优化建议

### 前端实现建议

1. **虚拟滚动**：使用虚拟滚动技术渲染长列表
2. **上滑加载**：检测滚动到顶部时，使用 `before_time` 参数加载更早的消息
3. **消息缓存**：在内存中缓存已加载的消息，避免重复请求
4. **乐观更新**：发送消息时立即显示，失败后再回滚

### 示例：无限滚动实现

```typescript
class ChatMessageList {
  private messages: ChatMessage[] = [];
  private hasMore = true;
  private loading = false;
  
  async loadInitial(resumeId: string) {
    const result = await getMessages(resumeId, 1, 20);
    this.messages = result.data.messages;
    this.hasMore = result.data.has_more;
  }
  
  async loadMore(resumeId: string) {
    if (!this.hasMore || this.loading) return;
    
    this.loading = true;
    const oldestMessage = this.messages[this.messages.length - 1];
    const result = await loadMoreMessages(resumeId, oldestMessage.created_at);
    
    this.messages.push(...result.data.messages);
    this.hasMore = result.data.has_more;
    this.loading = false;
  }
}
```

---

## 注意事项

1. **认证要求**：所有API都需要JWT认证
2. **权限验证**：用户只能操作自己的消息和简历
3. **消息排序**：默认按创建时间倒序（最新的在前）
4. **时间格式**：统一使用ISO 8601格式（如：2024-12-04T10:30:00Z）
5. **分页限制**：单页最多100条消息
6. **消息扩展**：message字段为JSON类型，未来可支持文件和图片消息
