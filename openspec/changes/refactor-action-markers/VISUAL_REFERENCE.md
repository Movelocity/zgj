# Action Marker Visual Reference

This document provides visual examples of how the four action marker types will be rendered. The design uses a minimal color scheme with gray for actionable items and blue for informational messages.

## Design Principles

- **Two visual styles**: Full-width gray boxes for actions, inline blue boxes for information
- **Expandable/Collapsible**: Action markers can be expanded to show details or collapsed to show character count
- **Simple colors**: Gray and blue only, no rainbow colors

## Action Marker Format

### ADD_PART

```
[[ACTION:ADD_PART|工作经历|xx企业|负责xxx工作，在一个项目周期内提升系统效率xx%。主动提出xx。]]
```

**Collapsed State (Default for new messages):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 添加到【工作经历】→ xx企业                               │
│ 预计添加 45 字   [展开] [✓ 接受] [✗ 拒绝]                 │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Expanded State:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 添加到【工作经历】→ xx企业                               │
│                                                           │
│ 负责xxx工作，在一个项目周期内提升系统效率xx%。主动提出xx。│
│                                                           │
│ [收起] [✓ 接受] [✗ 拒绝]                                  │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### NEW_SECTION

```
[[ACTION:NEW_SECTION|自我评价|null|擅长xxx,yyy,zzz]]
```

**Collapsed State:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 创建新板块【自我评价】                                    │
│ 预计添加 18 字   [展开] [✓ 接受] [✗ 拒绝]                 │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Expanded State:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 创建新板块【自我评价】                                    │
│                                                           │
│ 擅长xxx,yyy,zzz                                          │
│                                                           │
│ [收起] [✓ 接受] [✗ 拒绝]                                  │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### EDIT

```
[[ACTION:EDIT|工作经历|xx企业|擅长沟通，.*能够协调工作。|善于洞察用户需求，具有较强的逻辑思维能力和沟通协调能力。]]
```

**Collapsed State:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 修改【工作经历】→ xx企业                                  │
│ 预计修改 32 字   [展开] [✓ 接受] [✗ 拒绝]                 │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Expanded State:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 修改【工作经历】→ xx企业                                  │
│                                                           │
│ 匹配模式: 擅长沟通，.*能够协调工作。                       │
│ 替换为: 善于洞察用户需求，具有较强的逻辑思维能力和沟通协调 │
│         能力。                                            │
│                                                           │
│ [收起] [✓ 接受] [✗ 拒绝]                                  │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### DISPLAY

```
[[ACTION:DISPLAY|我想修改下一段经历]]
```

**Visual Appearance:**
```
┌─────────────────────────┐
│ 我想修改下一段经历        │
└─────────────────────────┘
```

## Color Scheme

| Action Type                | Border      | Background  | Text        | Width      |
|----------------------------|-------------|-------------|-------------|------------|
| ADD_PART, NEW_SECTION, EDIT| gray-300    | gray-50     | gray-900    | Full-width |
| DISPLAY                    | blue-400    | blue-50     | blue-700    | Inline     |

## Interaction States

### Collapsed State (Default)
- Shows action summary and character count
- Buttons: [展开] [✓ 接受] [✗ 拒绝]
- Gray border and background

### Expanded State
- Shows full action details
- Buttons: [收起] [✓ 接受] [✗ 拒绝]
- Gray border and background

### Accepted State
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ ✓ 添加到【工作经历】→ xx企业 (已应用)                     │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
- Darker gray background
- No buttons shown
- Success checkmark and "已应用" text

### Rejected State
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ ✗ 添加到【工作经历】→ xx企业 (已忽略)                     │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
- Light gray background
- No buttons shown
- X icon and "已忽略" text

### Historical State (Default Collapsed)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 添加到【工作经历】→ xx企业                               │
│ 预计添加 45 字   [展开]                                   │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
- Muted gray background
- No Accept/Reject buttons shown in collapsed state

