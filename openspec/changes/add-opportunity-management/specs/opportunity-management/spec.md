# Capability: Opportunity Management

## Overview

系统提供实习/岗位机会的结构化管理能力，将岗位信息持久化到 PostgreSQL，并支持管理员通过后台页面或 API 创建、更新、发布、下架岗位，用户端页面通过公开 API 展示已发布岗位。

## ADDED Requirements

### Requirement: Job Opportunity Persistence

系统 SHALL 使用 PostgreSQL 持久化岗位机会信息，并按企业、岗位、类别、地点、职责、要求、联系方式等分类存储。

#### Scenario: Create table on server startup
- **GIVEN** 后端服务启动并执行 GORM 自动迁移
- **WHEN** `job_opportunities` 表不存在
- **THEN** 系统 SHALL 创建 `job_opportunities` 表
- **AND** 表 SHALL 包含企业、岗位、类别、地点、到岗要求、简介、职责、任职要求、投递邮箱、备注、状态、排序、创建人、创建时间和更新时间字段
- **AND** 职责和任职要求 SHALL 使用 JSONB 数组存储

#### Scenario: Store one opportunity
- **GIVEN** 管理员提交一条岗位机会
- **WHEN** 后端校验通过
- **THEN** 系统 SHALL 将岗位机会写入 `job_opportunities`
- **AND** 默认状态 SHALL 为 `published`，除非请求明确指定为 `draft`

### Requirement: Public Opportunity API

系统 SHALL 提供公开岗位列表 API，供首页导航中的实习机会页面展示已发布岗位。

#### Scenario: List published opportunities
- **GIVEN** 数据库中存在 draft、published 和 archived 状态的岗位
- **WHEN** 用户访问 `GET /api/opportunities`
- **THEN** 系统 SHALL 仅返回 `published` 状态岗位
- **AND** 返回结果 SHALL 按 `sort_order` 升序、`created_at` 降序排列

#### Scenario: Filter by company or category
- **GIVEN** 用户访问公开岗位列表 API
- **WHEN** 请求包含 `company` 或 `category` 查询参数
- **THEN** 系统 SHALL 返回匹配企业或类别的已发布岗位

### Requirement: Admin Opportunity API

系统 SHALL 提供管理员岗位管理 API，支持列表、创建、更新、删除/下架和批量上传。

#### Scenario: Admin creates an opportunity
- **GIVEN** 管理员已登录
- **WHEN** 管理员调用 `POST /api/admin/opportunities` 并提交合法岗位 JSON
- **THEN** 系统 SHALL 创建岗位记录
- **AND** 响应 SHALL 使用统一格式 `{ "code": 0, "data": ..., "msg": "..." }`

#### Scenario: Reject unauthenticated upload
- **GIVEN** 用户未登录或不是管理员
- **WHEN** 用户调用管理员岗位上传 API
- **THEN** 系统 SHALL 返回未授权或无权限错误
- **AND** 系统 SHALL 不创建岗位记录

#### Scenario: Admin batch uploads opportunities
- **GIVEN** 管理员已登录
- **WHEN** 管理员调用 `POST /api/admin/opportunities/batch` 并提交岗位数组
- **THEN** 系统 SHALL 批量创建岗位
- **AND** 任一岗位校验失败时，系统 SHALL 返回失败原因

#### Scenario: Admin updates opportunity status
- **GIVEN** 管理员已登录且岗位存在
- **WHEN** 管理员将岗位状态更新为 `archived`
- **THEN** 系统 SHALL 保存状态变更
- **AND** 公开 API SHALL 不再返回该岗位

### Requirement: Admin Opportunity Page

系统 SHALL 在管理后台提供岗位管理页面，用于维护实习机会内容。

#### Scenario: Admin views opportunity list
- **GIVEN** 管理员进入管理后台
- **WHEN** 管理员打开“实习机会”标签页
- **THEN** 系统 SHALL 展示岗位列表
- **AND** 每条岗位 SHALL 显示企业、岗位、类别、地点、状态、更新时间和操作按钮

#### Scenario: Admin creates opportunity from form
- **GIVEN** 管理员在岗位管理页面
- **WHEN** 管理员填写企业、岗位、类别、地点、职责、要求、联系方式并提交
- **THEN** 系统 SHALL 调用管理员创建 API
- **AND** 创建成功后 SHALL 刷新列表并显示成功提示

#### Scenario: Multi-line responsibilities and requirements
- **GIVEN** 管理员在表单中输入多行职责或要求
- **WHEN** 管理员提交表单
- **THEN** 前端 SHALL 将每个非空行转换为数组元素
- **AND** 后端 SHALL 将数组保存到 JSONB 字段

### Requirement: User Opportunity Page Uses API

系统 SHALL 将用户端实习机会页面的数据来源从静态数组改为公开 API。

#### Scenario: Display opportunities from API
- **GIVEN** 公开 API 返回岗位列表
- **WHEN** 用户打开 `/opportunities`
- **THEN** 页面 SHALL 展示 API 返回的岗位
- **AND** 页面 SHALL 保留企业、类别、地点/到岗、职责、要求、联系方式和备注分组

#### Scenario: Display empty state
- **GIVEN** 公开 API 返回空列表
- **WHEN** 用户打开 `/opportunities`
- **THEN** 页面 SHALL 显示暂无实习机会的空状态提示

#### Scenario: Display loading and error states
- **GIVEN** 用户打开 `/opportunities`
- **WHEN** API 请求进行中
- **THEN** 页面 SHALL 显示加载状态
- **WHEN** API 请求失败
- **THEN** 页面 SHALL 显示错误提示并允许用户重试
