# Implementation Tasks - Opportunity Management

## 1. Database Schema
- [x] 1.1 新建 `server/model/job_opportunity.go`
- [x] 1.2 定义 `JobOpportunity` GORM model
  - `ID` int64 primary key
  - `Company` string 企业
  - `Title` string 岗位标题
  - `Category` string 方向类别
  - `Location` string 地点
  - `Cadence` string 到岗/实习周期
  - `Summary` string 简介
  - `Responsibilities` JSONB 职责列表
  - `Requirements` JSONB 要求列表
  - `ContactEmail` string 投递邮箱
  - `Note` string 备注
  - `Status` string draft/published/archived
  - `SortOrder` int 排序
  - `CreatedBy` string 管理员用户 ID
  - `CreatedAt`, `UpdatedAt`
- [x] 1.3 在 `server/initialize/db.go` 注册自动迁移
- [x] 1.4 验证 PostgreSQL 表、字段、索引创建成功

## 2. Backend API
- [x] 2.1 新建 service：`server/service/opportunity_service.go`
- [x] 2.2 新建 API handler：`server/api/opportunity/opportunity.go`
- [x] 2.3 新增公开接口 `GET /api/opportunities`
  - 仅返回 `published` 岗位
  - 支持分页和按企业/类别筛选
- [x] 2.4 新增管理员接口
  - `GET /api/admin/opportunities`
  - `POST /api/admin/opportunities`
  - `PUT /api/admin/opportunities/:id`
  - `DELETE /api/admin/opportunities/:id`
  - `POST /api/admin/opportunities/batch`
- [x] 2.5 新增路由文件并接入现有 router
- [x] 2.6 使用统一 API 响应格式和管理员鉴权

## 3. Frontend API and Types
- [x] 3.1 新建 `web/src/types/opportunity.ts`
- [x] 3.2 新建 `web/src/api/opportunity.ts`
- [x] 3.3 将 `web/src/pages/opportunities/Opportunities.tsx` 改为调用公开列表 API
- [x] 3.4 增加加载、空状态、错误状态

## 4. Admin Page
- [x] 4.1 新建 `web/src/pages/admin/components/OpportunityManagement.tsx`
- [x] 4.2 提供岗位列表、搜索/筛选、分页
- [x] 4.3 提供新增/编辑弹窗或表单
- [x] 4.4 职责、要求支持多行文本输入并转换为数组
- [x] 4.5 提供发布/下架/删除操作
- [x] 4.6 接入 `web/src/pages/admin/Administrator.tsx` 管理后台标签页

## 5. Seed and Migration
- [x] 5.1 将当前三条静态岗位信息写入种子脚本或后端初始化脚本
- [x] 5.2 确认爱奇艺、滴滴、小红书三条记录可通过 API 返回

## 6. Validation
- [x] 6.1 `go build -o server .`
- [x] 6.2 `pnpm build`
- [x] 6.3 curl 验证公开列表 API
- [x] 6.4 curl 验证管理员创建/批量上传 API
- [x] 6.5 浏览器验证实习机会页和管理后台页面
