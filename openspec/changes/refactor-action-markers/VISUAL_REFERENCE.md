# Action Marker Visual Reference

This document provides visual examples of how the four action marker types will be rendered.

## Action Marker Format

### ADD_PART
```
[[ACTION:ADD_PART|工作经历|xx企业|负责xxx工作，在一个项目周期内提升系统效率xx%。主动提出xx。]]
```

**Visual Appearance:**
```
┌────────────────────────────────────────────────────────────┐
│ ┃ ➕ 添加到【工作经历】→ xx企业                              │
│ ┃ 负责xxx工作,在一个项目周期内提升系统效率xx%。主动提出xx。 │
│ ┃ [✓ 接受] [✗ 拒绝]                                         │
└────────────────────────────────────────────────────────────┘
  Green border, green plus icon
```

### NEW_SECTION
```
[[ACTION:NEW_SECTION|自我评价|null|擅长xxx,yyy,zzz]]
```

**Visual Appearance:**
```
┌────────────────────────────────────────────────────────────┐
│ ┃ ⭐ 创建新板块【自我评价】                                  │
│ ┃ 擅长xxx,yyy,zzz                                           │
│ ┃ [✓ 接受] [✗ 拒绝]                                         │
└────────────────────────────────────────────────────────────┘
  Blue border, blue star icon
```

### EDIT
```
[[ACTION:EDIT|工作经历|xx企业|擅长沟通，.*能够协调工作。|善于洞察用户需求，具有较强的逻辑思维能力和沟通协调能力。]]
```

**Visual Appearance:**
```
┌────────────────────────────────────────────────────────────┐
│ ┃ ~ 修改【工作经历】→ xx企业                                 │
│ ┃ - 擅长沟通，.*能够协调工作。                              │
│ ┃ + 善于洞察用户需求，具有较强的逻辑思维能力和沟通协调能力。 │
│ ┃ [✓ 接受] [✗ 拒绝]                                         │
└────────────────────────────────────────────────────────────┘
  Yellow border, yellow edit icon
```

### DISPLAY
```
[[ACTION:DISPLAY|我想修改下一段经历]]
```

**Visual Appearance:**
```
┌────────────────────────────────────────────────────────────┐
│ ┃ ℹ️ 我想修改下一段经历                                      │
└────────────────────────────────────────────────────────────┘
  Gray border, gray info icon, no buttons
```

## Color Scheme

| Action Type  | Border Color | Background | Icon Color | Icon |
|-------------|--------------|------------|------------|------|
| ADD_PART    | green-500    | green-50   | green-600  | +    |
| NEW_SECTION | blue-500     | blue-50    | blue-600   | *    |
| EDIT        | yellow-500   | yellow-50  | yellow-600 | ~    |
| DISPLAY     | gray-400     | gray-50    | gray-600   | i    |

## Interaction States

### Normal State
- Border: 4px solid on left
- Background: light tint
- Buttons: visible and enabled
- Cursor: default

### Hover State
- Border: slightly darker
- Background: slightly darker tint
- Buttons: highlight on hover
- Cursor: pointer on buttons

### Accepted State
- Border: darker variant of action color
- Background: darker tint
- Buttons: disabled and hidden
- Success indicator: checkmark icon
- Text: "已应用"

### Rejected State
- Border: gray
- Background: light gray
- Buttons: disabled and hidden
- Rejection indicator: X icon
- Text: "已忽略"

### Historical State (Read-only)
- Border: muted gray
- Background: very light gray
- Buttons: not rendered
- Text: muted
- Badge: "历史消息"

## Layout Specifications

```css
.action-marker {
  display: flex;
  border-left: 4px solid;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 8px 0;
  gap: 12px;
}

.action-marker-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.action-marker-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-marker-header {
  font-weight: 600;
  font-size: 14px;
}

.action-marker-body {
  font-size: 13px;
  line-height: 1.5;
}

.action-marker-buttons {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.action-marker-button {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-marker-button.accept {
  background: white;
  border: 1px solid currentColor;
  color: inherit; /* inherits from parent action type color */
}

.action-marker-button.reject {
  background: white;
  border: 1px solid #9CA3AF;
  color: #6B7280;
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

This will render as:
1. Regular markdown text: "我已经分析了你的简历..."
2. Yellow EDIT marker
3. Regular markdown text: "这样的表述更加具体..."
4. Green ADD_PART marker
5. Regular markdown text: "另外，建议添加..."
6. Blue NEW_SECTION marker
7. Gray DISPLAY marker

## Responsive Design

On mobile devices (width < 640px):
- Reduce padding to 10px 12px
- Stack buttons vertically
- Reduce font sizes by 1px
- Keep left border at 3px
