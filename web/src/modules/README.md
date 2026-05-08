# 前端业务模块说明

本目录按顶部导航栏和业务边界拆分前端入口，目标是让不同同学可以分别维护“简历优化”“职位匹配”“岗位机会”等模块，而不需要同时改 Header 和 Router。

## 模块注册方式

每个模块导出一个 `FrontendModule`：

```ts
export const opportunitiesModule: FrontendModule = {
  id: 'opportunities',
  name: '岗位机会',
  description: '负责岗位列表、岗位搜索、简历上传匹配和机会展示。',
  ownerHint: '适合由岗位库/搜索匹配方向维护。',
  nav: {
    path: ROUTES.OPPORTUNITIES,
    label: '岗位机会',
    order: 40,
  },
  routes: [
    {
      path: ROUTES.OPPORTUNITIES,
      element: <Opportunities />,
    },
  ],
};
```

`web/src/modules/index.ts` 会统一导出：

- `APP_MODULES`：全部模块。
- `APP_ROUTES`：普通应用路由，供 `router/index.tsx` 使用。
- `STANDALONE_ROUTES`：无需主布局的独立路由，如 PDF 导出渲染页。
- `APP_NAV_ITEMS`：顶部导航入口，供 Header 使用。

## 当前模块分工

| 模块目录 | 导航入口 | 维护范围 |
| --- | --- | --- |
| `home/` | 首页 | 首页、使用指南。 |
| `resumeOptimization/` | 简历优化 | 简历上传、解析、AI 优化入口。 |
| `jobMatching/` | 职位匹配 | JD 匹配和定向优化入口。 |
| `opportunities/` | 岗位机会 | 岗位列表、岗位搜索、简历上传匹配。 |
| `resumeWorkspace/` | 我的简历 | 简历列表、卡片视图、详情、编辑器、导出渲染。 |
| `interviewReview/` | 面试复盘 | 面试复盘列表、详情和分析流程。 |
| `account/` | 无主导航 | 登录注册、个人中心、管理后台。 |
| `system/` | 无主导航 | 错误页、测试页、开发辅助页面。 |

## 新增导航模块

1. 在 `web/src/utils/constants.ts` 添加路由常量。
2. 在 `web/src/modules/` 下新建模块目录，例如 `web/src/modules/opportunities/`。
3. 在模块目录的 `index.tsx` 中声明 `nav` 和 `routes`。
4. 在 `web/src/modules/index.ts` 中把模块加入 `APP_MODULES`。

这样顶部导航和路由会自动同步，不需要再分别改 `Header2.tsx` 和 `router/index.tsx`。

## 路由鉴权

模块路由使用 `access` 标记鉴权：

| access | 行为 |
| --- | --- |
| 不填或 `public` | 公开访问。 |
| `protected` | 使用 `ProtectedRoute` 包裹。 |
| `admin` | 使用 `AdminRoute` 包裹。 |

独立页面使用 `layout: 'standalone'`，例如 `/export/:taskId`。