### Historical State (Expanded)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 添加到【工作经历】→ xx企业                               │
│                                                           │
│ 负责xxx工作，在一个项目周期内提升系统效率xx%。主动提出xx。│
│                                                           │
│ [收起] [重新触发]                                         │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
- Muted gray background
- Shows [重新触发] button when expanded
- User can reapply the action

## Layout Specifications

### Actionable Markers (ADD_PART, NEW_SECTION, EDIT)

```css
.action-marker-full {
  width: 100%;
  border: 1px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;
  background: #F9FAFB; /* gray-50 */
  padding: 12px 16px;
  margin: 8px 0;
}

.action-marker-header {
  font-size: 14px;
  font-weight: 500;
  color: #111827; /* gray-900 */
  margin-bottom: 8px;
}

.action-marker-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6B7280; /* gray-500 */
}

.action-marker-content {
  font-size: 13px;
  line-height: 1.6;
  color: #374151; /* gray-700 */
  margin: 8px 0;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.action-marker-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-marker-button {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid #D1D5DB;
  background: white;
  color: #374151;
}

.action-marker-button:hover {
  background: #F3F4F6;
}

.action-marker-button.accept {
  border-color: #111827;
  color: #111827;
}

.action-marker-button.accept:hover {
  background: #111827;
  color: white;
}
```

### Informational Marker (DISPLAY)

```css
.action-marker-display {
  display: inline-block;
  border: 1px solid #60A5FA; /* blue-400 */
  border-radius: 6px;
  background: #EFF6FF; /* blue-50 */
  color: #1D4ED8; /* blue-700 */
  padding: 8px 12px;
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.5;
}
```

## Example: Mixed Content

AI message with multiple markers mixed with regular text:

```
我已经分析了你的简历，建议进行以下修改：

[[ACTION:EDIT|工作经历|xx企业|擅长沟通，.*能够协调工作。|善于洞察用户需求，具有较强的逻辑思维能力和沟通协调能力。]]

这样的表述更加具体，能够突出你的核心能力。

[[ACTION:ADD_PART|工作经历|yy公司|参与多个大型项目的开发，具有丰富的团队协作经验。]]

另外，建议添加自我评价板块：

[[ACTION:NEW_SECTION|自我评价|null|具有强烈的学习意愿和适应能力，善于在压力下工作。]]

[[ACTION:DISPLAY|如果需要调整其他内容，请告诉我]]
```

**Rendered Output:**

```
我已经分析了你的简历，建议进行以下修改：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 修改【工作经历】→ xx企业                                  │
│ 预计修改 32 字   [展开] [✓ 接受] [✗ 拒绝]                 │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

这样的表述更加具体，能够突出你的核心能力。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 添加到【工作经历】→ yy公司                               │
│ 预计添加 28 字   [展开] [✓ 接受] [✗ 拒绝]                 │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

另外，建议添加自我评价板块：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ 创建新板块【自我评价】                                    │
│ 预计添加 30 字   [展开] [✓ 接受] [✗ 拒绝]                 │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────┐
│ 如果需要调整其他内容，请告诉我│
└─────────────────────────────┘
```

## Character Count Calculation

When collapsed, the system calculates estimated character changes:

- **ADD_PART**: Count content length
- **NEW_SECTION**: Count content length
- **EDIT**: Count replacement text length
- **DISPLAY**: No count (informational only)

## Action Queue Management

Multiple actions from the same message can be accepted in sequence:

1. User accepts first action → Applied immediately, button changes to "已应用"
2. User accepts second action → Queued and applied
3. All actions independent, no ordering constraints

## Responsive Design

On mobile devices (width < 640px):
- Full-width markers remain full-width
- Reduce padding to 10px 12px
- Stack buttons vertically with 4px gap
- Reduce font sizes by 1px
- DISPLAY markers may wrap to multiple lines
