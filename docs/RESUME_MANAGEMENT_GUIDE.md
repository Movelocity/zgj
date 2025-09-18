# 简历管理功能使用指南

## 功能概述

简历润色工具现已支持完整的简历管理功能，用户可以：

- 📤 **上传简历文件** (PDF、DOC、DOCX)
- ✏️ **创建纯文本简历**
- 👁️ **查看简历详情**
- ✏️ **编辑简历内容**
- 🗂️ **管理简历列表**
- 🔄 **简历版本控制**
- 🤖 **AI 智能优化**

## 页面导航

### 1. 简历列表页面 (`/resumes`)

**主要功能：**
- 查看所有个人简历
- 上传新的简历文件
- 创建纯文本简历
- 快速操作：查看、编辑、下载、删除

**操作说明：**
- 点击 **"上传简历"** 按钮选择本地文件上传
- 点击 **"创建简历"** 按钮创建纯文本格式简历
- 点击简历行的操作按钮进行相应操作：
  - 👁️ **查看详情**：跳转到详情页面
  - ✏️ **编辑**：跳转到详情页面进入编辑模式
  - 📥 **下载**：下载简历文件（仅文件简历）
  - 🗑️ **删除**：软删除简历

### 2. 简历详情页面 (`/resume/:id`)

**主要功能：**
- 查看简历完整信息
- 在线编辑简历内容
- 预览和下载简历文件
- 查看结构化数据

**页面结构：**
- **基本信息**：简历名称、编号、版本、创建时间等
- **文本内容**：可编辑的纯文本简历内容
- **结构化数据**：JSON 格式的结构化信息
- **文件预览**：在线预览简历文件（如有）

### 3. AI 简历优化页面 (`/simple-resume`)

**主要功能：**
- 上传简历文件进行 AI 优化
- 选择历史简历进行优化
- 查看优化结果和建议
- 在线编辑优化后的简历

**使用流程：**
1. 上传简历文件或选择历史简历
2. 点击"开始 AI 优化"
3. 等待 AI 分析和优化处理
4. 查看优化结果统计
5. 进入编辑页面完善简历

## 数据结构说明

### 简历基本信息
```typescript
interface ResumeInfo {
  id: string;               // 简历唯一标识
  resume_number: string;    // 简历编号 (R{用户ID后6位}{序号})
  version: number;          // 版本号
  name: string;            // 简历名称
  original_filename: string; // 原始文件名
  file_id: string;         // 文件ID（空表示纯文本简历）
  status: string;          // 状态 (active/deleted)
  created_at: string;      // 创建时间
  updated_at: string;      // 更新时间
}
```

### 简历详细信息
```typescript
interface ResumeDetail {
  // ... 基本信息字段
  text_content: string;     // 纯文本内容
  structured_data: any;     // 结构化数据 (JSON)
}
```

## API 接口使用

### 前端 API 调用示例

```typescript
import { resumeAPI } from '@/api/resume';

// 获取简历列表
const resumes = await resumeAPI.getResumes({ page: 1, page_size: 10 });

// 上传简历文件
const uploadData = { file: selectedFile };
const result = await resumeAPI.uploadResume(uploadData);

// 创建纯文本简历
const textData = { name: '我的简历', text_content: '简历内容...' };
const result = await resumeAPI.createTextResume(textData);

// 获取简历详情
const detail = await resumeAPI.getResume(resumeId);

// 更新简历
const updateData = { name: '新名称', text_content: '新内容' };
await resumeAPI.updateResume(resumeId, updateData);

// 删除简历
await resumeAPI.deleteResume(resumeId);
```

## 文件管理

### 支持的文件格式
- **PDF** (.pdf)
- **Microsoft Word** (.doc, .docx)
- **纯文本** (直接创建)

### 文件大小限制
- 最大文件大小：**10MB**

### 文件存储
- 文件通过统一的文件管理系统存储
- 每个文件分配唯一的文件ID
- 支持在线预览和下载

## 最佳实践

### 1. 简历命名
- 使用有意义的名称，如 "软件工程师简历_张三_2024"
- 避免使用特殊字符
- 建议包含职位和姓名信息

### 2. 内容组织
纯文本简历建议包含以下部分：
- **个人信息**：姓名、联系方式、邮箱等
- **职业目标**：简短的职业规划描述
- **工作经历**：按时间倒序排列
- **教育背景**：学历、专业、毕业时间
- **专业技能**：核心技术栈和工具
- **项目经验**：重要项目的描述和成果
- **其他信息**：证书、获奖经历等

### 3. 版本管理
- 定期更新简历内容
- 为不同职位创建针对性版本
- 保留历史版本作为参考

### 4. AI 优化建议
- 上传最新版本的简历
- 提供具体的职位描述以获得更好的优化建议
- 仔细审查 AI 优化结果，保留个人特色

## 常见问题

### Q: 如何批量管理简历？
A: 目前支持单个简历的操作，批量功能将在后续版本中提供。

### Q: 简历删除后能恢复吗？
A: 简历删除是软删除，数据仍保留在数据库中。如需恢复请联系管理员。

### Q: 支持简历模板吗？
A: 当前版本专注于内容优化，模板功能计划在未来版本中添加。

### Q: 如何导出简历为其他格式？
A: 目前支持下载原始文件，PDF 导出功能正在开发中。

### Q: AI 优化的准确性如何？
A: AI 优化基于行业最佳实践，建议结合个人情况进行调整。

## 技术支持

如遇到问题或需要帮助，请：
1. 查看 [API 文档](./RESUME_MANAGEMENT_API.md)
2. 检查浏览器控制台错误信息
3. 联系技术支持团队

---

*最后更新：2024年1月*
