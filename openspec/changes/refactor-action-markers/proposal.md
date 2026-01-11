# Change: Refactor Action Markers from Buttons to Diff-Style Visual Elements

## Why

当前的AI消息渲染器使用 `[[text]]` 格式渲染为可点击按钮，这种交互方式不够直观且容易被忽略。为了提供更好的用户体验，我们需要引入四种新的行内指令格式（ADD_PART、NEW_SECTION、EDIT、DISPLAY），它们以类似Git diff的视觉样式呈现，让用户能够更清晰地看到AI建议的操作，并可以一键接受或拒绝这些更改。

## What Changes

- **BREAKING**: 移除 `[[text]]` 按钮格式的支持
- 在 `AiMessageRenderer.tsx` 中新增四种行内指令格式的识别和渲染：
  - `[[ACTION:ADD_PART|section|title|content]]` - 在指定板块添加新条目
  - `[[ACTION:NEW_SECTION|section|null|content]]` - 创建新板块
  - `[[ACTION:EDIT|section|title|regex|replacement]]` - 编辑指定条目（支持正则表达式）
  - `[[ACTION:DISPLAY|message]]` - 显示消息（替代原有的按钮功能）
- 为每种指令类型设计类似Git diff的单行视觉元素，包含：
  - 操作类型图标（ADD用+号绿色，EDIT用~号黄色，NEW_SECTION用*号蓝色，DISPLAY用i号灰色）
  - 操作描述文本
  - 接受/拒绝按钮（DISPLAY类型除外）
- 触发自定义事件，让父组件（ChatPanel）能够响应用户的接受/拒绝操作
- 移除 `Markdown.tsx` 中的 `processTextWithButtons` 相关逻辑

## Impact

- Affected specs: 无（新建能力）
- Affected code:
  - `web/src/pages/editor/components/AiMessageRenderer.tsx` - 主要修改
  - `web/src/components/ui/Markdown.tsx` - 移除按钮处理逻辑
  - `web/src/pages/editor/components/ChatPanel.tsx` - 移除 markdown-button-click 事件监听器，新增处理四种指令的事件监听器
