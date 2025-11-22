# Capability: Admin Event Log Viewer

## Overview

管理员事件日志查看功能，提供前端界面查询和展示系统事件日志，支持按时间范围和多种条件筛选。

## ADDED Requirements

### Requirement: Event Log Query Interface

系统SHALL提供事件日志查询接口，允许管理员通过多种条件筛选和查询日志数据。

#### Scenario: Query logs by time range
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员选择开始时间"2025-11-22 10:00"和结束时间"2025-11-22 18:00"，然后点击"查询"按钮
- **THEN** 系统SHALL调用后端API `/api/admin/event-logs`，传递 `start_time` 和 `end_time` 参数
- **AND** 系统SHALL显示该时间范围内的所有事件日志
- **AND** 系统SHALL显示总记录数

#### Scenario: Query logs by user ID
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员在用户ID筛选框输入"user123"，然后点击"查询"按钮
- **THEN** 系统SHALL只显示user_id为"user123"的事件日志

#### Scenario: Query logs by event category and type
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员选择事件分类"认证相关(auth)"，然后选择事件类型"用户登录(user_login)"，然后点击"查询"按钮
- **THEN** 系统SHALL只显示event_category为"auth"且event_type为"user_login"的日志

#### Scenario: Query logs by status
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员选择状态筛选"失败(failed)"，然后点击"查询"按钮
- **THEN** 系统SHALL只显示status为"failed"的事件日志

#### Scenario: Combined filters
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员同时设置时间范围、用户ID、事件类型和状态筛选条件
- **THEN** 系统SHALL应用所有筛选条件的AND逻辑，返回符合所有条件的日志

#### Scenario: Reset filters
- **GIVEN** 管理员已设置多个筛选条件
- **WHEN** 管理员点击"重置"按钮
- **THEN** 系统SHALL清空所有筛选条件
- **AND** 系统SHALL显示默认的日志列表（不带任何筛选）

#### Scenario: API error handling
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员点击"查询"按钮但后端API返回错误
- **THEN** 系统SHALL显示错误提示消息
- **AND** 系统SHALL保持当前显示的日志列表不变（如果有）

### Requirement: Time Range Quick Selection

系统SHALL提供快捷时间范围选择按钮，方便管理员快速选择常用的时间范围。

#### Scenario: Select "Today" quick filter
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员点击"今天"快捷按钮
- **THEN** 系统SHALL自动设置开始时间为今天00:00，结束时间为当前时间
- **AND** 系统SHALL自动执行查询

#### Scenario: Select "Last 7 days" quick filter
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员点击"最近7天"快捷按钮
- **THEN** 系统SHALL自动设置开始时间为7天前00:00，结束时间为当前时间
- **AND** 系统SHALL自动执行查询

#### Scenario: Select "Last 30 days" quick filter
- **GIVEN** 管理员在事件日志管理页面
- **WHEN** 管理员点击"最近30天"快捷按钮
- **THEN** 系统SHALL自动设置开始时间为30天前00:00，结束时间为当前时间
- **AND** 系统SHALL自动执行查询

#### Scenario: Clear time range
- **GIVEN** 管理员已设置时间范围筛选
- **WHEN** 管理员点击"清除"按钮
- **THEN** 系统SHALL清空开始时间和结束时间输入框
- **AND** 系统SHALL不自动执行查询（需要用户手动点击"查询"按钮）

### Requirement: Event Log Display

系统SHALL以表格形式展示事件日志列表，包含所有关键字段，并根据状态使用不同的颜色标识。

#### Scenario: Display log list with all fields
- **GIVEN** 管理员查询到事件日志数据
- **WHEN** 系统显示日志列表
- **THEN** 每条日志SHALL显示以下字段：
  - ID（id: number）
  - 创建时间（created_at，格式化为本地时间，如"2025-11-22 14:30:25"）
  - 用户ID（user_id）
  - 事件分类（event_category，显示中文标签，如"认证相关"）
  - 事件类型（event_type，显示中文标签，如"用户登录"）
  - 状态（status，带颜色标识）
  - IP地址（ip_address）
  - 操作按钮（查看详情）

#### Scenario: Status color coding
- **GIVEN** 日志列表中包含不同状态的日志
- **WHEN** 系统显示日志列表
- **THEN** "success"状态SHALL显示为绿色背景（bg-green-100 text-green-800）
- **AND** "failed"状态SHALL显示为红色背景（bg-red-100 text-red-800）
- **AND** "error"状态SHALL显示为橙色背景（bg-orange-100 text-orange-800）

