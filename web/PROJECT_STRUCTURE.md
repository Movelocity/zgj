# 前端项目结构说明

## 项目概述

这是简历润色工具（职管加）的前端项目，基于 React 18 + TypeScript + Tailwind CSS 构建。

## 技术栈

- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **UI组件**: Headless UI + Heroicons

## 项目结构

```
src/
├── api/                    # API接口层
│   ├── client.ts          # Axios配置和拦截器
│   ├── auth.ts            # 认证相关API
│   ├── user.ts            # 用户相关API
│   ├── resume.ts          # 简历相关API
│   ├── workflow.ts        # 工作流相关API
│   └── admin.ts           # 管理员相关API
├── components/            # 公共组件
│   ├── ui/               # 基础UI组件
│   ├── layout/           # 布局组件
│   ├── forms/            # 表单组件
│   ├── upload/           # 上传组件
│   └── common/           # 通用组件
├── pages/                # 页面组件
│   ├── home/            # 首页
│   ├── auth/            # 认证页面
│   ├── resume/          # 简历相关页面
│   ├── admin/           # 管理员页面
│   ├── profile/         # 用户中心
│   └── error/           # 错误页面
├── hooks/               # 自定义Hooks
├── store/               # 状态管理
│   ├── authStore.ts     # 认证状态
│   ├── resumeStore.ts   # 简历状态
│   ├── workflowStore.ts # 工作流状态
│   └── globalStore.ts   # 全局状态
├── utils/               # 工具函数
│   ├── constants.ts     # 常量定义
│   ├── helpers.ts       # 辅助函数
│   ├── validation.ts    # 表单验证
│   ├── storage.ts       # 本地存储
│   └── file.ts          # 文件处理
├── types/               # 类型定义
│   ├── api.ts           # API类型
│   ├── user.ts          # 用户类型
│   ├── resume.ts        # 简历类型
│   ├── workflow.ts      # 工作流类型
│   └── global.ts        # 全局类型
├── router/              # 路由配置
│   ├── index.tsx        # 路由主文件
│   └── routes.ts        # 路由定义
└── styles/              # 样式文件
```

## 已完成功能

✅ 项目基础架构搭建
✅ 依赖包安装和配置
✅ TypeScript 配置和路径映射
✅ API 接口层设计
✅ Zustand 状态管理配置
✅ React Router 路由系统
✅ 基础 UI 组件库
✅ 布局组件（Header, Footer, Layout）
✅ 通用组件（ProtectedRoute, AdminRoute, ErrorBoundary）
✅ 工具函数库
✅ 类型定义系统

## 待开发功能

🔄 认证模块（手机号+验证码登录）
🔄 简历上传和管理
🔄 简历优化功能
🔄 工作流集成
🔄 用户中心
🔄 管理员后台
🔄 UI组件完善（Modal, Toast等）

## 开发指南

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint
```

## 路径映射

项目配置了路径映射，可以使用以下别名：

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/pages/*` → `src/pages/*`
- `@/api/*` → `src/api/*`
- `@/store/*` → `src/store/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`

## 状态管理

使用 Zustand 进行状态管理，主要包括：

- `authStore`: 用户认证状态
- `resumeStore`: 简历管理状态
- `workflowStore`: 工作流执行状态
- `globalStore`: 全局UI状态（Toast, Modal等）

## 注意事项

1. 所有页面组件都使用懒加载
2. 需要认证的路由使用 `ProtectedRoute` 包装
3. 管理员路由使用 `AdminRoute` 包装
4. 错误边界已配置，捕获并处理组件错误
5. API 客户端已配置拦截器，自动处理 token 和错误
