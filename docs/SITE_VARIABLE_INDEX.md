# 网站变量管理 - 文档索引

## 📚 完整文档列表

本项目实现了完整的网站变量管理系统，以下是所有相关文档：

---

### 🚀 [快速开始](./SITE_VARIABLE_QUICKSTART.md)
**推荐新手阅读**

5分钟快速上手指南，包括：
- ✅ 如何启动服务
- ✅ 如何创建第一个变量
- ✅ 如何在前端使用变量
- ✅ 常用变量示例
- ✅ 调试技巧
- ✅ 常见问题解答

👉 [立即查看](./SITE_VARIABLE_QUICKSTART.md)

---

### 📖 [API 文档](./SITE_VARIABLE_API.md)
**API 接口完整参考**

详细的API接口文档，包括：
- 数据库表结构
- 管理员接口（5个）
- 公开接口（1个）
- 请求/响应示例
- 错误码说明
- 前端使用示例
- 常见变量键名建议

👉 [查看API文档](./SITE_VARIABLE_API.md)

---

### 💡 [使用示例](./SITE_VARIABLE_USAGE_EXAMPLES.md)
**实际应用场景和代码示例**

丰富的使用示例，包括：
- 管理员管理界面使用
- Hook 使用方法（推荐）
- API 直接调用方法
- **6个实际应用场景**：
  1. 动态网站标题
  2. 维护模式提示
  3. 功能开关控制
  4. 动态联系方式
  5. JSON配置存储
  6. 文件大小限制
- 最佳实践
- 注意事项

👉 [查看使用示例](./SITE_VARIABLE_USAGE_EXAMPLES.md)

---

### 📋 [实现总结](./SITE_VARIABLE_IMPLEMENTATION_SUMMARY.md)
**技术实现细节**

完整的技术实现文档，包括：
- 后端实现（Go）
  - 数据库模型
  - 服务层
  - API处理器
  - 路由配置
- 前端实现（React + TypeScript）
  - 类型定义
  - API接口
  - React Hooks
  - 管理界面
- 特性亮点
- 技术栈
- 文件清单
- 后续优化建议

👉 [查看实现总结](./SITE_VARIABLE_IMPLEMENTATION_SUMMARY.md)

---

## 🛠️ 源代码文件

### 后端（Go）

| 文件 | 说明 |
|------|------|
| `server/model/site_variable.go` | 数据模型定义 |
| `server/service/sitevariable/types.go` | 服务层类型定义 |
| `server/service/sitevariable/sitevariable_service.go` | 服务层业务逻辑 |
| `server/api/sitevariable/sitevariable.go` | API处理器 |
| `server/router/sitevariable.go` | 路由配置 |

### 前端（React + TypeScript）

| 文件 | 说明 |
|------|------|
| `web/src/types/siteVariable.ts` | TypeScript类型定义 |
| `web/src/api/siteVariable.ts` | API接口封装 |
| `web/src/hooks/useSiteVariable.ts` | React Hooks |
| `web/src/utils/siteVariableHelper.ts` | 类型转换工具函数 |
| `web/src/pages/admin/components/SiteVariableManagement.tsx` | 管理界面 |

---

## 🎯 快速导航

### 我想...

#### 🆕 开始使用
→ 阅读 [快速开始](./SITE_VARIABLE_QUICKSTART.md)

#### 🔍 查找API接口
→ 查看 [API文档](./SITE_VARIABLE_API.md)

#### 💻 学习如何在代码中使用
→ 查看 [使用示例](./SITE_VARIABLE_USAGE_EXAMPLES.md)

#### 🔧 了解技术实现
→ 阅读 [实现总结](./SITE_VARIABLE_IMPLEMENTATION_SUMMARY.md)

#### 🐛 遇到问题
→ 查看 [快速开始 - 常见问题](./SITE_VARIABLE_QUICKSTART.md#常见问题)

---

## 📦 功能特性

✅ **完整的CRUD功能**
- 创建、读取、更新、删除网站变量

✅ **权限控制**
- 管理员：完整权限
- 普通用户：只读查询（公开接口）

✅ **前端管理界面**
- 美观易用的管理界面
- 搜索、分页功能
- 实时反馈

✅ **React Hooks**
- `useSiteVariable` - 单个变量
- `useSiteVariables` - 批量变量
- 自动加载和错误处理

✅ **类型转换工具**
- 15+ 实用转换函数
- 处理布尔值、数字、JSON等

✅ **文档齐全**
- 4份完整文档
- 代码示例丰富
- 最佳实践指导

---

## 🎬 使用流程

```
1. 管理员创建变量
   ├─ 通过管理界面（推荐）
   └─ 通过API调用

2. 前端获取变量
   ├─ 使用 Hook（推荐）
   │  ├─ useSiteVariable()     # 单个变量
   │  └─ useSiteVariables()    # 批量变量
   └─ 直接调用API
      └─ siteVariableAPI.getSiteVariableByKey()

3. 类型转换
   ├─ toBool()        # 字符串 → 布尔
   ├─ toNumber()      # 字符串 → 数字
   ├─ toJSON()        # 字符串 → JSON
   └─ 更多...         # 15+ 工具函数
```

---

## 💡 实际应用场景

### 1️⃣ 网站配置
- 网站名称、标语、描述
- 联系方式、社交媒体链接

### 2️⃣ 功能开关
- 注册开关、维护模式
- 功能特性开关

### 3️⃣ 业务配置
- 文件大小限制
- 超时设置

### 4️⃣ 内容管理
- 公告信息
- 欢迎语

### 5️⃣ 主题样式
- 颜色配置
- 布局参数

---

## 📊 统计信息

| 项目 | 数量 |
|------|------|
| 后端文件 | 5个 |
| 前端文件 | 5个 |
| API接口 | 6个 |
| React Hooks | 2个 |
| 工具函数 | 15个 |
| 文档 | 4份 |
| 代码示例 | 20+ |

---

## 🚦 状态

- ✅ 后端实现完成
- ✅ 前端实现完成
- ✅ 管理界面完成
- ✅ API文档完成
- ✅ 使用示例完成
- ✅ 零Linter错误
- ✅ 遵循项目规范
- ✅ 可直接使用

---

## 🔗 相关链接

- 项目根目录: `/Users/hollway/projects/resume-polisher/`
- 后端目录: `server/`
- 前端目录: `web/`
- 文档目录: `docs/`

---

## 📝 更新日志

### v1.0.0 (2025-10-27)
- ✨ 首次发布
- ✨ 完整的后端CRUD功能
- ✨ 前端管理界面
- ✨ React Hooks封装
- ✨ 完善的文档和示例

---

## 🤝 贡献

欢迎提出改进建议！

---

## 📄 许可

遵循项目原有许可协议

---

**Happy Coding! 🎉**

