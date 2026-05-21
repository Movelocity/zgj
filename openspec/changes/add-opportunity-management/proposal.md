# Change: Add Opportunity Management

## Why

当前首页“实习机会”内容是前端静态写死，无法通过后台页面或 API 持续维护。需要将岗位信息持久化到 PostgreSQL，并提供管理员后台录入页面和 API，方便后续批量新增、编辑、上下架和前端展示。

## What Changes

- 新增 PostgreSQL 表 `job_opportunities`，按现有页面分类存储岗位信息：
  - 企业、岗位、方向类别、地点、到岗要求、职责、任职要求、联系方式、备注、状态、排序等字段
  - 职责和要求使用 JSONB 数组，便于页面结构化展示和 API 批量写入
- 新增后端 REST API：
  - 公开列表接口，用于首页/实习机会页展示已发布岗位
  - 管理员列表、创建、更新、删除/上下架接口
  - 支持 JSON API 上传单条或批量岗位
- 新增管理员后台页面：
  - 岗位列表
  - 新增/编辑岗位表单
  - 职责与要求支持多行输入并自动拆分
  - 发布/下架状态切换
- 将当前静态“实习机会”页面改为从 API 拉取数据，并保留空状态和错误提示。

## Impact

**Affected specs**:
- `opportunity-management` (new capability)

**Affected code**:
- `server/model/job_opportunity.go` (new)
- `server/initialize/db.go` (modified, auto migrate)
- `server/service/opportunity_service.go` (new)
- `server/api/opportunity/opportunity.go` (new)
- `server/router/opportunity.go` and `server/router/enter.go` (new/modified)
- `web/src/types/opportunity.ts` (new)
- `web/src/api/opportunity.ts` (new)
- `web/src/pages/opportunities/Opportunities.tsx` (modified)
- `web/src/pages/admin/components/OpportunityManagement.tsx` (new)
- `web/src/pages/admin/Administrator.tsx` and component exports (modified)

## Non-Goals

- 不做用户端投递追踪和投递状态管理。
- 不做邮件发送或简历自动投递。
- 不做复杂审核流；仅支持管理员创建、编辑、发布、下架。
- 不做第三方招聘平台同步。
