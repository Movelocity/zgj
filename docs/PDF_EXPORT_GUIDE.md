# PDF导出功能文档

## 功能概述

简历PDF导出功能允许用户将编辑好的简历导出为标准A4格式的PDF文件，具有专业的排版和分页效果。

## 技术规格

### PDF规格
- **纸张尺寸**: A4 (210mm × 297mm)
- **分辨率**: 200 DPI
- **页边距**: 200px (约26.5mm)
- **内容区域**: 1254px × 1938px

### 计算说明
```
A4尺寸转像素 (200 DPI):
- 宽度: 210mm ≈ 8.27英寸 ≈ 1654像素
- 高度: 297mm ≈ 11.69英寸 ≈ 2338像素

内容区域 (减去padding 200px):
- 宽度: 1654 - 400 = 1254像素
- 高度: 2338 - 400 = 1938像素
```

## 功能特点

1. **自动分页**: 当简历内容超过一页时，自动按照内容高度进行分页
2. **统一边距**: 每页保持200px的统一边距
3. **高质量输出**: 使用JPEG格式，质量设置为95%
4. **文件命名**: 自动使用"简历名称_日期.pdf"格式命名

## 使用方法

### 用户操作
1. 在简历编辑页面，点击顶部工具栏的"导出PDF"按钮
2. 系统会显示"正在生成PDF，请稍候..."提示
3. 生成完成后，PDF文件将自动下载到浏览器默认下载目录
4. 文件名格式: `{简历名称}_{YYYY-MM-DD}.pdf`

### 开发者集成

#### 安装依赖
```bash
pnpm add jspdf html2canvas
```

#### 导入模块
```typescript
import { exportResumeToPDF, exportElementToPDF } from '@/utils/pdfExport';
```

#### 使用示例

**方式一：导出简历（推荐）**
```typescript
// 自动查找简历编辑器并导出
await exportResumeToPDF('张三的简历');
```

**方式二：导出任意DOM元素**
```typescript
const element = document.getElementById('my-element');
if (element) {
  await exportElementToPDF(element as HTMLElement, 'my-document.pdf');
}
```

## 核心API

### exportResumeToPDF
导出当前简历为PDF文件

**参数:**
- `resumeName` (string, 可选): 简历名称，默认为"简历"

**返回:**
- `Promise<void>`

**异常:**
- 当找不到简历编辑器元素时抛出错误

### exportElementToPDF
导出任意DOM元素为PDF文件

**参数:**
- `element` (HTMLElement): 要导出的DOM元素
- `filename` (string, 可选): PDF文件名，默认为"resume.pdf"

**返回:**
- `Promise<void>`

## 工作原理

### 导出流程
1. **克隆DOM元素**: 克隆需要导出的元素，避免影响原始DOM
2. **设置样式**: 为克隆元素设置固定宽度和样式
3. **转换为Canvas**: 使用html2canvas将DOM转换为canvas
4. **计算分页**: 根据内容高度计算需要的页数
5. **逐页处理**: 
   - 裁剪canvas内容
   - 转换为图片
   - 添加到PDF页面
6. **保存文件**: 生成并下载PDF文件
7. **清理资源**: 移除克隆的DOM元素

### 分页算法
```typescript
// 计算页数
pageCount = Math.ceil(contentHeight / CONTENT_HEIGHT_PX);

// 为每一页生成配置
for (let i = 0; i < pageCount; i++) {
  startY = i * CONTENT_HEIGHT_PX;
  endY = Math.min((i + 1) * CONTENT_HEIGHT_PX, totalHeight);
  // 添加页面内容到PDF
}
```

## 关键配置

### PDF_CONFIG 常量
```typescript
const PDF_CONFIG = {
  A4_WIDTH_MM: 210,        // A4宽度（毫米）
  A4_HEIGHT_MM: 297,       // A4高度（毫米）
  DPI: 200,                // 分辨率
  PADDING_PX: 200,         // 边距（像素）
  A4_WIDTH_PX: 1654,       // A4宽度（像素）
  A4_HEIGHT_PX: 2338,      // A4高度（像素）
  CONTENT_WIDTH_PX: 1254,  // 内容宽度（像素）
  CONTENT_HEIGHT_PX: 1938, // 内容高度（像素）
};
```

## 注意事项

### DOM元素要求
- 导出的元素必须具有`data-resume-editor`属性
- 元素应该有明确的尺寸定义
- 避免使用动态加载的图片（可能导致空白）

### 样式限制
- 某些CSS效果可能无法完美转换（如阴影、渐变）
- 建议使用简单、清晰的样式
- 避免使用position: fixed或absolute定位

### 性能优化
- 对于长简历，导出过程可能需要几秒钟
- 建议在导出前提示用户等待
- 大文件可能影响浏览器性能

## 故障排除

### 常见问题

**Q: 导出的PDF为空白**
- 检查元素是否有`data-resume-editor`属性
- 确认元素内容已完全加载
- 检查控制台错误信息

**Q: 图片无法显示**
- 确保图片支持CORS
- 使用相对路径或同源图片
- 检查图片是否已加载完成

**Q: 分页位置不理想**
- 调整内容高度
- 使用CSS的`page-break-after`样式（虽然在canvas中效果有限）
- 手动调整内容布局

**Q: 文字模糊**
- 检查DPI设置
- 增加canvas的scale参数
- 使用更高质量的JPEG压缩

## 文件结构

```
web/src/
├── utils/
│   └── pdfExport.ts              # PDF导出核心模块
├── pages/
│   └── editor/
│       ├── ResumeDetails.tsx     # 简历编辑主页面（含导出按钮）
│       └── components/
│           └── ResumeEditor.tsx  # 简历编辑器组件
└── docs/
    └── PDF_EXPORT_GUIDE.md       # 本文档
```

## 未来改进

- [ ] 支持自定义页边距
- [ ] 支持其他纸张尺寸（Letter, B5等）
- [ ] 添加页眉页脚
- [ ] 支持水印
- [ ] 优化分页算法，避免内容截断
- [ ] 添加导出进度条
- [ ] 支持批量导出

