# Resume Update 自动格式化功能

## 功能概述

`AiMessageRenderer` 组件现在具备智能处理 `resume-update` 代码块的能力。当检测到 resume-update 块时，组件会：

1. **直接解析**：首先尝试直接解析 JSON 内容
2. **自动格式化**：如果解析失败，自动调用格式化 API 进行二次处理
3. **状态可视化**：在 UI 上显示不同的处理状态

## 工作流程

### 1. Resume Update 块检测

当 AI 返回包含 `resume-update` 代码块的内容时：

```markdown
这是一些普通文本...

```resume-update
{
  "blocks": [...]
}
```

更多文本...
```

### 2. 处理流程

```
检测到 resume-update 块
    ↓
尝试 JSON 解析
    ↓
   成功? ──→ 触发 resume-update-detected 事件
    ↓ 失败
调用格式化 API (smart-format-2)
    ↓
更新块状态为 "formatting"
    ↓
API 返回结果
    ↓
更新块状态为 "completed"
    ↓
触发 resume-update-formatted 事件
```

### 3. 状态说明

- **updating**: 块正在接收内容（流式输出未完成）
- **formatting**: JSON 解析失败，正在调用格式化 API
- **completed**: 处理完成，数据已应用到编辑区

## 事件系统

### resume-update-detected

当 JSON 直接解析成功时触发：

```typescript
interface ResumeUpdateDetectedEvent {
  blockId: string;        // 块的唯一标识符
  content: string;        // 原始内容
  data: ResumeV2Data;     // 解析后的简历数据
  messageId: string;      // 消息 ID
}
```

### resume-update-formatted

当通过格式化 API 处理完成时触发：

```typescript
interface ResumeUpdateFormattedEvent {
  blockId: string;        // 块的唯一标识符
  data: ResumeV2Data;     // 格式化后的简历数据
  messageId: string;      // 消息 ID
}
```

## 组件接口

### AiMessageRenderer Props

```typescript
interface AiMessageRendererProps {
  content: string;        // AI 返回的完整内容
  messageId: string;      // 消息的唯一标识符
  className?: string;     // 自定义样式类
  resumeData: ResumeV2Data;  // 当前的简历数据（用于格式化 API）
}
```

## 使用示例

### 在 ChatPanel 中使用

```tsx
<AiMessageRenderer 
  content={message.content} 
  messageId={message.id}
  className="text-sm leading-relaxed text-gray-800"
  resumeData={resumeData}
/>
```

### 监听事件

```tsx
// 监听直接解析成功的事件
useEffect(() => {
  const handleResumeUpdate = (event: CustomEvent) => {
    const { blockId, data } = event.detail;
    onResumeDataChange(data, true);
  };

  window.addEventListener('resume-update-detected', handleResumeUpdate);
  return () => {
    window.removeEventListener('resume-update-detected', handleResumeUpdate);
  };
}, []);

// 监听格式化完成的事件
useEffect(() => {
  const handleResumeFormatted = (event: CustomEvent) => {
    const { blockId, data } = event.detail;
    onResumeDataChange(data, true);
  };

  window.addEventListener('resume-update-formatted', handleResumeFormatted);
  return () => {
    window.removeEventListener('resume-update-formatted', handleResumeFormatted);
  };
}, []);
```

## 去重机制

组件内部使用 `processedBlocksRef` 来追踪已处理的块，防止重复处理：

- 使用 `blockId` 作为唯一标识符
- `blockId` 基于 `messageId` 和块在消息中的位置生成
- 即使内容更新，同一位置的块也会保持相同的 ID

## 错误处理

- JSON 解析失败会自动降级到格式化 API
- 格式化 API 失败会在控制台输出错误日志
- 处理过程中的任何错误都不会影响其他块的处理

## UI 反馈

```tsx
// completed 状态
✓ 已应用到编辑区

// formatting 状态
⚡ 正在格式化...  [动画中]
[显示内容预览...]

// updating 状态
⚡ 解析中  [动画中]
[显示内容预览...]
```

## 性能优化

1. **去重处理**：防止重复处理同一个块
2. **状态管理**：使用 ref 而非 state 存储处理状态，避免不必要的重渲染
3. **异步处理**：格式化 API 调用不阻塞 UI 渲染
4. **条件检查**：只在必要时调用格式化 API

## 注意事项

1. **API 依赖**：需要确保 `smart-format-2` workflow 已正确配置
2. **数据格式**：格式化 API 的输入需要包含 `current_resume` 和 `resume_edit`
3. **事件去重**：ChatPanel 中需要实现事件去重逻辑，防止重复更新简历数据
4. **并发控制**：使用 `isFormattingRef` 防止同时发起多个格式化请求

## 调试技巧

查看控制台日志，关键标识：

```
[Resume Update] 块 <blockId> 解析成功，已触发标准事件
[Resume Update] 块 <blockId> 解析失败，开始调用格式化 API
[Resume Update] 开始格式化块 <blockId>...
[Resume Update] 格式化成功: <data>
[Resume Update] 格式化块 <blockId> 完成，已触发事件
[ChatPanel] 处理更新块: <blockId>
[ChatPanel] 处理格式化块: <blockId>
```

