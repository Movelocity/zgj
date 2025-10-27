# 网站变量管理 - 快速开始

## 5分钟快速上手

### 1. 启动服务

确保后端和前端服务都已启动：

```bash
# 启动后端（在 server 目录）
cd server
go run main.go

# 启动前端（在 web 目录）
cd web
pnpm dev
```

数据库表 `site_variables` 会在首次启动时自动创建。

---

### 2. 管理员创建变量

#### 方式A：通过管理界面（推荐）

1. 使用管理员账号登录系统
2. 进入 **管理后台**
3. 点击 **网站变量** 标签页
4. 点击 **新增变量** 按钮
5. 填写表单：
   - 键名（Key）: `site_name`
   - 值（Value）: `简历润色工具`
   - 描述: `网站名称`
6. 点击 **创建** 按钮

#### 方式B：通过API

```bash
curl -X POST http://localhost:8080/api/admin/site-variables \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "site_name",
    "value": "简历润色工具",
    "description": "网站名称"
  }'
```

---

### 3. 在前端使用变量

#### 使用 Hook（推荐）

```tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const MyComponent: React.FC = () => {
  const { value: siteName, loading } = useSiteVariable('site_name');

  if (loading) return <div>加载中...</div>;

  return <h1>{siteName || '默认名称'}</h1>;
};

export default MyComponent;
```

#### 直接调用API

```typescript
import { siteVariableAPI } from '@/api/siteVariable';

const getSiteName = async () => {
  const response = await siteVariableAPI.getSiteVariableByKey('site_name');
  if (response.code === 0) {
    console.log(response.data.value); // "简历润色工具"
  }
};
```

---

## 常用变量示例

创建以下变量让网站更灵活：

### 基础配置
```typescript
// 1. 网站名称
key: 'site_name'
value: '简历润色工具'
description: '显示在标题栏和页面标题'

// 2. 网站描述
key: 'site_description'
value: '专业的AI简历优化平台'
description: '网站简介'

// 3. 联系邮箱
key: 'contact_email'
value: 'support@example.com'
description: '客服联系邮箱'
```

### 功能开关
```typescript
// 4. 注册开关
key: 'enable_registration'
value: 'true'
description: '是否允许新用户注册'

// 5. 维护模式
key: 'maintenance_mode'
value: 'false'
description: '维护模式开关'
```

### 业务配置
```typescript
// 6. 最大文件大小
key: 'max_file_size'
value: '10485760'
description: '最大上传文件大小（字节），10MB'

// 7. 公告信息
key: 'announcement'
value: '欢迎使用简历润色工具！'
description: '首页公告横幅内容'
```

---

## 实际应用示例

### 示例1：动态网站标题

```tsx
// App.tsx
import React, { useEffect } from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const App: React.FC = () => {
  const { value: siteName } = useSiteVariable('site_name');

  useEffect(() => {
    if (siteName) {
      document.title = siteName;
    }
  }, [siteName]);

  return <div>{/* 你的应用内容 */}</div>;
};
```

### 示例2：公告横幅

```tsx
// AnnouncementBanner.tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const AnnouncementBanner: React.FC = () => {
  const { value: announcement } = useSiteVariable('announcement');

  if (!announcement) return null;

  return (
    <div className="bg-blue-100 border-b border-blue-200 px-4 py-2 text-center">
      <p className="text-blue-800">{announcement}</p>
    </div>
  );
};

export default AnnouncementBanner;
```

### 示例3：注册功能开关

```tsx
// RegistrationPage.tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const RegistrationPage: React.FC = () => {
  const { value: enableRegistration } = useSiteVariable('enable_registration');

  if (enableRegistration === 'false') {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl mb-4">注册功能暂时关闭</h2>
        <p>请联系管理员获取邀请码</p>
      </div>
    );
  }

  return (
    <div>
      {/* 正常的注册表单 */}
    </div>
  );
};

export default RegistrationPage;
```

### 示例4：批量获取多个变量

```tsx
// Footer.tsx
import React from 'react';
import { useSiteVariables } from '@/hooks/useSiteVariable';

const Footer: React.FC = () => {
  const { variables } = useSiteVariables([
    'site_name',
    'contact_email',
    'contact_phone'
  ]);

  return (
    <footer className="bg-gray-800 text-white p-8">
      <h3>{variables.site_name?.value}</h3>
      <p>邮箱: {variables.contact_email?.value}</p>
      <p>电话: {variables.contact_phone?.value}</p>
    </footer>
  );
};

export default Footer;
```

---

## API端点速查

