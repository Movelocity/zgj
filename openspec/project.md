# Project Context

## Purpose

职管加（Resume Polisher）是一款基于AI技术的智能简历优化平台，专为求职者打造。项目的主要目标包括：

- **智能简历优化**：通过AI技术深度分析简历内容，提供多维度优化建议
- **精准职位匹配**：智能解析JD要求，一键生成定制化简历，提升面试获得率
- **简历管理**：支持简历版本管理、多格式上传（PDF、Word、图片等）、历史记录查看
- **工作流集成**：灵活的工作流配置和执行系统，支持与外部AI服务（如Dify）集成
- **用户管理**：完整的用户认证、权限管理、邀请码系统

项目采用前后端分离架构，前端为React单页应用，后端为Go RESTful API服务。

## Tech Stack

### 前端技术栈
- **框架**: React 19.1 + TypeScript 5.8
- **样式**: Tailwind CSS 4.1
- **状态管理**: Zustand 5.0
- **路由**: React Router v7
- **HTTP客户端**: Axios 1.12
- **构建工具**: Vite 7.1
- **UI组件库**: Headless UI 2.2 + React Icons 5.5 + Lucide React
- **Markdown渲染**: React Markdown 10.1
- **代码检查**: ESLint 9.33 + TypeScript ESLint 8.39
- **包管理**: pnpm

### 后端技术栈
- **语言**: Go 1.21
- **Web框架**: Gin 1.9
- **ORM**: GORM 1.25
- **数据库**: PostgreSQL (通过GORM驱动)
- **认证**: JWT (golang-jwt/jwt/v5)
- **配置管理**: Viper 1.16
- **日志**: Zap 1.24 + Lumberjack
- **加密**: golang.org/x/crypto
- **缓存**: 内存缓存（替代Redis）

### 开发工具
- **前端开发服务器**: Vite Dev Server (端口5173)
- **后端开发服务器**: Gin (端口8888)
- **数据库**: PostgreSQL
- **版本控制**: Git

## Project Conventions

### Code Style

#### 前端代码规范
- **组件风格**: 使用函数式组件 + React Hooks，避免类组件
- **TypeScript**: 启用严格模式（strict: true），所有组件和函数必须有类型定义
- **命名规范**:
  - 组件文件：PascalCase（如 `ResumeEditor.tsx`）
  - 工具函数：camelCase（如 `formatDate`）
  - 常量：UPPER_SNAKE_CASE（如 `API_BASE_URL`）
  - 类型/接口：PascalCase（如 `ApiResponse`）
- **路径别名**: 使用 `@/` 作为 `src/` 的别名
  - `@/components/*` → `src/components/*`
  - `@/pages/*` → `src/pages/*`
  - `@/api/*` → `src/api/*`
  - `@/store/*` → `src/store/*`
  - `@/utils/*` → `src/utils/*`
  - `@/types/*` → `src/types/*`
- **代码格式化**: ESLint自动检查，遵循React Hooks规则
- **注释规范**: 保留有用的参数和方法注释，描述参数和方法的功能

#### 后端代码规范
- **包结构**: 按功能模块划分（api、service、model、router、middleware、utils）
- **命名规范**:
  - 文件：snake_case（如 `user_service.go`）
  - 结构体：PascalCase（如 `User`）
  - 函数：PascalCase（如 `GetUserProfile`）
  - 变量：camelCase（如 `userID`）
- **错误处理**: 统一使用 `utils.FailWithMessage()` 返回错误响应
- **日志记录**: 使用Zap结构化日志，JSON格式输出

#### 样式规范
- **CSS框架**: 使用Tailwind CSS，避免自定义CSS
- **模态框背景**: 使用 `bg-black/50` 而不是 `bg-opacity-50`
- **响应式设计**: 优先使用Tailwind响应式类（sm:, md:, lg:）

### Architecture Patterns

#### 前端架构
- **分层架构**:
  - **API层** (`@/api/`): 封装所有HTTP请求，统一错误处理
  - **状态管理层** (`@/store/`): 使用Zustand管理全局状态
  - **组件层** (`@/components/`): 可复用的UI组件
  - **页面层** (`@/pages/`): 路由对应的页面组件
  - **工具层** (`@/utils/`): 通用工具函数
  - **类型层** (`@/types/`): TypeScript类型定义
- **路由保护**: 
  - `ProtectedRoute`: 需要认证的路由
  - `AdminRoute`: 需要管理员权限的路由
- **懒加载**: 所有页面组件使用React.lazy()进行代码分割
- **错误边界**: 使用ErrorBoundary捕获组件错误
- **API响应处理**: 统一响应格式，`code == 0` 表示成功（与HTTP状态码无关）

#### 后端架构
- **分层架构**:
  - **API层** (`api/`): 处理HTTP请求和响应，参数验证
  - **Service层** (`service/`): 业务逻辑处理
  - **Model层** (`model/`): 数据模型定义和数据库操作
  - **Router层** (`router/`): 路由注册和中间件配置
  - **Middleware层** (`middleware/`): 认证、CORS、日志等中间件
  - **Utils层** (`utils/`): 工具函数（JWT、哈希、文件处理等）
- **路由分组**:
  - **公共路由**: 无需认证（登录、注册、发送短信等）
  - **私有路由**: 需要JWT认证（用户信息、简历管理等）
  - **管理员路由**: 需要JWT认证 + 管理员权限（用户管理、系统配置等）
- **数据库**: 使用GORM进行ORM操作，PostgreSQL作为主数据库
- **缓存**: 使用内存缓存替代Redis（适合中小规模应用）

