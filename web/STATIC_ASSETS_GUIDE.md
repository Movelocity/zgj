# 静态资源管理指南

## 目录结构

```
web/
├── public/                 # 静态资源目录（会被直接复制到 dist）
│   ├── favicon.ico        # 网站图标
│   ├── images/            # 图片资源
│   │   └── logo_256x256.webp  # 应用logo
│   └── icons/             # 图标资源
│       └── favicon.ico    # 备用图标
└── src/
    └── assets/            # 需要被构建工具处理的资源（已清空）
```

## 资源引用规则

### 1. 静态资源引用（推荐）

放在 `public/` 目录下的文件会被 Vite 直接复制到 `dist` 目录，在开发和生产环境中都可以通过绝对路径访问：

```tsx
// ✅ 正确：使用 public 目录中的资源
<img src="/images/logo_256x256.webp" alt="Logo" />
<link rel="icon" href="/favicon.ico" />
```

### 2. 动态资源引用（特殊情况）

如果需要在构建时处理资源（如优化、压缩等），可以放在 `src/assets/` 目录：

```tsx
// 仅在需要构建时处理时使用
import logoUrl from '@/assets/logo.png';
<img src={logoUrl} alt="Logo" />
```

## Vite 配置

确保 `vite.config.ts` 中包含以下配置：

```typescript
export default defineConfig({
  build: {
    // 确保 public 目录下的所有文件都被复制到 dist
    copyPublicDir: true,
  },
  // 确保开发服务器正确提供静态文件
  publicDir: 'public',
});
```

## 最佳实践

1. **优先使用 public 目录**：对于不需要构建时处理的静态资源
2. **组织目录结构**：按类型分类存放（images/, icons/ 等）
3. **使用合适的格式**：
   - 图标：`.ico` 用于 favicon，`.svg` 用于矢量图标
   - 图片：`.webp` 优先，`.png`/`.jpg` 作为备选
4. **路径一致性**：开发和生产环境使用相同的绝对路径引用

## 构建验证

构建后检查 `dist` 目录应包含：
- `favicon.ico`
- `images/logo_256x256.webp`
- `icons/favicon.ico`

## 故障排除

如果遇到开发环境和生产环境图标不一致的问题：

1. 检查 `public` 目录中是否包含所需文件
2. 确认 `vite.config.ts` 中的 `copyPublicDir: true` 设置
3. 重新构建项目：`pnpm build`
4. 检查 `dist` 目录中是否包含所有静态文件
