# Change: 添加后端PDF导出服务

## Why

当前的PDF导出功能完全在客户端浏览器中执行，存在以下限制：
1. **渲染一致性问题**：不同浏览器的打印引擎和CSS支持差异导致导出效果不一致
2. **客户端性能限制**：长简历或复杂排版在客户端渲染慢，影响用户体验
3. **缺乏服务端记录**：无法追踪用户的导出历史和状态
4. **无法实现高级功能**：如批量导出、定时导出、导出队列管理等

需要实现一个后端PDF导出服务，使用无头浏览器（Puppeteer）在服务端生成PDF，确保输出质量一致、可追溯、可扩展。

## What Changes

- **数据库层**：
  - 新增 `pdf_export_tasks` 表存储导出任务状态
  - 字段包括：任务ID、用户ID、简历ID、状态（pending/processing/completed/failed）、PDF文件路径、错误信息、创建/完成时间等
  
- **Go后端**：
  - 新增 `/api/resume/export/create` API：创建导出任务，保存简历快照
  - 新增 `/api/resume/export/status/:taskId` API：查询任务状态和结果
  - 新增 `/api/resume/export/download/:taskId` API：下载生成的PDF文件
  - 新增 `/api/resume/export/callback` API：接收Node.js服务的回调
  - 实现内存队列系统：接收任务并推送到队列
  - 实现消费者协程：从队列取任务，调用Node.js服务
  - 新增 `model/pdf_export_task.go` 模型
  - 新增 `service/pdfexport/` 服务模块

- **Node.js子项目**：
  - 创建独立的 `server/pdfexport-service/` 目录
  - 使用 Express + Puppeteer 实现PDF生成服务
  - 提供 `/generate` API：接收渲染URL，使用Puppeteer生成PDF
  - PDF生成完成后，通过HTTP POST将文件和结果回传给Go后端
  - 支持超时控制、错误处理、资源清理

- **渲染页面**：
  - 创建 `web/src/pages/export/ResumeExportView.tsx`：独立的简历渲染页面
  - 路由：`/export/:taskId`，获取任务关联的简历数据并渲染
  - 页面样式优化：适配A4打印，去除交互元素
  - 无需登录即可访问（通过一次性token验证）

- **前端集成**：
  - 在 `ResumeDetails.tsx` 添加"服务端导出"选项
  - 点击后调用创建任务API，获取任务ID
  - 轮询任务状态，显示进度（排队中/生成中/已完成）
  - 完成后提供下载链接

## Impact

- **Affected specs**: 
  - 新建 `pdf-export` 能力
  
- **Affected code**:
  - **Backend**: 
    - `server/model/pdf_export_task.go` (新建)
    - `server/service/pdfexport/` (新建目录)
    - `server/api/resume/resume.go` (扩展)
    - `server/router/resume.go` (扩展)
    - `server/initialize/db.go` (添加模型迁移)
  - **Node.js Service**:
    - `server/pdfexport-service/` (新建完整子项目)
    - `server/pdfexport-service/package.json`
    - `server/pdfexport-service/src/server.js`
  - **Frontend**:
    - `web/src/pages/export/ResumeExportView.tsx` (新建)
    - `web/src/pages/editor/ResumeDetails.tsx` (添加导出选项)
    - `web/src/api/pdfExport.ts` (新建)
    - `web/src/router/index.tsx` (添加路由)
  - **Database**:
    - 新表 `pdf_export_tasks`
  
- **Breaking changes**: 无（纯新增功能）

- **Migration**: 
  - 数据库自动迁移（通过GORM AutoMigrate）
  - Node.js服务需要单独部署和配置
  - 需要在 `config.yaml` 添加Node.js服务地址配置

- **Dependencies**:
  - Node.js 18+ (运行环境)
  - Puppeteer (npm包)
  - Express (npm包)
  - Multer (npm包，用于文件上传)
  - Form-data (Go包，用于HTTP POST文件)

