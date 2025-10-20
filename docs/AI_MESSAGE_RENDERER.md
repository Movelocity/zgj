# AI Message Renderer - 特殊简历更新块处理

## 概述

`AiMessageRenderer` 是一个用于渲染 AI 消息的组件，它能够识别并特殊处理 `resume-update` 代码块，提供更好的用户体验和自动化的简历更新功能。

## 功能特性

### 1. 特殊代码块识别

当 AI 返回的消息中包含以下格式的代码块时：

```
```resume-update
{
  "name": "张三",
  "education": [...]
}
```
```

组件会自动识别并进行特殊渲染。

### 2. 渲染状态

- **更新中状态 (Updating)**: 当检测到 `\`\`\`resume-update` 开始标记但尚未遇到结束标记时，显示 "Resume Updating..." 和动画进度条
- **完成状态 (Completed)**: 当检测到结束标记 `\`\`\`` 时，显示 "Resume Updated" 并触发更新事件

### 3. 自动更新简历

当 resume-update 块完成时，组件会：
1. 生成唯一的 `blockId`（基于消息ID、位置和内容的哈希）
2. 触发 `resume-update-detected` 自定义事件
3. `ChatPanel` 接收事件并自动更新简历数据

### 4. 防重复处理

使用哈希表（Set）来跟踪已处理的 `blockId`，确保同一个更新块不会被重复处理。

## 技术实现

### AiMessageRenderer 组件

```typescript
interface AiMessageRendererProps {
  content: string;      // AI 消息内容
  messageId: string;    // 消息唯一ID
  className?: string;   // 自定义样式类
}
```

**核心逻辑：**
1. 按行分割内容
2. 识别 `\`\`\`resume-update` 和 `\`\`\`` 标记
3. 提取中间的简历数据
4. 生成唯一 blockId 并触发事件
5. 将占位符替换为 UI 组件

### ChatPanel 集成

**事件监听：**
```typescript
window.addEventListener('resume-update-detected', handleResumeUpdate);
```

**去重机制：**
```typescript
const processedBlocksRef = useRef<Set<string>>(new Set());

// 检查是否已处理
if (processedBlocksRef.current.has(blockId)) {
  return;
}
// 标记为已处理
processedBlocksRef.current.add(blockId);
```

**数据更新：**
```typescript
const resumeUpdateData = parseAndFixResumeJson(content);
onResumeDataChange(resumeUpdateData, true);
```

## 使用示例

### AI 返回格式

AI 应该返回如下格式的消息：

```markdown
根据您的要求，我已经优化了工作经历部分：

\`\`\`resume-update
{
  "name": "张三",
  "work_experience": [
    {
      "company": "科技公司",
      "position": "高级工程师",
      "description": "优化后的描述..."
    }
  ]
}
\`\`\`

以上是更新后的内容。
```

### 渲染效果

**更新中状态：**
```
┌─────────────────────────────────────┐
│ 📄 Resume Updating...          AI   │
│ [=========>          ] 进度条       │
└─────────────────────────────────────┘
```

**完成状态：**
```
┌─────────────────────────────────────┐
│ 📄 Resume Updated              AI   │
│ Resume content has been updated     │
└─────────────────────────────────────┘
```

## 工作流程

```
AI 输出流式响应
    ↓
检测到 ```resume-update
    ↓
显示 "Resume Updating..."
    ↓
继续接收内容
    ↓
检测到结束标记 ```
    ↓
生成 blockId (哈希)
    ↓
触发 resume-update-detected 事件
    ↓
ChatPanel 接收事件
    ↓
检查 blockId 是否已处理
    ↓ (未处理)
解析 JSON 内容
    ↓
调用 onResumeDataChange
    ↓
简历数据更新完成
```

## 文件结构

```
web/src/
├── pages/editor/components/
│   ├── AiMessageRenderer.tsx    # AI 消息渲染器
│   ├── ChatPanel.tsx             # 聊天面板（集成事件监听）
│   └── ...
└── utils/
    └── hash.ts                   # 哈希工具函数
```

## API 参考

### CustomEvent: resume-update-detected

**事件详情：**
```typescript
interface ResumeUpdateEventDetail {
  blockId: string;      // 更新块的唯一ID
  content: string;      // 简历更新的 JSON 内容
  messageId: string;    // 关联的消息ID
}
```

**触发时机：**
- 当检测到完整的 resume-update 代码块结束时

**处理方式：**
```typescript
window.addEventListener('resume-update-detected', (event: CustomEvent) => {
  const { blockId, content, messageId } = event.detail;
  // 处理更新...
});
```

## 注意事项

1. **JSON 格式要求**：resume-update 块中的内容必须是有效的 JSON 格式
2. **去重机制**：基于内容哈希的去重，相同内容只会处理一次
3. **错误处理**：JSON 解析失败时会在控制台输出错误，但不会中断页面
4. **流式渲染**：支持流式响应，边接收边渲染
5. **向后兼容**：不包含 resume-update 块的普通消息仍然正常渲染

## 调试

在浏览器控制台中可以看到以下日志：

```
[Resume Update] 处理更新块: abc123
[Resume Update] 简历数据已更新
```

或者如果重复：

```
[Resume Update] 跳过重复的更新块: abc123
```

## 未来改进

- [ ] 添加更新成功/失败的视觉反馈
- [ ] 支持部分更新（diff）而不是全量替换
- [ ] 添加撤销功能
- [ ] 显示更新的具体字段
- [ ] 支持更新预览

