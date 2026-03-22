# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

职管加（Resume Polisher）是一款基于 AI 的智能简历优化平台，包含三个服务：
- **后端**：Go REST API（`server/`）— Gin + GORM + PostgreSQL
- **前端**：React SPA（`web/`）— React 19 + Vite + TypeScript + Tailwind CSS
- **PDF 导出服务**：Node.js 服务（`pdfexport-service/`）— 使用 Puppeteer 将简历渲染为 PDF

## 常用命令

```bash
# 安装依赖
make install

# 开发模式（前端 :5173，后端 :8888）
make dev          # 同时启动两个服务
make webdev       # 仅启动前端
cd server && go run main.go  # 仅启动后端

# 生产构建与运行（统一服务 :8888）
make build
make run

# 前端代码检查
cd web && pnpm lint

# 清理构建产物
make clean
```

项目目前没有配置自动化测试框架。后端测试使用 Postman/curl，前端测试使用浏览器开发者工具。

## 架构说明

### 后端（`server/`）

分层架构：`api/` → `service/` → `model/` → 数据库

- 路由分为三类：公共路由（无需认证）、私有路由（需要 JWT）、管理员路由（需要 JWT + role 888）
- 错误响应统一使用 `utils.FailWithMessage()`；成功响应使用 `utils.OkWithData()`
- GORM 在启动时自动迁移 Schema — **不要创建原始 SQL 迁移文件**
- 使用内存缓存代替 Redis
- 配置文件为 `server/config.yaml`（从 `server/config.example.yaml` 复制）

### 前端（`web/src/`）

- `api/` — Axios HTTP 请求封装
- `store/` — Zustand 全局状态管理
- `components/` — 可复用 UI 组件；基础原语组件在 `components/ui/`
- `pages/` — 路由级页面组件（懒加载）
- `types/` — 所有 TypeScript 类型定义；API 类型在 `types/api`
- `utils/toast` — 通知工具：`showSuccess`、`showError`、`showWarning`、`showInfo`

### API 响应格式

所有响应遵循统一格式：
```json
{ "code": 0, "data": {}, "msg": "操作成功" }
```
**`code == 0` 表示成功**，与 HTTP 状态码无关。`code` 非零时均为错误。

## 关键约定

### 前端
- 包管理器：**只用 pnpm**（不使用 npm 或 yarn）
- 路径别名：`@/` 映射到 `src/`，禁止使用 `../../` 相对路径导入
- 样式：只用 Tailwind CSS，不写自定义 CSS
- 模态框遮罩：使用 `bg-black/50`，不使用 `bg-opacity-50`
- 启用 TypeScript 严格模式，禁止使用 `any`
- 只使用函数式组件，禁止类组件
- 图标库：`react-icons`

### 后端
- 文件命名：`snake_case`（如 `user_service.go`）
- 结构体/函数命名：`PascalCase`
- 日志使用 Zap 结构化日志

### Git
- 提交信息使用中文描述
- 主分支为 `main`

## 业务核心概念

- **简历（Resume）**：有唯一 `tlid`（时间有序 ID），支持版本管理，存储格式包括源文件、纯文本和 JSON
- **工作流（Workflow）**：可配置的 AI 处理流程，通过 HTTP API 与外部服务（如 Dify）集成
- **用户角色**：`666` = 普通用户，`888` = 管理员
- **认证**：主要方式为手机号 + 短信验证码（首次登录自动注册）；Token 存储在 `localStorage` 的 `console_token` 字段，有效期 7 天
- **站点变量（Site Variable）**：管理员可配置的键值对（工作流 ID、系统提示等）

## 外部依赖服务

- **Dify**：AI 工作流执行（按工作流配置，使用 API Key 认证）
- **火山引擎（Volcengine）**：TOS 对象存储 + ASR 语音识别
- **阿里云 / Spug**：短信验证码服务
- **PDF 导出服务**：Node.js 服务运行在 `:3001`（由 Go 后端调用）
