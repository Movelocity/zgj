# 简历润色工具 - 部署指南

## 概述

本项目采用 Go 后端 + React 前端的架构，支持将前端静态文件集成到后端服务器中，实现单一服务器部署。

## 架构说明

- **后端服务器 (Go + Gin)**: 提供 API 服务和静态文件服务
- **前端应用 (React + Vite)**: 构建为静态文件，由后端服务器提供服务
- **路由分离**:
  - `/api/*` - 后端 API 路由
  - 其他所有路由 - 前端 SPA 路由

## 快速部署

### 前期准备

请确保安装了前端开发工具 npm 和 pnpm

### 1. 构建项目

```bash
# 在项目根目录运行
./build.sh
```

这个脚本会：
- 构建前端静态文件到 `web/dist/`
- 构建后端可执行文件到 `server/resume-polisher`

### 2. 启动服务器

```bash
# 方式1：使用部署脚本（推荐）
cd server
./deploy.sh

# 方式2：直接运行
cd server
go run main.go

# 方式3：使用构建的可执行文件
cd server
./resume-polisher
```

### 3. 访问应用

- 应用首页: http://localhost:8888
- API 接口: http://localhost:8888/api
- 管理后台: http://localhost:8888/administrator

## 配置说明

### 服务器配置 (`server/config.yaml`)

```yaml
server:
  port: 8888
  mode: "debug"
  static-path: "../web/dist"  # 前端静态文件路径

cors:
  mode: "strict-whitelist"
  whitelist:
    # 开发环境
    - allow-origin: "http://localhost:3000"
      # ... 其他配置
    # 生产环境
    - allow-origin: "http://localhost:8888"
      # ... 其他配置
```

### 前端配置

前端使用环境变量配置 API 基础 URL：

- **开发环境**: `VITE_API_BASE_URL=http://localhost:8888`
- **生产环境**: `VITE_API_BASE_URL=` (空值，使用相对路径)

## 开发模式

### 前端开发

```bash
cd web
npm run dev
```

前端开发服务器会在 http://localhost:3000 运行，API 请求会代理到后端服务器。

### 后端开发

```bash
cd server
go run main.go
```

后端服务器在 http://localhost:8888 运行。

## 生产部署

### 1. 环境要求

- Go 1.21+
- Node.js 18+
- PostgreSQL 数据库

### 2. 部署步骤

1. **克隆代码**:
   ```bash
   git clone <repository-url>
   cd resume-polisher
   ```

2. **安装依赖**:
   ```bash
   # 前端依赖
   cd web
   npm install
   cd ..
   
   # 后端依赖
   cd server
   go mod download
   cd ..
   ```

3. **配置环境**:
   - 修改 `server/config.yaml` 中的数据库配置
   - 根据需要修改端口和其他配置

4. **构建和部署**:
   ```bash
   ./build.sh
   cd server
   ./deploy.sh
   ```

### 3. 生产环境配置建议

- 将 `server.mode` 设置为 `"release"`
- 配置适当的 CORS 白名单
- 设置合适的日志级别
- 配置数据库连接池参数
- 考虑使用反向代理 (Nginx) 进行负载均衡

## 故障排除

### 1. 静态文件无法加载

检查 `server/config.yaml` 中的 `static-path` 配置是否正确指向 `web/dist` 目录。

### 2. API 请求失败

确认 CORS 配置包含了正确的源地址。

### 3. 路由问题

- 前端路由 (如 `/profile`, `/resume/123`) 应该返回 `index.html`
- API 路由 (如 `/api/user/login`) 应该返回 JSON 响应
- 检查 `router.go` 中的 `NoRoute` 处理逻辑

### 4. 构建失败

确保：
- Node.js 和 npm 版本兼容
- Go 版本 1.21+
- 所有依赖都已正确安装

## 目录结构

```
resume-polisher/
├── build.sh              # 构建脚本
├── DEPLOYMENT.md          # 部署文档
├── server/
│   ├── deploy.sh         # 服务器部署脚本
│   ├── main.go           # 服务器入口
│   ├── config.yaml       # 服务器配置
│   └── ...
├── web/
│   ├── dist/             # 构建输出目录
│   ├── src/              # 前端源码
│   ├── package.json      # 前端依赖
│   └── ...
└── ...
```
