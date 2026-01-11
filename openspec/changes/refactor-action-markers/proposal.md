# Change: Refactor Action Markers from Buttons to Diff-Style Visual Elements

## Why

当前的AI消息渲染器使用 `[[text]]` 格式渲染为可点击按钮，这种交互方式不够直观且容易被忽略。为了提供更好的用户体验，我们需要引入四种新的行内指令格式（ADD_PART、NEW_SECTION、EDIT、DISPLAY），它们以类似工具调用的视觉样式呈现，让用户能够更清晰地看到AI建议的操作，并可以一键接受或拒绝这些更改。

## What Changes

- **BREAKING**: 移除 `[[text]]` 按钮格式的支持
- 在 `AiMessageRenderer.tsx` 中新增四种行内指令格式的识别和渲染：
  - `[[ACTION:ADD_PART|section|title|content]]` - 在指定板块添加新条目。全宽圆角灰色框，正常字体，可展开与折叠参数。折叠后显示预计修改的字符数。
  - `[[ACTION:NEW_SECTION|section|null|content]]` - 创建新板块。样式同上。
  - `[[ACTION:EDIT|section|title|regex|replacement]]` - 编辑指定条目（支持正则表达式）。样式同上。
  - `[[ACTION:DISPLAY|message]]` - 显示消息（替代原有的按钮功能）。非全宽，蓝色框，浅蓝底，蓝色字。
- 总共有两种风格的事件，一种是全宽细灰框，一种是非全宽蓝框。
- 触发自定义事件，让父组件（ChatPanel）能够响应用户的接受/拒绝操作（在运行时状态里管理）
- 移除 `Markdown.tsx` 中的 `processTextWithButtons` 相关逻辑
- 新消息提供的编辑操作可以排队，可以直接打勾确认。历史消息里的指令默认已经用过，但是展开详情后可以显示一个重新触发的按钮。

## Impact

- Affected specs: 无（新建能力）
- Affected code:
  - `web/src/pages/editor/components/AiMessageRenderer.tsx` - 主要修改
  - `web/src/components/ui/Markdown.tsx` - 移除按钮处理逻辑
  - `web/src/pages/editor/components/ChatPanel.tsx` - 移除 markdown-button-click 事件监听器，新增处理四种指令的事件监听器
