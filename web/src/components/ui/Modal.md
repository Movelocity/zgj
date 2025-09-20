# Modal 通用模态框组件

基于 WorkflowModal 框架设计的通用模态框组件，提供灵活的配置选项和优雅的用户体验。

## 特性

- 🎯 **灵活配置**: 支持多种尺寸、样式和行为配置
- 🎨 **美观设计**: 采用现代化的设计风格，与项目整体风格保持一致
- ♿ **无障碍支持**: 支持键盘导航（ESC关闭）和焦点管理
- 📱 **响应式设计**: 在不同屏幕尺寸下都有良好的显示效果
- 🔒 **体验优化**: 自动阻止body滚动，支持遮罩点击关闭
- 🎛️ **高度可定制**: 支持自定义头部、底部、内容和样式

## 基本用法

```tsx
import { Modal } from '@/components/ui';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>打开模态框</button>
      
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="基础模态框"
      >
        <div className="p-6">
          <p>这是模态框的内容</p>
        </div>
      </Modal>
    </>
  );
}
```

## API 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | - | 是否显示模态框 |
| `onClose` | `() => void` | - | 关闭模态框的回调函数 |
| `title` | `string` | - | 模态框标题 |
| `children` | `ReactNode` | - | 模态框内容 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | 模态框尺寸 |
| `showHeader` | `boolean` | `true` | 是否显示头部 |
| `showCloseButton` | `boolean` | `true` | 是否显示关闭按钮 |
| `showFooter` | `boolean` | `false` | 是否显示底部 |
| `footer` | `ReactNode` | - | 自定义底部内容 |
| `confirmText` | `string` | `'确认'` | 确认按钮文本 |
| `cancelText` | `string` | `'取消'` | 取消按钮文本 |
| `onConfirm` | `() => void` | - | 确认按钮点击回调 |
| `onCancel` | `() => void` | - | 取消按钮点击回调 |
| `confirmLoading` | `boolean` | `false` | 确认按钮加载状态 |
| `confirmDisabled` | `boolean` | `false` | 确认按钮是否禁用 |
| `confirmVariant` | `ButtonVariant` | `'primary'` | 确认按钮变体 |
| `maskClosable` | `boolean` | `true` | 是否可以通过点击遮罩关闭 |
| `escClosable` | `boolean` | `true` | 是否可以通过ESC键关闭 |
| `className` | `string` | `''` | 自定义类名 |
| `contentClassName` | `string` | `''` | 内容区域自定义类名 |
| `zIndex` | `number` | `1000` | z-index层级 |

## 尺寸配置

| 尺寸 | 最大宽度 | 适用场景 |
|------|----------|----------|
| `sm` | `max-w-md` (28rem) | 简单确认框、提示框 |
| `md` | `max-w-2xl` (42rem) | 一般表单、详情展示 |
| `lg` | `max-w-4xl` (56rem) | 复杂表单、数据展示 |
| `xl` | `max-w-6xl` (72rem) | 大型表单、图表展示 |
| `full` | `max-w-[95vw]` | 全屏展示、复杂界面 |

## 使用场景示例

### 1. 简单确认框

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="删除确认"
  size="sm"
  showFooter={true}
  confirmText="删除"
  confirmVariant="danger"
  onConfirm={handleDelete}
>
  <div className="p-6">
    <p>确定要删除这个项目吗？此操作不可撤销。</p>
  </div>
</Modal>
```

### 2. 表单模态框

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="编辑用户"
  size="lg"
  showFooter={true}
  confirmText="保存"
  confirmLoading={loading}
  confirmDisabled={!isFormValid}
  onConfirm={handleSave}
>
  <div className="p-6">
    <form>
      {/* 表单内容 */}
    </form>
  </div>
</Modal>
```

### 3. 自定义底部

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="高级设置"
  size="md"
  showFooter={true}
  footer={
    <div className="flex justify-between w-full">
      <Button variant="ghost" onClick={handleReset}>
        重置
      </Button>
      <div className="space-x-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  }
>
  <div className="p-6">
    {/* 设置内容 */}
  </div>
</Modal>
```

### 4. 仅内容展示

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="帮助文档"
  size="lg"
>
  <div className="p-6">
    {/* 文档内容 */}
  </div>
</Modal>
```

### 5. 禁用关闭功能

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="正在处理..."
  size="sm"
  maskClosable={false}
  escClosable={false}
  showCloseButton={false}
>
  <div className="p-6 text-center">
    <Loading />
    <p className="mt-2">请稍候，正在处理中...</p>
  </div>
</Modal>
```

## 样式定制

### 自定义样式类

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  className="custom-modal-overlay"
  contentClassName="custom-modal-content"
>
  {/* 内容 */}
</Modal>
```

### CSS 变量覆盖

```css
.custom-modal-overlay {
  background-color: rgba(0, 0, 0, 0.8);
}

.custom-modal-content {
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

## 最佳实践

### 1. 状态管理
- 使用 `useState` 管理模态框开关状态
- 在组件卸载时确保模态框关闭

### 2. 表单处理
- 在确认回调中处理表单验证和提交
- 使用 `confirmLoading` 显示提交状态
- 使用 `confirmDisabled` 控制按钮可用性

### 3. 用户体验
- 为重要操作使用确认模态框
- 合理设置模态框尺寸
- 提供清晰的操作反馈

### 4. 无障碍性
- 保持默认的键盘导航功能
- 为按钮提供合适的文本
- 确保焦点管理正确

### 5. 性能优化
- 避免在模态框中渲染大量数据
- 使用懒加载处理复杂内容
- 合理使用 `React.memo` 优化重渲染

## 注意事项

1. **z-index 管理**: 如果项目中有其他高层级元素，可能需要调整 `zIndex` 参数
2. **滚动处理**: 组件会自动阻止 body 滚动，确保模态框关闭时恢复正常
3. **事件冒泡**: 内容区域会阻止点击事件冒泡，避免意外关闭
4. **内存泄漏**: 组件会自动清理事件监听器，无需手动处理

## 与 WorkflowModal 的对比

| 特性 | WorkflowModal | 通用 Modal |
|------|---------------|------------|
| 复用性 | 专用组件 | 通用组件 |
| 配置灵活性 | 固定配置 | 高度可配置 |
| 代码维护 | 重复代码 | 统一维护 |
| 功能扩展 | 需要修改源码 | 通过参数配置 |
| 学习成本 | 低（专用） | 中等（通用） |

建议在新功能开发中优先使用通用 Modal 组件，既能保持一致的用户体验，又能减少代码重复。