### 管理员接口（需要认证）

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/admin/site-variables` | 创建变量 |
| PUT | `/api/admin/site-variables/:id` | 更新变量 |
| DELETE | `/api/admin/site-variables/:id` | 删除变量 |
| GET | `/api/admin/site-variables` | 获取列表 |
| GET | `/api/admin/site-variables/:id` | 获取详情 |

### 公开接口（无需认证）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/public/site-variables/by-key?key=xxx` | 通过key查询 |

---

## 类型转换工具函数

由于 value 始终是字符串，这里提供一些实用的转换函数：

```typescript
// utils/siteVariableHelper.ts

/**
 * 将字符串转换为布尔值
 */
export const toBool = (value: string): boolean => {
  return value === 'true';
};

/**
 * 将字符串转换为数字
 */
export const toNumber = (value: string, defaultValue: number = 0): number => {
  const num = parseInt(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * 将字符串转换为JSON对象
 */
export const toJSON = <T = any>(value: string, defaultValue: T | null = null): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

/**
 * 将字符串转换为数组（逗号分隔）
 */
export const toArray = (value: string): string[] => {
  return value.split(',').map(item => item.trim()).filter(Boolean);
};
```

使用示例：
```tsx
import { useSiteVariable } from '@/hooks/useSiteVariable';
import { toBool, toNumber, toJSON } from '@/utils/siteVariableHelper';

const MyComponent = () => {
  const { value: enableFlag } = useSiteVariable('enable_feature');
  const { value: maxSizeStr } = useSiteVariable('max_file_size');
  const { value: configStr } = useSiteVariable('app_config');

  const isEnabled = toBool(enableFlag);
  const maxSize = toNumber(maxSizeStr, 10485760);
  const config = toJSON(configStr, { theme: 'light' });

  return (
    <div>
      <p>功能状态: {isEnabled ? '开启' : '关闭'}</p>
      <p>最大大小: {maxSize} bytes</p>
      <p>主题: {config?.theme}</p>
    </div>
  );
};
```

---

## 调试技巧

### 1. 在浏览器控制台查看变量

```javascript
// 在控制台执行
await fetch('/api/public/site-variables/by-key?key=site_name')
  .then(r => r.json())
  .then(console.log)
```

### 2. 查看所有变量（管理员）

```javascript
// 需要先获取token
const token = localStorage.getItem('token');

await fetch('/api/admin/site-variables?page=1&pageSize=100', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(console.log)
```

### 3. Hook调试

```tsx
import { useSiteVariable } from '@/hooks/useSiteVariable';

const DebugComponent = () => {
  const result = useSiteVariable('site_name');
  
  console.log('变量获取结果:', result);
  // { value, description, loading, error, refresh }
  
  return <pre>{JSON.stringify(result, null, 2)}</pre>;
};
```

---

## 常见问题

### Q: 变量创建后前端无法获取？
**A**: 检查以下几点：
1. 后端服务是否正常运行
2. key拼写是否正确
3. 浏览器控制台是否有网络错误
4. 尝试刷新页面

### Q: 如何设置布尔值？
**A**: 使用字符串 "true" 或 "false"，前端使用时转换：
```tsx
const { value } = useSiteVariable('enable_feature');
const isEnabled = value === 'true';
```

### Q: 如何存储JSON配置？
**A**: 将JSON对象转换为字符串存储：
```json
{
  "key": "app_config",
  "value": "{\"theme\":\"dark\",\"language\":\"zh-CN\"}",
  "description": "应用配置"
}
```

前端使用时解析：
```tsx
const { value } = useSiteVariable('app_config');
const config = value ? JSON.parse(value) : {};
```

### Q: 变量很多，每次都要请求吗？
**A**: 建议实现全局状态管理和缓存：
```tsx
// 使用 Zustand 示例
import create from 'zustand';

interface VariableStore {
  cache: Record<string, { value: string; description: string }>;
  setVariable: (key: string, data: any) => void;
}

const useVariableStore = create<VariableStore>((set) => ({
  cache: {},
  setVariable: (key, data) => set((state) => ({
    cache: { ...state.cache, [key]: data }
  }))
}));
```

---

## 下一步

- 📖 查看 [API文档](./SITE_VARIABLE_API.md) 了解完整API
- 💡 查看 [使用示例](./SITE_VARIABLE_USAGE_EXAMPLES.md) 了解更多场景
- 📋 查看 [实现总结](./SITE_VARIABLE_IMPLEMENTATION_SUMMARY.md) 了解技术细节

---

## 需要帮助？

如有问题，请查看：
1. 完整的API文档
2. 使用示例文档
3. 后端日志（`server/log/app.log`）
4. 浏览器控制台

