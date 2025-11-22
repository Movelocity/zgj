# Design Document - Admin Event Log Viewer UI

## Context

系统已经实现了完整的事件日志后端功能（通过 `add-user-event-log` change），包括：
- 事件记录服务
- 查询API（`GET /api/admin/event-logs`）
- 支持多种筛选条件和时间范围查询

现在需要为管理员提供前端界面，让他们能够方便地查看和分析这些日志数据。用户的主要诉求是**按时间范围查询日志**，这是最常用的查询场景。

### Stakeholders
- **管理员用户**：需要查看系统事件日志，监控用户行为，排查问题
- **系统运维人员**：需要分析日志数据，了解系统使用情况
- **开发团队**：需要查看错误日志，定位和修复bug

## Goals / Non-Goals

### Goals
1. 提供直观的事件日志查看界面
2. **核心功能**：支持按时间范围快速查询日志
3. 支持多种筛选条件组合查询（用户、事件类型、状态等）
4. 支持分页浏览大量日志数据
5. 提供详情查看功能，展示完整的事件信息
6. 保持与现有管理界面的一致性（用户体验、代码风格）

### Non-Goals
1. 不实现实时日志监控（自动刷新）
2. 不实现日志数据导出（CSV/Excel）
3. 不实现日志统计分析图表
4. 不实现日志数据的修改或删除功能
5. 不实现日志告警和通知功能

## Decisions

### 1. Component Architecture

**Decision**: 采用单一大组件 `EventLogManagement.tsx` 而不是多个小组件

**Rationale**:
- 参考现有的 `UserManagement.tsx` 和 `FileManagement.tsx` 的模式
- 事件日志查看是相对独立的功能，不需要复杂的组件嵌套
- 单一组件更容易维护状态管理（筛选条件、分页、数据）
- 如果未来需要，可以轻松重构为多个子组件

**Alternatives considered**:
- 将筛选器、表格、详情弹窗拆分为独立组件：增加了复杂度，但对当前需求来说过度设计

### 2. Time Range Filter UI

**Decision**: 使用原生 `<input type="datetime-local">` + 快捷按钮组合

**Rationale**:
- `datetime-local` 是HTML5标准，浏览器原生支持，无需额外依赖
- 提供快捷按钮（今天、最近7天、最近30天）覆盖常用场景
- 符合项目"简单优先"的原则，不引入日期选择器库
- 用户可以手动输入精确时间，也可以使用快捷按钮

**Alternatives considered**:
- 引入第三方日期选择器库（如 react-datepicker）：增加bundle size，对当前需求来说不必要
- 只提供快捷按钮：灵活性不足，无法查询自定义时间范围

### 3. Event Type Filter Cascading

**Decision**: 事件类型筛选根据选中的事件分类动态显示

**Rationale**:
- 事件类型较多（13+种），分类后更易查找
- 符合事件日志的层级结构（Category -> Type）
- 避免长列表导致选择困难

**Flow**:
1. 用户先选择事件分类（auth、user、resume、system、payment）
2. 事件类型下拉框动态显示该分类下的所有类型
3. 如果未选择分类，显示所有事件类型

**Alternatives considered**:
- 扁平化显示所有事件类型：列表过长，用户体验差
- 多级联动选择器：对当前场景过度复杂

### 4. Details Field Display

**Decision**: 在详情弹窗中使用格式化的JSON展示 `details` 字段

**Rationale**:
- `details` 是JSONB类型，结构不固定，无法预定义渲染方式
- JSON格式化展示最通用，适合任何数据结构
- 管理员用户具备基本的技术背景，能够理解JSON格式

**Implementation**:
```typescript
<pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
  <code>{JSON.stringify(details, null, 2)}</code>
</pre>
```

**Alternatives considered**:
- 尝试解析并表格化展示：过度复杂，不同事件类型的details结构差异大
- 直接显示原始字符串：可读性差

### 5. Pagination Strategy

**Decision**: 使用传统的页码分页（Page-based pagination）

**Rationale**:
- 后端API已经实现了page/page_size的分页方式
- 事件日志是历史数据，不需要无限滚动
- 用户需要能够跳转到特定页码，便于定位问题
- 参考 `UserManagement` 的分页实现

**Features**:
- 显示总记录数和当前页码
- 上一页/下一页按钮
- 每页条数可选（10/20/50/100）

