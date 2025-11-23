# 网站变量使用示例

本文档展示如何在前端使用网站变量功能。

## 目录
- [管理员管理界面](#管理员管理界面)
- [使用 Hook 获取变量](#使用-hook-获取变量)
- [直接调用 API](#直接调用-api)
- [实际应用场景](#实际应用场景)

---

## 管理员管理界面

管理员可以在**管理后台 > 网站变量**标签页中进行变量管理。

### 功能特性
- ✅ 创建新变量
- ✅ 编辑现有变量（value 和 description）
- ✅ 删除变量
- ✅ 搜索变量（支持模糊搜索）
- ✅ 分页浏览

---

## 使用 Hook 获取变量

推荐使用 Hook 方式，代码更简洁，支持自动加载和刷新。

### 1. 获取单个变量

```tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const SiteHeader: React.FC = () => {
  const { value: siteName, loading, error } = useSiteVariable('site_name');

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>加载失败: {error}</div>;
  }

  return (
    <header>
      <h1>{siteName || '默认网站名'}</h1>
    </header>
  );
};

export default SiteHeader;
```

### 2. 获取多个变量

```tsx
import React from 'react';
import { useSiteVariables } from '@/hooks/useSiteVariable';

const Footer: React.FC = () => {
  const { variables, loading, error } = useSiteVariables([
    'site_name',
    'contact_email',
    'company_address'
  ]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <footer>
      <p>网站名称: {variables.site_name?.value}</p>
      <p>联系邮箱: {variables.contact_email?.value}</p>
      <p>公司地址: {variables.company_address?.value}</p>
    </footer>
  );
};

export default Footer;
```

### 3. 手动刷新变量

```tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';
// import Button from '@/components/ui/Button'; // deprecated
import { Button } from "@/components/ui"

const AnnouncementBanner: React.FC = () => {
  const { value: announcement, loading, refresh } = useSiteVariable('announcement');

  return (
    <div>
      {announcement && (
        <div className="bg-yellow-100 p-4 rounded">
          <p>{announcement}</p>
          <Button onClick={refresh} disabled={loading}>
            刷新公告
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
```

---

## 直接调用 API

适合在非组件场景或需要更多控制的情况。

### 1. 获取变量

```typescript
import { siteVariableAPI } from '@/api/siteVariable';

// 获取单个变量
const getVariable = async () => {
  try {
    const response = await siteVariableAPI.getSiteVariableByKey('site_name');
    
    if (response.code === 0) {
      console.log('变量值:', response.data.value);
      console.log('变量描述:', response.data.description);
      return response.data.value;
    }
  } catch (error) {
    console.error('获取变量失败:', error);
  }
};
```

### 2. 管理员创建变量

```typescript
import { siteVariableAPI } from '@/api/siteVariable';
import { showSuccess, showError } from '@/utils/toast';

const createVariable = async () => {
  try {
    const response = await siteVariableAPI.createSiteVariable({
      key: 'welcome_message',
      value: '欢迎使用我们的平台！',
      description: '首页欢迎信息'
    });
    
    if (response.code === 0) {
      showSuccess('创建成功');
    }
  } catch (error) {
    showError('创建失败');
  }
};
```

### 3. 管理员更新变量

```typescript
import { siteVariableAPI } from '@/api/siteVariable';

const updateVariable = async (id: number) => {
  try {
    const response = await siteVariableAPI.updateSiteVariable(id, {
      value: '更新后的欢迎信息',
      description: '更新后的描述'
    });
    
    if (response.code === 0) {
      console.log('更新成功');
    }
  } catch (error) {
    console.error('更新失败:', error);
  }
};
```

---

## 实际应用场景

### 场景 1: 动态网站标题

```tsx
import React, { useEffect } from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const App: React.FC = () => {
  const { value: siteName } = useSiteVariable('site_name');

  useEffect(() => {
    if (siteName) {
      document.title = siteName;
    }
  }, [siteName]);

  return (
    <div>
      <h1>{siteName}</h1>
      {/* 其他内容 */}
    </div>
  );
};

export default App;
```

### 场景 2: 维护模式提示

```tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const MaintenanceBanner: React.FC = () => {
  const { value: maintenanceMode } = useSiteVariable('maintenance_mode');
  const { value: maintenanceMessage } = useSiteVariable('maintenance_message');

  // 如果维护模式开启，显示提示
  if (maintenanceMode === 'true') {
    return (
      <div className="bg-red-600 text-white p-4 text-center">
        <p>{maintenanceMessage || '系统正在维护中，请稍后再试'}</p>
      </div>
    );
  }

  return null;
};

export default MaintenanceBanner;
```

### 场景 3: 动态配置功能开关

```tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const RegistrationPage: React.FC = () => {
  const { value: enableRegistration } = useSiteVariable('enable_registration');

  if (enableRegistration === 'false') {
    return (
      <div className="p-8 text-center">
        <h2>注册功能暂时关闭</h2>
        <p>请联系管理员获取邀请码</p>
      </div>
    );
  }

  return (
    <div>
      {/* 正常的注册表单 */}
      <h2>用户注册</h2>
      {/* ... */}
    </div>
  );
};

export default RegistrationPage;
```

### 场景 4: 动态联系方式

```tsx
import React from 'react';
import { useSiteVariables } from '@/hooks/useSiteVariable';

const ContactPage: React.FC = () => {
  const { variables, loading } = useSiteVariables([
    'contact_email',
    'contact_phone',
    'company_address',
    'business_hours'
  ]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="p-8">
      <h1>联系我们</h1>
      <div className="space-y-4">
        <div>
          <h3>邮箱</h3>
          <p>{variables.contact_email?.value || '未设置'}</p>
        </div>
        <div>
          <h3>电话</h3>
          <p>{variables.contact_phone?.value || '未设置'}</p>
        </div>
        <div>
          <h3>地址</h3>
          <p>{variables.company_address?.value || '未设置'}</p>
        </div>
        <div>
          <h3>营业时间</h3>
          <p>{variables.business_hours?.value || '未设置'}</p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
```

### 场景 5: 存储 JSON 配置

```tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

const ThemedComponent: React.FC = () => {
  const { value: themeConfigStr } = useSiteVariable('theme_config');

  // 解析 JSON 配置
  const themeConfig: ThemeConfig | null = React.useMemo(() => {
    try {
      return themeConfigStr ? JSON.parse(themeConfigStr) : null;
    } catch {
      return null;
    }
  }, [themeConfigStr]);

  if (!themeConfig) {
    return <div>使用默认主题</div>;
  }

  return (
    <div style={{ 
      color: themeConfig.primaryColor,
      fontFamily: themeConfig.fontFamily 
    }}>
      <h1>自定义主题</h1>
      <p style={{ color: themeConfig.secondaryColor }}>
        这是使用动态主题配置的组件
      </p>
    </div>
  );
};

export default ThemedComponent;
```

### 场景 6: 最大文件大小限制

```tsx
import React from 'react';
import { useSiteVariable } from '@/hooks/useSiteVariable';
import { showError } from '@/utils/toast';

const FileUpload: React.FC = () => {
  const { value: maxFileSizeStr } = useSiteVariable('max_file_size');
  
  const maxFileSize = React.useMemo(() => {
    return maxFileSizeStr ? parseInt(maxFileSizeStr) : 10 * 1024 * 1024; // 默认 10MB
  }, [maxFileSizeStr]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      showError(`文件大小不能超过 ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      e.target.value = '';
      return;
    }

    // 处理文件上传
    console.log('上传文件:', file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <p className="text-sm text-gray-500">
        最大文件大小: {(maxFileSize / 1024 / 1024).toFixed(1)}MB
      </p>
    </div>
  );
};

export default FileUpload;
```

---

## 最佳实践

1. **使用描述字段**：为每个变量添加清晰的描述，方便团队成员理解其用途

2. **命名规范**：
   - 使用小写字母和下划线
   - 使用有意义的名称
   - 示例：`site_name`, `max_file_size`, `enable_registration`

3. **提供默认值**：在前端使用时提供合理的默认值，防止变量不存在时出错
   ```tsx
   const { value: siteName } = useSiteVariable('site_name');
   const displayName = siteName || '默认网站名';
   ```

4. **JSON 配置**：对于复杂配置，可以将 JSON 字符串存储在 value 中
   ```json
   {
     "key": "theme_config",
     "value": "{\"primaryColor\":\"#3b82f6\",\"secondaryColor\":\"#10b981\"}",
     "description": "主题配置（JSON格式）"
   }
   ```

5. **布尔值处理**：将布尔值存储为字符串 "true" 或 "false"
   ```tsx
   const isEnabled = value === 'true';
   ```

6. **数字值处理**：需要手动转换
   ```tsx
   const maxSize = parseInt(value) || 1000;
   ```

---

## 常用变量建议

| Key | 用途 | 示例值 |
|-----|------|--------|
| site_name | 网站名称 | "简历润色工具" |
| site_description | 网站描述 | "专业的AI简历优化平台" |
| announcement | 公告信息 | "系统将于今晚维护" |
| maintenance_mode | 维护模式 | "false" |
| enable_registration | 是否开放注册 | "true" |
| max_file_size | 最大文件大小（字节） | "10485760" |
| contact_email | 联系邮箱 | "support@example.com" |
| contact_phone | 联系电话 | "400-123-4567" |
| company_address | 公司地址 | "北京市朝阳区..." |
| business_hours | 营业时间 | "周一至周五 9:00-18:00" |
| theme_config | 主题配置 | JSON字符串 |
| feature_flags | 功能开关 | JSON字符串 |

---

## 注意事项

⚠️ **安全提示**
- 不要在网站变量中存储敏感信息（如密码、密钥等）
- 公开接口可以被任何人访问，确保存储的信息可以公开

⚠️ **性能提示**
- Hook 会在组件挂载时自动请求数据
- 对于多个变量，使用 `useSiteVariables` 批量获取更高效
- 考虑使用全局状态管理或缓存来避免重复请求

⚠️ **类型转换**
- value 始终是字符串类型
- 使用时需要根据实际情况进行类型转换（布尔值、数字等）