#### Scenario: Empty state
- **GIVEN** 管理员查询日志但没有符合条件的数据
- **WHEN** 系统显示查询结果
- **THEN** 系统SHALL显示"暂无数据"的友好提示
- **AND** 系统SHALL提示用户调整筛选条件重试

#### Scenario: Loading state
- **GIVEN** 管理员执行查询操作
- **WHEN** 系统正在等待后端API响应
- **THEN** 系统SHALL显示加载指示器（loading spinner或skeleton）
- **AND** 系统SHALL禁用查询按钮，防止重复请求

### Requirement: Event Log Details Modal

系统SHALL提供详情弹窗，显示单条事件日志的完整信息，包括details字段的JSON数据。

#### Scenario: Open details modal
- **GIVEN** 管理员在事件日志列表页面
- **WHEN** 管理员点击某条日志的"详情"按钮
- **THEN** 系统SHALL打开详情弹窗
- **AND** 弹窗SHALL显示该日志的所有字段：
  - ID（id）
  - 创建时间（created_at）
  - 用户ID（user_id）
  - 事件分类（event_category）
  - 事件类型（event_type）
  - 状态（status）
  - IP地址（ip_address）
  - User Agent（user_agent）
  - 资源类型（resource_type，如果有）
  - 资源ID（resource_id，如果有）
  - 错误信息（error_message，如果状态为failed或error）
  - Details（details字段，格式化的JSON）

#### Scenario: Display details JSON field
- **GIVEN** 详情弹窗已打开
- **WHEN** 日志包含details字段（JSONB类型）
- **THEN** 系统SHALL将details字段格式化为可读的JSON格式显示
- **AND** 系统SHALL使用 `<pre>` 标签确保格式正确
- **AND** 系统SHALL支持横向滚动（如果JSON内容过宽）

#### Scenario: Handle null or empty details
- **GIVEN** 详情弹窗已打开
- **WHEN** 日志的details字段为null或空对象
- **THEN** 系统SHALL显示"无详细信息"提示
- **AND** 不尝试格式化或显示空的JSON

#### Scenario: Close details modal
- **GIVEN** 详情弹窗已打开
- **WHEN** 管理员点击"关闭"按钮或点击弹窗外部区域
- **THEN** 系统SHALL关闭详情弹窗

### Requirement: Pagination

系统SHALL支持分页浏览大量日志数据，并允许管理员选择每页显示的条数。

#### Scenario: Default pagination
- **GIVEN** 管理员首次打开事件日志管理页面
- **WHEN** 系统加载日志列表
- **THEN** 系统SHALL默认显示第1页，每页20条数据

#### Scenario: Navigate to next page
- **GIVEN** 管理员在日志列表页面且有多页数据
- **WHEN** 管理员点击"下一页"按钮
- **THEN** 系统SHALL加载下一页的数据
- **AND** 系统SHALL更新页码显示

#### Scenario: Navigate to previous page
- **GIVEN** 管理员在日志列表的第2页或之后
- **WHEN** 管理员点击"上一页"按钮
- **THEN** 系统SHALL加载上一页的数据
- **AND** 系统SHALL更新页码显示

#### Scenario: Change page size
- **GIVEN** 管理员在日志列表页面
- **WHEN** 管理员从页面大小下拉框选择"50条/页"
- **THEN** 系统SHALL重新加载第1页，每页显示50条数据
- **AND** 系统SHALL更新总页数显示

#### Scenario: Pagination with filters
- **GIVEN** 管理员已应用筛选条件
- **WHEN** 管理员切换页码
- **THEN** 系统SHALL保持筛选条件不变
- **AND** 系统SHALL加载符合筛选条件的相应页数据

#### Scenario: Display total count
- **GIVEN** 管理员查询日志数据
- **WHEN** 系统显示分页信息
- **THEN** 系统SHALL显示总记录数（如"共 156 条记录"）
- **AND** 系统SHALL显示当前页码和总页数（如"第 2 页 / 共 8 页"）

### Requirement: Mobile Responsive Layout

系统SHALL在移动设备上提供优化的布局，确保事件日志查看功能在小屏幕上可用。

#### Scenario: Mobile filter section
- **GIVEN** 管理员使用移动设备访问事件日志管理页面
- **WHEN** 屏幕宽度小于768px
- **THEN** 筛选条件SHALL垂直排列，每个筛选项占据全宽

#### Scenario: Mobile log display
- **GIVEN** 管理员使用移动设备查看日志列表
- **WHEN** 屏幕宽度小于768px
- **THEN** 系统SHALL使用卡片式布局替代表格
- **AND** 每个卡片SHALL包含日志的核心信息（时间、用户、事件类型、状态）
- **AND** 卡片SHALL包含"详情"按钮

