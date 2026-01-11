# Implementation Tasks

## 1. Remove Button Rendering

- [x] 1.1 从 `Markdown.tsx` 中移除 `processTextWithButtons` 函数
- [x] 1.2 从 `Markdown.tsx` 中移除 `processChildren` 函数
- [x] 1.3 移除 `Markdown.tsx` 中段落、列表项对 children 的按钮处理调用
- [x] 1.4 从 `ChatPanel.tsx` 中移除 `markdown-button-click` 事件监听器

## 2. Add Action Marker Parsing

- [x] 2.1 在 `AiMessageRenderer.tsx` 中创建 `ActionMarker` 类型定义
- [x] 2.2 实现 `parseActionMarkers` 函数，识别四种指令格式
- [x] 2.3 在 `useEffect` 中调用 `parseActionMarkers` 解析 AI 消息内容
- [x] 2.4 将解析后的指令存储到 `actionMarkers` state 中

## 3. Create Action Marker Visual Components

- [x] 3.1 创建 `ActionMarkerDisplay` 组件，用于渲染单个指令
- [x] 3.2 为 ADD_PART、NEW_SECTION、EDIT 指令设计全宽圆角灰色框样式
- [x] 3.3 为 DISPLAY 指令设计非全宽蓝色框、浅蓝底、蓝色字样式
- [x] 3.4 实现展开/折叠功能，支持切换显示完整参数或折叠预览
- [x] 3.5 实现折叠状态下的字符数计算和显示
- [x] 3.6 为接受/拒绝按钮添加交互效果（hover、disabled状态）
- [x] 3.7 为历史消息指令添加重新触发按钮（仅在展开时显示）

## 4. Implement Event System

- [x] 4.1 定义 `action-marker-accepted` 自定义事件类型和数据结构
- [x] 4.2 定义 `action-marker-rejected` 自定义事件类型和数据结构
- [x] 4.3 在 ActionMarkerDisplay 的接受按钮中触发 `action-marker-accepted` 事件
- [x] 4.4 在 ActionMarkerDisplay 的拒绝按钮中触发 `action-marker-rejected` 事件
- [x] 4.5 在事件 detail 中包含完整的指令参数（type, section, title, content/regex/replacement）

## 5. Integrate with ChatPanel

- [x] 5.1 在 `ChatPanel.tsx` 中添加 `action-marker-accepted` 事件监听器
- [x] 5.2 在 `ChatPanel.tsx` 中添加 `action-marker-rejected` 事件监听器
- [x] 5.3 实现 ADD_PART 指令的处理逻辑（调用简历数据更新方法）
- [x] 5.4 实现 NEW_SECTION 指令的处理逻辑
- [x] 5.5 实现 EDIT 指令的处理逻辑（支持正则表达式匹配）
- [x] 5.6 实现 DISPLAY 指令的处理逻辑（仅显示消息，无需操作）
- [x] 5.7 处理拒绝事件，添加用户反馈提示

## 6. Update Rendering Logic

- [x] 6.1 在 `AiMessageRenderer` 的 `renderContent` 中替换指令占位符为 `ActionMarkerDisplay` 组件
- [x] 6.2 确保指令与普通 Markdown 内容混排正确显示
- [x] 6.3 为历史消息中的指令添加默认折叠模式，展开时显示重新触发按钮
- [x] 6.4 实现新消息指令默认折叠，显示字符数和操作按钮
- [x] 6.5 添加指令状态管理（pending, accepted, rejected）

## 7. Action Queue and State Management

- [x] 7.1 实现指令队列管理，支持多个指令依次接受
- [x] 7.2 添加指令状态持久化（与消息关联）
- [x] 7.3 实现历史消息指令的重新触发功能
- [x] 7.4 添加指令状态的视觉反馈（已应用、已忽略）

## 8. Testing and Polish

- [x] 8.1 测试单个指令的展开/折叠交互
- [x] 8.2 测试多个指令依次接受的排队效果
- [x] 8.3 测试指令与 Markdown 内容混排
- [x] 8.4 测试历史消息中的指令显示和重新触发
- [x] 8.5 测试正则表达式匹配的准确性（EDIT 指令）
- [x] 8.6 测试字符数计算的准确性
- [x] 8.7 优化视觉样式，确保简洁的灰色和蓝色配色
- [x] 8.8 添加必要的错误处理和边界情况处理
- [x] 8.9 测试移动端响应式布局
