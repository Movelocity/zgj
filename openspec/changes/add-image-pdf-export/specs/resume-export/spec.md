# Resume Export Capability

## ADDED Requirements

### Requirement: 导出方式选择
用户在简历编辑页面 SHALL 能够通过Split Button选择两种不同的PDF导出方式：文字PDF和图片PDF。

#### Scenario: Split Button UI交互
- **WHEN** 简历编辑页加载完成
- **THEN** 导出按钮显示为Split Button样式
- **AND** 按钮主体区域显示"导出PDF"文字
- **AND** 按钮右侧显示下拉箭头角标（与主体区域有视觉分割）

#### Scenario: 点击按钮主体触发默认导出
- **WHEN** 用户点击"导出PDF"按钮的主体区域
- **THEN** 系统直接触发文字PDF打印（浏览器打印对话框）
- **AND** 不显示下拉菜单

#### Scenario: 点击角标显示选项菜单
- **WHEN** 用户点击按钮右侧的下拉箭头角标
- **THEN** 系统显示下拉菜单，包含"文字PDF"和"图片PDF"两个选项
- **AND** 当前默认选项显示选中标记

#### Scenario: 从菜单选择导出方式
- **WHEN** 用户在下拉菜单中选择某个选项
- **THEN** 系统执行对应的导出方式
- **AND** 关闭下拉菜单

### Requirement: 浏览器打印导出
系统 SHALL 支持使用浏览器原生打印功能导出PDF，保持现有行为不变。

#### Scenario: 选择浏览器打印
- **WHEN** 用户在下拉菜单中选择"浏览器打印"
- **THEN** 系统调用浏览器原生打印对话框
- **AND** 打印内容包含完整的简历内容
- **AND** 应用正确的打印样式（A4纸张，适当边距）

#### Scenario: 色彩保持设置
- **WHEN** 使用浏览器打印导出
- **THEN** 系统应用 `-webkit-print-color-adjust: exact` 和 `print-color-adjust: exact` 样式
- **AND** 在支持的浏览器中保持原始色彩

### Requirement: 图片PDF导出
系统 SHALL 支持通过Canvas渲染简历为图片后生成PDF，确保色彩完全一致。

#### Scenario: 选择图片PDF导出
- **WHEN** 用户在下拉菜单中选择"图片PDF"
- **THEN** 系统使用 html2canvas 将简历DOM渲染为Canvas
- **AND** 使用 jspdf 将Canvas图片写入PDF文件
- **AND** 触发PDF文件下载

#### Scenario: Canvas渲染质量
- **WHEN** 使用Canvas渲染简历
- **THEN** 渲染DPI应至少为200
- **AND** 输出PDF页面尺寸为A4（210mm × 297mm）
- **AND** 保持所有色彩、字体和布局不变

#### Scenario: 多页简历分页边距计算
- **WHEN** 简历内容超过一页
- **THEN** 系统计算A4页面可用高度（297mm - 上下边距）
- **AND** 每页保留上下左右各2rem的边距
- **AND** 自动将内容分割为多个页面
- **AND** 每页保持A4尺寸（210mm × 297mm）

#### Scenario: 智能分页避免内容截断
- **WHEN** Canvas渲染进行分页计算时
- **THEN** 系统检测DOM元素的边界位置
- **AND** 避免在板块标题和内容之间分页
- **AND** 避免在列表项中间分页
- **AND** 优先在板块之间或自然段落之间分页

#### Scenario: 导出进度提示
- **WHEN** 用户选择图片PDF导出
- **THEN** 系统显示加载提示（因为Canvas渲染需要时间）
- **AND** 渲染完成后自动下载PDF文件
- **AND** 如果出现错误，显示友好的错误提示

### Requirement: 导出文件命名
系统 SHALL 为导出的PDF文件生成有意义的文件名。

#### Scenario: 文件名格式
- **WHEN** 导出PDF文件
- **THEN** 文件名格式为 `{简历名称}_{日期}.pdf`
- **AND** 日期格式为 `YYYY-MM-DD`
- **AND** 如果简历名称包含特殊字符，替换为下划线

#### Scenario: 浏览器打印的文件名
- **WHEN** 使用浏览器打印导出
- **THEN** 通过设置 `document.title` 影响默认文件名
- **AND** 打印完成后恢复原始标题

### Requirement: 错误处理
系统 SHALL 正确处理导出过程中的各种错误情况。

#### Scenario: DOM元素未找到
- **WHEN** 导出时找不到简历编辑器DOM元素
- **THEN** 显示错误提示"未找到简历编辑器元素"
- **AND** 不触发任何导出操作

#### Scenario: Canvas渲染失败
- **WHEN** html2canvas渲染失败（如浏览器不支持）
- **THEN** 显示错误提示"PDF导出失败，请尝试使用浏览器打印"
- **AND** 记录详细错误日志到控制台

#### Scenario: PDF生成失败
- **WHEN** jspdf生成PDF失败
- **THEN** 显示错误提示"PDF生成失败，请稍后重试"
- **AND** 清理已生成的中间资源

