# Implementation Tasks

## 1. Remove Button Rendering

- [ ] 1.1 从 `Markdown.tsx` 中移除 `processTextWithButtons` 函数
- [ ] 1.2 从 `Markdown.tsx` 中移除 `processChildren` 函数
- [ ] 1.3 移除 `Markdown.tsx` 中段落、列表项对 children 的按钮处理调用
- [ ] 1.4 从 `ChatPanel.tsx` 中移除 `markdown-button-click` 事件监听器

## 2. Add Action Marker Parsing

- [ ] 2.1 在 `AiMessageRenderer.tsx` 中创建 `ActionMarker` 类型定义
- [ ] 2.2 实现 `parseActionMarkers` 函数，识别四种指令格式
- [ ] 2.3 在 `useEffect` 中调用 `parseActionMarkers` 解析 AI 消息内容
- [ ] 2.4 将解析后的指令存储到 `actionMarkers` state 中

## 3. Create Action Marker Visual Components

- [ ] 3.1 创建 `ActionMarkerDisplay` 组件，用于渲染单个指令
- [ ] 3.2 为 ADD_PART 指令设计绿色边框、+号图标的视觉样式
- [ ] 3.3 为 NEW_SECTION 指令设计蓝色边框、*号图标的视觉样式
- [ ] 3.4 为 EDIT 指令设计黄色边框、~号图标的视觉样式
- [ ] 3.5 为 DISPLAY 指令设计灰色边框、i号图标的视觉样式
- [ ] 3.6 为接受/拒绝按钮添加交互效果（hover、disabled状态）

## 4. Implement Event System

- [ ] 4.1 定义 `action-marker-accepted` 自定义事件类型和数据结构
- [ ] 4.2 定义 `action-marker-rejected` 自定义事件类型和数据结构
- [ ] 4.3 在 ActionMarkerDisplay 的接受按钮中触发 `action-marker-accepted` 事件
- [ ] 4.4 在 ActionMarkerDisplay 的拒绝按钮中触发 `action-marker-rejected` 事件
- [ ] 4.5 在事件 detail 中包含完整的指令参数（type, section, title, content/regex/replacement）

## 5. Integrate with ChatPanel

- [ ] 5.1 在 `ChatPanel.tsx` 中添加 `action-marker-accepted` 事件监听器
- [ ] 5.2 在 `ChatPanel.tsx` 中添加 `action-marker-rejected` 事件监听器
- [ ] 5.3 实现 ADD_PART 指令的处理逻辑（调用简历数据更新方法）
- [ ] 5.4 实现 NEW_SECTION 指令的处理逻辑
- [ ] 5.5 实现 EDIT 指令的处理逻辑（支持正则表达式匹配）
- [ ] 5.6 实现 DISPLAY 指令的处理逻辑（仅显示消息，无需操作）
- [ ] 5.7 处理拒绝事件，添加用户反馈提示

## 6. Update Rendering Logic

- [ ] 6.1 在 `AiMessageRenderer` 的 `renderContent` 中替换指令占位符为 `ActionMarkerDisplay` 组件
- [ ] 6.2 确保指令与普通 Markdown 内容混排正确显示
- [ ] 6.3 为历史消息中的指令添加只读模式（不显示接受/拒绝按钮）

## 7. Testing and Polish

- [ ] 7.1 测试单个指令的显示和交互
- [ ] 7.2 测试多个指令混排的显示效果
- [ ] 7.3 测试指令与 Markdown 内容混排
- [ ] 7.4 测试历史消息中的指令显示（只读模式）
- [ ] 7.5 测试正则表达式匹配的准确性（EDIT 指令）
- [ ] 7.6 优化视觉样式，确保与现有设计语言一致
- [ ] 7.7 添加必要的错误处理和边界情况处理
