# Implementation Tasks - Admin Event Log Viewer UI

## 1. Frontend Type Definitions
- [x] 1.1 创建 `web/src/types/eventlog.ts`
  - [x] 定义 `EventLog` 接口（与后端model.EventLog对应）
    - id: number (后端int64)
    - created_at: string (ISO 8601格式)
    - user_id: string
    - event_type: string
    - event_category: string
    - ip_address: string (注意：后端是ip_address，不是ip)
    - user_agent: string
    - resource_type?: string (可选)
    - resource_id?: string (可选)
    - status: string
    - error_message?: string (可选)
    - details: Record<string, any> | null (后端JSONB类型)
  - [x] 定义 `EventLogQueryParams` 接口（与后端QueryRequest对应）
    - page?: number
    - page_size?: number
    - user_id?: string
    - event_type?: string
    - event_category?: string
    - status?: string
    - start_time?: string (ISO 8601: 2006-01-02T15:04:05)
    - end_time?: string (ISO 8601: 2006-01-02T15:04:05)
  - [x] 定义 `EventLogQueryResponse` 接口（与后端QueryResponse对应）
    - list: EventLog[]
    - total: number
    - page: number
    - page_size: number
  - [x] 定义事件类型常量（EventType，对应后端eventlog包常量）
  - [x] 定义事件分类常量（EventCategory，对应后端eventlog包常量）
  - [x] 定义状态常量（Status，对应后端eventlog包常量）

## 2. Frontend API Client
- [x] 2.1 创建 `web/src/api/eventlog.ts`
  - [x] 实现 `queryEventLogs(params: EventLogQueryParams)` 方法
  - [x] 设置正确的API路径：`/api/admin/event-logs`
  - [x] 处理时间格式转换（ISO 8601格式）
  - [x] 统一错误处理

## 3. Event Log Management Component
- [x] 3.1 创建 `web/src/pages/admin/components/EventLogManagement.tsx`
  - [x] 实现基础组件结构
  - [x] 实现状态管理（logs列表、pagination、loading、filters）
  - [x] 实现 `loadEventLogs` 函数（调用API）

### 3.2 Filter Section - 筛选区域
- [x] 3.2.1 **时间范围筛选（重点功能）**
  - [x] 开始时间输入框（datetime-local类型）
  - [x] 结束时间输入框（datetime-local类型）
  - [x] 快捷时间范围按钮（今天、最近7天、最近30天）
  - [x] 清除时间范围按钮
- [x] 3.2.2 用户ID筛选
  - [x] 用户ID输入框
- [x] 3.2.3 事件分类筛选
  - [x] 下拉选择框（全部、auth、user、resume、system、payment）
- [x] 3.2.4 事件类型筛选
  - [x] 下拉选择框（根据选中的分类动态显示相关事件类型）
- [x] 3.2.5 状态筛选
  - [x] 下拉选择框（全部、success、failed、error）
- [x] 3.2.6 筛选操作按钮
  - [x] "查询"按钮（应用筛选条件）
  - [x] "重置"按钮（清空所有筛选条件）

### 3.3 Table Display - 表格展示
- [x] 3.3.1 表格列定义
  - [x] 时间列（created_at，格式化显示）
  - [x] 用户ID列（user_id）
  - [x] 事件分类列（event_category，显示中文标签）
  - [x] 事件类型列（event_type，显示中文标签）
  - [x] 状态列（status，带颜色标识：success=绿色、failed=红色、error=橙色）
  - [x] IP地址列（ip_address）
  - [x] 操作列（查看详情按钮）
- [x] 3.3.2 空状态处理
  - [x] 无数据时显示友好提示
- [x] 3.3.3 加载状态
  - [x] 加载时显示loading指示器

### 3.4 Details Modal - 详情弹窗
- [x] 3.4.1 实现详情弹窗组件
  - [x] 显示事件基本信息（ID、时间、用户、类型、状态等）
  - [x] 显示IP地址（ip_address）和User Agent
  - [x] 显示资源信息（resource_type、resource_id，如果有）
  - [x] 显示错误信息（error_message，如果状态为failed或error）
  - [x] 显示Details字段（格式化的JSON显示，处理null情况）
  - [x] 关闭按钮

### 3.5 Pagination - 分页
- [x] 3.5.1 实现分页组件
  - [x] 显示总记录数
  - [x] 显示当前页码
  - [x] 上一页/下一页按钮
  - [x] 页码选择器（如果需要）
  - [x] 每页条数选择器（10/20/50/100）

## 4. Integration with Admin Page
- [x] 4.1 修改 `web/src/pages/admin/components/index.ts`
  - [x] 导出 `EventLogManagement` 组件
- [x] 4.2 修改 `web/src/pages/admin/Administrator.tsx`
  - [x] 在 `TabType` 中添加 `'eventlogs'` 类型
  - [x] 在 `tabs` 数组中添加"事件日志"标签（使用 FiList 或 FiActivity 图标）
  - [x] 在 `renderContent()` 中添加 `EventLogManagement` 组件的渲染

## 5. Styling and UX
- [x] 5.1 响应式设计
  - [x] 确保组件在移动端正常显示（筛选区域可折叠）
  - [x] 表格在窄屏下可水平滚动或卡片式展示
- [x] 5.2 交互优化
  - [x] 查询按钮添加防抖（避免频繁请求）
  - [x] 筛选条件变化时显示"重新查询"提示
  - [x] 时间范围验证（结束时间不能早于开始时间）

## 6. Testing and Validation
- [x] 6.1 功能测试
  - [x] 测试时间范围查询（主要功能）
  - [x] 测试各个筛选条件的组合查询
  - [x] 测试分页功能
  - [x] 测试详情查看
  - [x] 测试空状态和错误状态
- [x] 6.2 边界测试
  - [x] 测试无数据情况
  - [x] 测试大量数据情况（100+条）
  - [x] 测试无效时间范围
  - [x] 测试API错误情况
- [x] 6.3 兼容性测试
  - [x] 测试不同浏览器（Chrome、Firefox、Safari）
  - [x] 测试不同屏幕尺寸（桌面、平板、手机）

## Implementation Order

### Phase 1: Foundation (P0)
- Task 1: 类型定义
- Task 2: API客户端

### Phase 2: Core Component (P0)
- Task 3.1-3.3: 基础组件、筛选区域（重点：时间范围）、表格展示

### Phase 3: Details and Integration (P1)
- Task 3.4: 详情弹窗
- Task 3.5: 分页
- Task 4: 集成到管理页面

### Phase 4: Polish and Testing (P1)
- Task 5: 样式和用户体验优化
- Task 6: 测试和验证

## Notes

- 时间范围查询是主要需求，应该放在筛选区域的显著位置
- 参考 `UserManagement.tsx` 的代码结构和模式
- 遵循项目的TypeScript严格模式和代码规范
- 使用 `@/components/ui` 中的通用组件（Button、Input、Modal）
- 使用 `@/utils/toast` 进行消息提示
- Details字段是JSONB，可能包含任意结构，需要安全地解析和显示
- 考虑性能：大量日志数据时避免一次性渲染过多DOM元素

