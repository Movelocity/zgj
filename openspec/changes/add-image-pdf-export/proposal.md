# Change: 添加图片导出PDF选项以解决色彩一致性问题

## Why

部分用户在使用浏览器打印功能导出PDF时遇到色彩不一致的问题。虽然大部分浏览器可以正确保持色彩，但少数浏览器（或特定配置）可能无法完全遵守 `print-color-adjust: exact` 样式规则。为了给用户提供更可靠的导出选项，需要添加基于Canvas的图片导出方式作为备选方案。

## What Changes

- 在简历编辑页的"导出PDF"按钮改造为Split Button（分割按钮）：
  - 按钮主体区域：点击直接触发默认的文字PDF打印
  - 按钮右侧角标（下拉箭头）：点击打开下拉菜单选择导出方式
- 提供两个导出选项：
  - **文字PDF**（默认）：使用现有的浏览器原生打印功能，适合大多数用户
  - **图片PDF**：使用Canvas将简历渲染为图片后生成PDF，确保色彩一致性
- 安装新依赖：`html2canvas`（用于DOM转Canvas）和 `jspdf`（用于生成PDF）
- 实现新的canvas导出函数 `exportElementToPDFViaCanvas` 在 `web/src/utils/pdfExport.ts`
  - 支持智能分页：根据A4纸张高度自动计算分页位置
  - 边距计算：每页保留适当的页边距（上下左右各2rem）
  - 避免内容截断：检测DOM元素边界，避免在不合适位置分页
- 使用 `@radix-ui/react-dropdown-menu` 创建导出选项下拉菜单组件

## Impact

- **Affected specs**: `resume-export`（新建）
- **Affected code**:
  - `web/src/pages/editor/ResumeDetails.tsx`：替换导出按钮为下拉菜单
  - `web/src/utils/pdfExport.ts`：添加Canvas导出函数
  - `web/package.json`：添加新依赖
- **User experience**: 
  - 不影响现有用户体验（点击按钮主体仍直接触发打印）
  - 为有色彩问题的用户提供备选方案（通过角标下拉菜单访问）
  - 导出按钮UI从简单按钮变为Split Button（保持快速访问默认功能）

