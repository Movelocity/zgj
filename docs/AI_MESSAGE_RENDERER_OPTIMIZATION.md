# AI Message Renderer 流程优化

## 优化目标

简化 `AiMessageRenderer` 组件中的状态管理逻辑，解决消息流刷新时状态被覆盖的问题，同时保持格式化过程中的加载状态显示。

## 原有问题

1. **流程复杂**：`postProcess` 函数异步调用，状态管理分散在多个 ref 中（`isFormattingRef`、`updateBlocksRef`、`processedBlocksRef`）
2. **状态冲突**：消息流继续刷新时，`useEffect` 重新执行可能覆盖正在进行的格式化状态
3. **多重状态管理**：使用了多个 ref 来追踪不同的状态，增加了维护难度

## 优化方案

### 1. 简化状态定义

```typescript
interface ResumeUpdateBlock {
  id: string;
  content: string;
  status: 'parsing' | 'formatting' | 'completed';
}
```

- 移除 `'updating'` 状态，改用 `'parsing'` 更准确地表示正在流式接收
- 状态流转更清晰：`parsing` → `formatting`（如需要）→ `completed`

### 2. 统一状态管理

```typescript
// 使用单一 Map 作为状态源
const blockStatesRef = useRef<Map<string, ResumeUpdateBlock>>(new Map());
```

- 移除多余的 ref（`isFormattingRef`、`processedBlocksRef`、`updateBlocksRef`）
- 使用 `Map` 集中管理所有块的状态
- 通过 `blockId` 作为 key 快速查找和更新

### 3. 优化格式化逻辑

将 `postProcess` 重命名为 `formatBlock`，简化流程：

```typescript
const formatBlock = async (blockId: string, content: string): Promise<void> => {
  try {
    // 调用格式化 API
    const structuredResumeResult = await workflowAPI.executeWorkflow(...);
    
    // 直接更新 Map 中的状态
    const blockState = blockStatesRef.current.get(blockId);
    if (blockState) {
      blockState.status = 'completed';
      blockStatesRef.current.set(blockId, blockState);
      
      // 触发 React 重新渲染
      setUpdateBlocks(prev => 
        prev.map(block => 
          block.id === blockId 
            ? { ...block, status: 'completed' }
            : block
        )
      );
    }
    
    // 触发事件
    window.dispatchEvent(new CustomEvent('resume-update-formatted', {...}));
  } catch (error) {
    // 错误处理：标记为 completed 避免卡住
  }
};
```

**关键改进**：
- 移除 `isFormattingRef` 标志，通过 Map 中的状态判断
- 格式化失败时也标记为 `completed`，避免 UI 卡住
- 直接操作 Map 对象，减少不必要的状态克隆

### 4. 重构 useEffect 逻辑

```typescript
useEffect(() => {
  // ... 解析逻辑 ...
  
  // 当遇到块结束标记 ``` 时
  const existingBlock = blockStatesRef.current.get(blockId);
  
  // 如果块已存在且状态不是 parsing，说明已经处理过（正在格式化或已完成）
  // 这种情况下保持其当前状态，避免覆盖正在进行的格式化
  if (existingBlock && existingBlock.status !== 'parsing') {
    newUpdateBlocks.push(existingBlock);
  } else {
    // 块不存在，或者存在但还在 parsing 状态（流式传输刚结束，需要处理）
    // 尝试解析并设置状态
    const newBlock: ResumeUpdateBlock = {
      id: blockId,
      content: currentBlockContent,
      status: blockStatus
    };
    
    blockStatesRef.current.set(blockId, newBlock);
    newUpdateBlocks.push(newBlock);
    
    // 如果需要格式化，立即触发（非阻塞）
    if (needsFormatting) {
      formatBlock(blockId, currentBlockContent);
    }
  }
}, [content, messageId]);
```

**关键改进**：
- **智能状态判断**：通过 `existingBlock.status !== 'parsing'` 区分是否已处理
  - `parsing` 状态的块：流式传输刚结束，需要进行解析和格式化判断
  - `formatting/completed` 状态的块：已经处理过，保持当前状态
- **避免重复处理**：正在格式化或已完成的块不会被重新处理
- **确保处理**：流式传输结束时（从 `parsing` 状态），一定会进行解析和格式化判断

## 状态流转

```
┌─────────┐
│ parsing │ (流式接收中)
└────┬────┘
     │
     ├─── 解析成功 ──→ completed
     │
     ├─── 解析失败 ──→ formatting ──→ completed
     │                    ↓
     └────────────────── (API 调用)
```

## 优势

1. **简化代码**：从 4 个 ref 减少到 1 个 `Map`
2. **状态一致性**：单一状态源，避免多个 ref 之间的同步问题
3. **防止覆盖**：消息流刷新时，正在格式化的块不会被重置
4. **清晰的流程**：状态流转更直观，易于理解和维护
5. **错误处理**：格式化失败时不会导致 UI 永久卡在加载状态

## UI 变化

- **parsing**：显示"解析中"，带动画和内容预览
- **formatting**：显示"正在格式化..."，带动画和内容预览
- **completed**：显示"已应用到编辑区"，不显示内容预览

## 测试要点

1. 正常 JSON 解析成功的场景
2. JSON 解析失败需要格式化的场景
3. 格式化过程中消息流继续刷新的场景
4. 格式化失败的错误处理
5. 流式传输中的状态显示

## 相关文件

- `web/src/pages/editor/components/AiMessageRenderer.tsx` - 主要优化文件
- `web/src/pages/editor/components/ChatPanel.tsx` - 事件监听和处理
- `docs/AI_MESSAGE_RENDERER.md` - 原有文档

## 修复记录

### 2025-10-20 - 修复 parsing 状态块不会调用 API 的问题

**问题**：流式传输结束后，块状态停留在 `parsing`，不会进行解析和格式化。

**原因**：原逻辑中，如果块已存在就直接保持状态，导致流式传输中创建的 `parsing` 状态块在流结束时不会被处理。

**修复**：改进状态判断逻辑
```typescript
// 修复前
if (existingBlock) {
  newUpdateBlocks.push(existingBlock);  // 直接保持，parsing 状态不会被处理
}

// 修复后
if (existingBlock && existingBlock.status !== 'parsing') {
  newUpdateBlocks.push(existingBlock);  // 只有非 parsing 状态才保持
} else {
  // parsing 状态的块会重新进行解析和格式化判断
}
```

这样确保：
1. 流式传输结束时，`parsing` 状态的块会进行解析
2. 正在格式化的块（`formatting`）不会被打断
3. 已完成的块（`completed`）不会被重复处理

## 更新日期

初始版本：2025-10-20  
修复版本：2025-10-20

