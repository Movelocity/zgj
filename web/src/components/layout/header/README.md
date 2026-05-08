# 前端标题栏模块说明

本目录用于拆分首页/业务页共用的顶部标题栏，目标是让品牌、用户操作、移动端菜单可以分工维护。

顶部导航对应的业务模块已经迁移到 `web/src/modules/`。如果要维护“简历优化”“职位匹配”“岗位机会”等页面入口，优先查看：

- `web/src/modules/README.md`
- `web/src/modules/index.ts`
- 对应模块目录，例如 `web/src/modules/opportunities/index.tsx`

## 文件职责

| 文件 | 说明 |
| --- | --- |
| `navigation.ts` | 从 `web/src/modules` 读取主导航入口，并维护辅助入口和选中态判断。 |
| `HeaderBrand.tsx` | Logo 与品牌名。 |
| `HeaderPrimaryNav.tsx` | 桌面端主导航。 |
| `HeaderUserActions.tsx` | 桌面端右侧操作区：使用指南、管理后台、用户入口、立即试用。 |
| `HeaderMobileControls.tsx` | 移动端用户入口与菜单开关。 |
| `HeaderMobileMenu.tsx` | 移动端展开菜单。 |
| `../Header2.tsx` | 只负责组装以上模块和维护移动端菜单开关状态。 |

## 新增顶部导航入口

在 `web/src/modules/` 中新增业务模块，并给模块配置 `nav`：

```ts
nav: {
  path: ROUTES.OPPORTUNITIES,
  label: '岗位机会',
  order: 40,
},
```

如果是全局路径，先在 `web/src/utils/constants.ts` 的 `ROUTES` 中补充常量，再在模块配置中引用。

## 分工建议

| 负责人范围 | 主要文件 |
| --- | --- |
| 页面入口/导航文案 | `web/src/modules/*/index.tsx` |
| 品牌展示 | `HeaderBrand.tsx` |
| 桌面端导航样式 | `HeaderPrimaryNav.tsx` |
| 登录态/管理员入口 | `HeaderUserActions.tsx` |
| 移动端菜单 | `HeaderMobileControls.tsx`, `HeaderMobileMenu.tsx` |

## 相关 UI 修复

AI 修改建议卡片不属于标题栏模块，但本次一起修复了编辑页中的布局问题：

- `web/src/pages/editor/components/EditableText.tsx`
  - AI 修改卡片改为 `block w-full`，避免标题、公司名、时间等短字段把卡片挤成窄列。
  - 接收/拒绝按钮常驻显示。
- `web/src/pages/editor/components/ResumeEditor.tsx`
  - 当列表项标题或时间存在 AI 修改建议时，整组字段按纵向整行展示，避免左右两列互相挤压。
- `web/src/pages/editor/components/utils.ts`
  - 增加中英文标题别名匹配，避免 `个人总结` 和 `Summary` 被误判为两个不同板块。

## 验证方式

```bash
cd web
pnpm build
```

完整联调时，先构建前端，再启动 Go 后端访问：

```bash
cd web
pnpm build

cd ../server
./server
```

访问 `http://127.0.0.1:8888` 检查标题栏，访问编辑页检查 AI 修改建议卡片。