#### 部署架构
- **单一服务器部署**: 前端构建为静态文件，由Go服务器提供服务
- **路由分离**:
  - `/api/*` → 后端API路由
  - 其他路由 → 前端SPA路由（返回index.html）
- **CORS配置**: 严格白名单模式，支持开发和生产环境

### Testing Strategy

目前项目主要采用手动测试和集成测试：

- **前端测试**: 
  - 开发环境使用Vite热重载进行实时测试
  - 使用浏览器开发者工具进行调试
  - 暂未配置自动化测试框架（计划使用Vitest + React Testing Library）
- **后端测试**:
  - 使用Postman或curl进行API测试
  - 日志系统记录请求和错误信息
  - 暂未配置单元测试框架
- **集成测试**:
  - 前后端联调测试
  - 数据库操作验证
  - 文件上传功能测试

### Git Workflow

- **分支策略**: 主分支为 `main`，功能开发在独立分支进行
- **提交规范**: 
  - 提交信息使用中文描述
  - 提交前运行 `pnpm lint` 检查代码规范
- **版本管理**: 通过Git标签管理版本号

## Domain Context

### 核心业务概念

1. **简历（Resume）**
   - 每个简历有唯一的 `tlid`（时间有序ID）
   - 支持版本管理，同一简历可以有多个版本
   - 存储格式：源文件路径、纯文本内容、JSON结构化数据
   - 支持格式：PDF、Word、TXT、PNG、JPG

2. **工作流（Workflow）**
   - 可配置的AI处理流程，支持与外部服务（如Dify）集成
   - 包含输入字段定义、输出字段定义、API配置
   - 支持公开/私有工作流，记录使用次数

3. **用户角色**
   - **普通用户** (role: 666): 可以使用简历优化功能
   - **管理员** (role: 888): 可以管理用户、工作流、系统配置

4. **认证流程**
   - 主要方式：手机号 + 短信验证码（统一认证接口，自动注册/登录）
   - 备用方式：手机号 + 密码（入口淡化）
   - Token存储：前端localStorage的 `console_token` 字段
   - Token有效期：7天，缓冲期1天

5. **邀请码系统**
   - 管理员可以创建邀请码
   - 用户注册时可以使用邀请码（可选）
   - 记录邀请码使用情况

6. **站点变量（Site Variable）**
   - 系统级配置变量，可在管理后台配置
   - 用于存储动态配置信息（如工作流ID、系统提示等）

### API响应格式

所有API响应遵循统一格式：
```json
{
  "code": 0,        // 0=成功, 500=错误, 401=未授权, 403=禁止, 404=未找到
  "data": {},       // 响应数据
  "msg": "操作成功"  // 响应消息
}
```

**重要**: `code == 0` 表示成功，与HTTP状态码（200）无关。即使HTTP状态码是200，如果 `code != 0`，也表示操作失败。

### 前端组件使用规范

- **Toast通知**: 使用 `@/utils/toast` 中的 `showSuccess`, `showError`, `showWarning`, `showInfo`
- **UI组件**: 从 `@/components/ui` 导入，如 `Button`, `Modal`, `Input`
- **图标**: 使用 `react-icons` 库

## Important Constraints

### 技术约束

1. **API响应格式**: 必须使用统一响应格式，`code == 0` 表示成功
2. **样式约束**: 模态框背景必须使用 `bg-black/50`，不能使用 `bg-opacity-50`
3. **路径别名**: 必须使用 `@/` 别名，不能使用相对路径 `../../`
4. **包管理**: 前端必须使用 `pnpm`，不能使用 `npm` 或 `yarn`
5. **TypeScript**: 必须启用严格模式，所有代码必须有类型定义
6. **组件风格**: 必须使用函数式组件，不能使用类组件

### 业务约束

1. **认证要求**: 
   - 简历上传需要登录
   - 管理员功能需要管理员权限
   - Token过期需要重新登录

2. **文件上传限制**:
   - 图片最大5MB
   - 文件最大10MB
   - 支持格式：PDF、Word、TXT、PNG、JPG

3. **数据安全**:
   - 密码必须加密存储（bcrypt）
   - JWT Token包含用户ID和角色信息
   - 文件存储在服务器本地，不在数据库中存储文件内容

### 开发约束

1. **代码注释**: 不能删除有用的参数和方法注释
2. **错误处理**: 所有API调用必须有错误处理
3. **类型安全**: 不能使用 `any` 类型，必须定义具体类型

## External Dependencies

### 外部服务

1. **Dify工作流服务**
   - **用途**: AI工作流执行，简历优化处理
   - **集成方式**: 通过HTTP API调用，配置在工作流管理中
   - **认证**: 使用API Key认证
   - **文档**: 参考 `docs/workflow_api_dify.md`

2. **Spug短信服务**
   - **用途**: 发送短信验证码
   - **API地址**: `https://api.spug.cc/api/sms/`
   - **配置**: 在 `server/config.yaml` 中配置token和API URL
   - **功能**: 用户注册/登录时发送验证码

### 数据库

- **PostgreSQL**: 主数据库，存储用户、简历、工作流、对话等数据
- **连接配置**: 在 `server/config.yaml` 中配置连接信息
- **ORM**: 使用GORM进行数据库操作

### 开发依赖

- **Node.js**: 前端开发需要Node.js 18+
- **Go**: 后端开发需要Go 1.21+
- **pnpm**: 前端包管理器
- **Git**: 版本控制

### 部署依赖

- **生产环境**: 
  - Go运行时环境
  - PostgreSQL数据库
  - 静态文件服务器（Go内置）
  - 可选：Nginx反向代理（用于负载均衡和SSL）