**Alternatives considered**:
- 无限滚动（Infinite scroll）：不适合需要精确定位的日志查看场景
- 游标分页（Cursor-based）：后端未实现，需要额外开发

### 6. Mobile Responsiveness

**Decision**: 在移动端使用卡片式布局替代表格

**Rationale**:
- 表格在窄屏下体验差（需要横向滚动）
- 卡片式布局更适合移动端触控操作
- 参考 `UserManagement` 在移动端的处理方式

**Implementation**:
```tsx
{/* 桌面端：表格 */}
<div className="hidden md:block">
  <table>...</table>
</div>

{/* 移动端：卡片列表 */}
<div className="md:hidden">
  {logs.map(log => (
    <div className="border rounded-lg p-4 mb-2">...</div>
  ))}
</div>
```

### 7. State Management

**Decision**: 使用本地组件state（useState），不使用全局状态管理

**Rationale**:
- 事件日志数据不需要跨组件共享
- 避免全局状态污染
- 参考现有管理组件的模式（UserManagement、FileManagement都使用本地state）

**State structure**:
```typescript
const [logs, setLogs] = useState<EventLog[]>([]);
const [loading, setLoading] = useState(false);
const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
const [filters, setFilters] = useState<EventLogQueryParams>({});
const [selectedLog, setSelectedLog] = useState<EventLog | null>(null);
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
```

## Technical Patterns

### 1. API Client Pattern

遵循项目的API客户端模式：

```typescript
// web/src/api/eventlog.ts
import { request } from '@/utils/request';

export const eventLogAPI = {
  queryEventLogs: (params: EventLogQueryParams) => {
    return request.get('/api/admin/event-logs', { params });
  },
};
```

### 2. Type Safety

确保完整的TypeScript类型定义：

```typescript
// web/src/types/eventlog.ts
export interface EventLog {
  id: number;
  created_at: string;
  user_id: string;
  event_type: string;
  event_category: string;
  ip_address: string;
  user_agent: string;
  resource_type?: string;
  resource_id?: string;
  status: string;
  error_message?: string;
  details: Record<string, any> | null;
}

export interface EventLogQueryParams {
  page?: number;
  page_size?: number;
  user_id?: string;
  event_type?: string;
  event_category?: string;
  status?: string;
  start_time?: string; // ISO 8601 format: 2006-01-02T15:04:05
  end_time?: string;   // ISO 8601 format: 2006-01-02T15:04:05
}

export interface EventLogQueryResponse {
  list: EventLog[];
  total: number;
  page: number;
  page_size: number;
}
```

### 3. Time Format Handling

前端和后端之间的时间格式转换：

**Frontend (datetime-local input)**: `2025-11-22T14:30` (HTML5 input value)
**Backend expects**: `2025-11-22T14:30:00` (ISO 8601 format: `2006-01-02T15:04:05`)

**Conversion**:
```typescript
const formatDateTimeForAPI = (datetimeLocal: string): string => {
  if (!datetimeLocal) return '';
  // datetime-local返回格式：2025-11-22T14:30
  // 后端期望格式：2025-11-22T14:30:00
  return datetimeLocal + ':00'; // Add seconds
};
```

**Note**: 后端的 `time_format:"2006-01-02T15:04:05"` 使用Gin的绑定格式，前端需要确保发送的时间字符串符合此格式。

### 4. Error Handling

统一的错误处理模式：

```typescript
try {
  setLoading(true);
  const response = await eventLogAPI.queryEventLogs(params);
  if (response.code === 0) {
    setLogs(response.data.list || []);
    setPagination(prev => ({ ...prev, total: response.data.total }));
  } else {
    showError(response.msg || '加载日志失败');
  }
} catch (error) {
  console.error('加载日志失败:', error);
  showError('加载日志失败，请重试');
} finally {
  setLoading(false);
}
```

## UI/UX Considerations

### 1. Filter Section Layout

```
+--------------------------------------------------+
| [时间范围] 开始: [________] 结束: [________]      |
|           [今天] [最近7天] [最近30天] [清除]     |
| [用户ID]  [________]                             |
| [分类]    [下拉选择 ▼]                           |
| [类型]    [下拉选择 ▼]                           |
| [状态]    [下拉选择 ▼]                           |
|                          [查询] [重置]           |
+--------------------------------------------------+
```