#### Scenario: Mobile details modal
- **GIVEN** 管理员使用移动设备查看日志详情
- **WHEN** 详情弹窗打开
- **THEN** 弹窗SHALL占据全屏（或接近全屏）
- **AND** 内容SHALL垂直滚动

### Requirement: Admin Page Integration

系统SHALL将事件日志管理组件集成到管理后台页面，作为新的标签页。

#### Scenario: Add event log tab to admin page
- **GIVEN** 管理员登录并访问管理后台页面
- **WHEN** 页面加载
- **THEN** 侧边栏菜单SHALL显示"事件日志"标签
- **AND** 标签SHALL使用合适的图标（如FiList或FiActivity）

#### Scenario: Switch to event log tab
- **GIVEN** 管理员在管理后台页面的其他标签（如用户管理）
- **WHEN** 管理员点击"事件日志"标签
- **THEN** 系统SHALL切换到事件日志管理组件
- **AND** 系统SHALL加载默认的日志列表

#### Scenario: Access control
- **GIVEN** 用户未登录或不是管理员
- **WHEN** 用户尝试访问管理后台页面
- **THEN** 系统SHALL拒绝访问（通过AdminRoute组件）
- **AND** 用户无法看到事件日志管理功能

### Requirement: Time Format Handling

系统SHALL正确处理前端和后端之间的时间格式转换，确保时间范围查询的准确性。

#### Scenario: Convert datetime-local to API format
- **GIVEN** 管理员在时间输入框输入"2025-11-22T14:30"
- **WHEN** 系统发送API请求
- **THEN** 系统SHALL将时间格式转换为"2025-11-22T14:30:00"（添加秒位）
- **AND** 系统SHALL使用ISO 8601格式发送给后端

#### Scenario: Display time in local timezone
- **GIVEN** 后端返回UTC时间"2025-11-22T06:30:00Z"
- **WHEN** 系统在日志列表中显示时间
- **THEN** 系统SHALL转换为用户本地时区时间显示
- **AND** 格式SHALL为"YYYY-MM-DD HH:mm:ss"（如"2025-11-22 14:30:00"）

#### Scenario: Validate time range
- **GIVEN** 管理员同时设置了开始时间和结束时间
- **WHEN** 结束时间早于开始时间
- **THEN** 系统SHALL显示验证错误提示"结束时间不能早于开始时间"
- **AND** 系统SHALL禁用查询按钮

### Requirement: Event Type Constants and Labels

系统SHALL定义事件类型和分类的常量，并提供中文标签映射，确保界面显示友好。

#### Scenario: Define event categories
- **GIVEN** 系统初始化
- **WHEN** 加载事件日志管理组件
- **THEN** 系统SHALL定义以下事件分类常量：
  - `auth`: "认证相关"
  - `user`: "用户操作"
  - `resume`: "简历操作"
  - `system`: "系统事件"
  - `payment`: "付费相关"

#### Scenario: Define event types
- **GIVEN** 系统初始化
- **WHEN** 加载事件日志管理组件
- **THEN** 系统SHALL定义所有事件类型常量及其中文标签（如 `user_login`: "用户登录"）

#### Scenario: Display localized labels
- **GIVEN** 管理员查看日志列表
- **WHEN** 系统显示事件分类和事件类型
- **THEN** 系统SHALL显示中文标签，而不是英文常量值
- **AND** 如果某个常量没有对应的中文标签，SHALL显示原始英文值

### Requirement: Performance Optimization

系统SHALL优化性能，确保大量日志数据时仍能流畅运行。

#### Scenario: Debounce search requests
- **GIVEN** 管理员快速多次点击"查询"按钮
- **WHEN** 系统处理查询请求
- **THEN** 系统SHALL使用防抖机制（debounce 300ms）
- **AND** 系统SHALL只发送最后一次有效的查询请求

#### Scenario: Prevent duplicate requests
- **GIVEN** 管理员点击"查询"按钮
- **WHEN** 系统正在等待前一个请求的响应
- **THEN** 系统SHALL禁用查询按钮
- **AND** 系统SHALL忽略新的点击事件

#### Scenario: Limit page size
- **GIVEN** 管理员选择每页显示条数
- **WHEN** 管理员尝试选择超过100条/页
- **THEN** 系统SHALL限制最大值为100条/页
- **AND** 系统SHALL显示提示"最多显示100条/页"

