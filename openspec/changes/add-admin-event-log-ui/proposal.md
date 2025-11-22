# Change: Add Admin Event Log Viewer UI

## Why

管理员需要能够在前端界面查看系统的事件日志，以便监控用户行为、排查问题、分析系统使用情况。目前后端API已经实现（`add-user-event-log` change），但缺少前端管理界面支持。主要诉求是**按时间范围查询日志**，同时支持其他常用筛选条件。

## What Changes

- 创建事件日志API客户端（`web/src/api/eventlog.ts`）
- 创建事件日志类型定义（`web/src/types/eventlog.ts`）
- 创建事件日志管理组件（`web/src/pages/admin/components/EventLogManagement.tsx`）
  - **重点功能**：时间范围选择器（开始时间、结束时间）
  - 用户筛选（用户ID）
  - 事件类型筛选（下拉选择）
  - 事件分类筛选（下拉选择）
  - 状态筛选（成功/失败/错误）
  - 分页展示
  - 详情展开（显示details字段的JSON数据）
- 在管理后台添加"事件日志"标签页

## Impact

**Affected specs**: 
- `admin-event-log-viewer` (new capability)

**Affected code**:
- `web/src/api/eventlog.ts` (new)
- `web/src/types/eventlog.ts` (new)
- `web/src/pages/admin/components/EventLogManagement.tsx` (new)
- `web/src/pages/admin/components/index.ts` (modified - export new component)
- `web/src/pages/admin/Administrator.tsx` (modified - add tab)

**Dependencies**:
- Requires backend API from `add-user-event-log` change (already implemented)
- Follows existing admin UI patterns (UserManagement, FileManagement, etc.)

## Non-Goals

- 不涉及事件日志的自动刷新（实时监控）
- 不涉及日志数据的导出功能（CSV/Excel）
- 不涉及日志数据的统计分析图表
- 不涉及日志数据的删除或修改功能

