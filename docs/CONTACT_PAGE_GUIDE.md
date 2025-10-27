# 联系页面使用指南

## 概述

联系页面 (`/contact`) 是一个简约商业风格的页面，用于展示联系方式和二维码。页面使用网站变量系统动态加载内容。

## 页面位置

- **路由**: `/contact`
- **组件**: `web/src/pages/contact/Contact.tsx`

## 使用的网站变量

该页面使用以下网站变量（通过 `useSiteVariable` hook 获取）：

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `contact_img` | 联系二维码图片URL | 是 | 无（显示占位符） |
| `contact_email` | 联系邮箱 | 否 | `support@example.com` |
| `contact_phone` | 联系电话 | 否 | 无（不显示） |
| `contact_address` | 联系地址 | 否 | 无（不显示） |

## 创建网站变量

### 方法1：通过管理界面

1. 使用管理员账号登录
2. 进入 **管理后台**
3. 点击 **网站变量** 标签页
4. 点击 **新增变量** 按钮
5. 填写以下信息：

**必需变量：**
```
键名: contact_img
值: https://example.com/qrcode.png
描述: 联系二维码图片
```

**可选变量：**
```
键名: contact_email
值: support@example.com
描述: 联系邮箱

键名: contact_phone
值: +86 123 4567 8900
描述: 联系电话

键名: contact_address
值: 北京市朝阳区xxx街道xxx号
描述: 联系地址
```

### 方法2：通过API

```bash
# 创建二维码图片变量
curl -X POST http://localhost:8080/api/admin/site-variables \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "contact_img",
    "value": "https://example.com/qrcode.png",
    "description": "联系二维码图片"
  }'

# 创建邮箱变量
curl -X POST http://localhost:8080/api/admin/site-variables \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "contact_email",
    "value": "support@example.com",
    "description": "联系邮箱"
  }'

# 创建电话变量
curl -X POST http://localhost:8080/api/admin/site-variables \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "contact_phone",
    "value": "+86 123 4567 8900",
    "description": "联系电话"
  }'

# 创建地址变量
curl -X POST http://localhost:8080/api/admin/site-variables \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "contact_address",
    "value": "北京市朝阳区xxx街道xxx号",
    "description": "联系地址"
  }'
```

## 页面功能

### 1. 联系方式展示

左侧区域展示：
- 📧 邮箱（可点击发送邮件）
- 📞 电话（可点击拨打电话）
- 📍 地址（仅显示）

### 2. 二维码展示

右侧区域展示：
- 微信二维码图片（从 `contact_img` 变量获取）
- 如果图片加载失败，显示友好的占位符
- 如果未设置变量，显示默认占位符

### 3. 底部CTA区域

- 快速邮件按钮
- 快速拨号按钮
- 工作时间信息

## 页面样式特点

- ✨ 简约商业风格设计
- 🎨 渐变背景和卡片布局
- 📱 响应式设计，适配移动端
- 🎭 优雅的动画效果
- 🎯 清晰的信息层级

## 导航入口

页面已添加到：
1. **顶部导航栏** - "联系我们" 链接
2. **页面底部** - "联系我们" 链接（帮助支持区域）
3. **直接访问** - `/contact` 路由

## 图片要求

### 二维码图片建议：
- **格式**: PNG 或 JPG
- **尺寸**: 建议 512x512 像素以上
- **大小**: 建议不超过 500KB
- **背景**: 白色或透明背景
- **边距**: 二维码周围留有适当的空白边距

### 图片上传方式：

1. **通过文件管理上传**：
   - 在管理后台上传图片
   - 获取图片URL
   - 将URL设置为 `contact_img` 变量的值

2. **使用外部图片URL**：
   - 直接使用外部图片链接
   - 确保图片URL可公开访问

## 示例效果

```
┌─────────────────────────────────────────────────────┐
│                     联系我们                          │
│                    ────────                          │
│            我们随时准备为您提供帮助和支持              │
└─────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────┐
│   联系方式            │      扫码添加微信              │
│                      │                              │
│  📧 邮箱              │        [微信图标]             │
│  support@...         │                              │
│                      │      ┌─────────────┐         │
│  📞 电话              │      │             │         │
│  +86 123...          │      │  [二维码]    │         │
│                      │      │             │         │
│  📍 地址              │      └─────────────┘         │
│  北京市...            │                              │
│                      │   使用微信扫描二维码            │
│  ─────────────       │                              │
│  工作时间             │                              │
│  周一至周五 9:00-18:00 │                              │
└──────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    需要帮助？                         │
│   无论您是想了解我们的服务，还是遇到了技术问题...      │
│           [发送邮件]    [电话咨询]                    │
└─────────────────────────────────────────────────────┘
```

## 技术实现

- **React Hook**: `useSiteVariable` 动态获取变量
- **响应式布局**: Tailwind CSS Grid
- **图标库**: react-icons (FaEnvelope, FaPhone, FaMapMarkerAlt, FaWeixin)
- **动画**: Tailwind CSS 自定义动画类

## 注意事项

1. **图片加载失败处理**: 页面已实现图片加载失败的优雅降级
2. **空状态处理**: 如果变量未设置，会显示默认值或占位符
3. **性能优化**: 使用懒加载和suspense包装
4. **可访问性**: 所有链接都使用语义化的HTML元素

## 后续优化建议

1. 添加表单功能，允许用户直接在页面提交咨询
2. 添加地图组件，显示实际位置
3. 添加更多社交媒体联系方式（微博、抖音等）
4. 添加在线客服系统集成
5. 添加工作时间的动态显示（当前是否营业）

## 相关文档

- [网站变量管理 - 快速开始](./SITE_VARIABLE_QUICKSTART.md)
- [网站变量 API 文档](./SITE_VARIABLE_API.md)
- [网站变量使用示例](./SITE_VARIABLE_USAGE_EXAMPLES.md)