### 2. Table Layout

| 时间 | 用户ID | 分类 | 事件类型 | 状态 | IP地址 | 操作 |
|------|--------|------|----------|------|---------|------|
| 2025-11-22 14:30:25 | user_xxx | 认证相关 | 用户登录 | 🟢成功 | 192.168.1.1 | [详情] |

### 3. Color Coding for Status

- **success**: 绿色背景 `bg-green-100 text-green-800`
- **failed**: 红色背景 `bg-red-100 text-red-800`
- **error**: 橙色背景 `bg-orange-100 text-orange-800`

### 4. Loading States

- 初始加载：显示skeleton或spinner
- 分页切换：表格内容区域显示半透明遮罩
- 筛选查询：查询按钮显示loading状态

## Performance Considerations

### 1. Rendering Optimization

- 使用分页限制每页数据量（默认20条，最大100条）
- 详情弹窗使用懒加载，只在打开时渲染
- 避免在循环中使用复杂计算，预处理数据

### 2. Network Optimization

- 查询按钮添加防抖（debounce 300ms）
- 避免重复请求：在loading状态时禁用查询按钮
- 缓存当前查询参数，避免不必要的重新请求

### 3. Memory Management

- 切换到其他管理标签时，不会卸载组件（由Administrator.tsx控制）
- 不需要特别的cleanup逻辑
- 大量日志数据时，只保留当前页数据在state中

## Risks / Trade-offs

### Risk 1: Time Zone Handling

**Risk**: 用户本地时区与服务器时区不一致，可能导致查询结果偏差

**Mitigation**:
- 使用浏览器本地时区（datetime-local默认行为）
- 在API请求中发送ISO 8601格式（包含时区信息）
- 后端存储UTC时间，前端显示时转换为本地时间

### Risk 2: Large Dataset Performance

**Risk**: 如果日志数据量很大（10万+条），查询和渲染可能变慢

**Mitigation**:
- 依赖后端分页和索引优化
- 前端限制每页最大100条
- 如果性能问题严重，考虑添加虚拟滚动（后续优化）

### Risk 3: Details Field Complexity

**Risk**: details字段可能包含非常复杂或大量数据，影响显示性能

**Mitigation**:
- 在详情弹窗中显示，避免在列表中渲染
- 对超长JSON字符串进行截断提示
- 使用 `<pre>` 标签的 `overflow-x-auto` 处理横向溢出

### Trade-off 1: Simple vs Feature-rich

**Decision**: 先实现简单版本，后续根据反馈迭代

**Rationale**:
- 当前方案满足核心需求（时间范围查询）
- 避免过度设计和不必要的复杂度
- 快速交付，获取用户反馈

**Future enhancements**:
- 日志导出功能
- 统计分析图表
- 实时日志监控
- 高级搜索（全文检索）

## Migration Plan

无需数据迁移，纯新增前端功能。

**Deployment steps**:
1. 合并代码到main分支
2. 前端重新构建（`pnpm build`）
3. 部署到生产环境
4. 通知管理员用户新功能上线

**Rollback plan**:
- 如果出现严重问题，可以直接回滚前端代码
- 只影响前端显示，不影响后端日志记录功能
- 低风险：纯新增功能，不修改现有代码

## Open Questions

1. **Q**: 是否需要支持日志数据的自动刷新（轮询）？
   **A**: 暂不需要，按需手动刷新即可。如果用户有强烈需求，可以后续添加。

2. **Q**: 详情弹窗中的details字段，是否需要更友好的展示方式？
   **A**: 目前使用JSON格式展示，如果特定事件类型需要特殊处理，可以后续针对性优化。

3. **Q**: 是否需要记住用户的筛选条件（localStorage）？
   **A**: 暂不需要，每次进入页面使用默认筛选条件。如果用户反馈需要，可以后续添加。

4. **Q**: 移动端的卡片布局是否需要显示所有字段？
   **A**: 优先显示核心字段（时间、用户、事件类型、状态），其他字段通过详情按钮查看。

## References

- Backend API: `server/api/eventlog/event_log.go`
- Backend types: `server/service/eventlog/types.go`
- Existing admin component: `web/src/pages/admin/components/UserManagement.tsx`
- Project conventions: `openspec/project.md`
- Related change: `openspec/changes/add-user-event-log/`

