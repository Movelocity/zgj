# 简历上传功能前后端集成指南

## 概述

本文档描述了简历上传功能的前后端集成情况，包括数据表结构、API接口、前端组件以及测试方法。

## 后端数据表结构

### 1. ResumeRecord 表 (主要简历表)
```sql
- id: 简历ID (TLID)
- user_id: 用户ID
- resume_number: 简历编号 (格式: R{用户ID后6位}{序号})
- version: 版本号
- name: 简历名称
- original_filename: 原始文件名
- file_path: 文件存储路径
- file_size: 文件大小
- file_type: 文件类型
- text_content: 纯文本内容
- structured_data: 结构化数据 (JSON)
- status: 状态 (active/deleted)
- created_at: 创建时间
- updated_at: 更新时间
```

### 2. File 表 (统一文件管理表)
```sql
- id: 文件ID (TLID)
- original_name: 原始文件名
- extension: 文件扩展名
- mime_type: MIME类型
- size: 文件大小
- created_by: 上传用户ID
- created_at: 创建时间
- updated_at: 更新时间
```

### 3. UserProfile 表 (旧版用户档案表)
```sql
- id: 档案ID
- user_id: 用户ID
- data: 用户画像数据 (JSON)
- resumes: 简历列表 (JSON) - 已废弃，迁移到ResumeRecord表
```

## API 接口

### 简历专用接口
- `POST /api/user/resumes/upload` - 上传简历 (使用ResumeRecord表)
- `GET /api/user/resumes` - 获取简历列表
- `GET /api/user/resumes/:id` - 获取简历详情
- `PUT /api/user/resumes/:id` - 更新简历信息
- `DELETE /api/user/resumes/:id` - 删除简历

### 通用文件接口
- `POST /api/files/upload` - 通用文件上传 (使用File表)
- `GET /api/files/:id/preview` - 文件预览/下载 (公开访问)
- `GET /api/files/:id/info` - 获取文件信息 (公开访问)

### 管理员接口
- `GET /api/admin/files` - 获取文件列表
- `GET /api/admin/files/stats` - 获取文件统计
- `DELETE /api/admin/files/:id` - 删除文件
- `POST /api/admin/files/batch-delete` - 批量删除文件

## 前端组件

### 1. ResumeList.tsx
- 完整的简历列表页面
- 支持简历上传、查看、下载、删除
- 分页显示
- 文件类型和大小验证

### 2. SimpleResume.tsx
- 简历优化页面
- 集成了简历上传功能
- 模拟AI优化流程

### 3. ResumeUploadTest.tsx
- 专门的测试页面
- 测试文件上传、预览、下载功能
- 详细的测试日志

### 4. ResumeEditor.tsx (附件中的组件)
- 简历编辑器组件
- 支持在线编辑简历内容

## 前端类型定义

### 主要类型
```typescript
// 简历基本信息
interface ResumeInfo {
  id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 简历上传响应
interface ResumeUploadResponse {
  id: string;
  resume_number: string;
  url: string;
  filename: string;
  size: number;
}

// 文件上传响应
interface FileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: string;
}
```

## 测试步骤

### 1. 启动后端服务
```bash
cd server
go run main.go
```

### 2. 启动前端服务
```bash
cd web
pnpm dev
```

### 3. 访问测试页面
- 简历列表: `http://localhost:5173/resume/list`
- 简历优化: `http://localhost:5173/resume/simple`
- 上传测试: `http://localhost:5173/resume/upload-test` (需要添加路由)

### 4. 测试功能
1. **文件上传测试**
   - 选择PDF/DOC/DOCX文件
   - 验证文件类型和大小限制
   - 检查上传响应数据

2. **文件预览测试**
   - 点击预览按钮
   - 验证文件能否在浏览器中打开

3. **文件下载测试**
   - 点击下载按钮
   - 验证文件能否正确下载

4. **简历管理测试**
   - 查看简历列表
   - 删除简历
   - 分页功能

## 集成状态

### ✅ 已完成
- [x] 后端数据表模型分析
- [x] API接口梳理和验证
- [x] 前端类型定义更新
- [x] 前端API调用修复
- [x] 简历列表组件实现
- [x] 简历上传功能集成
- [x] 测试页面创建

### 🔄 进行中
- [ ] 完整的端到端测试
- [ ] 错误处理优化

### 📋 待办事项
- [ ] 添加文件上传进度显示
- [ ] 实现简历内容解析功能
- [ ] 添加简历版本管理
- [ ] 优化文件存储策略
- [ ] 添加文件安全扫描

## 注意事项

1. **文件存储路径**: 后端使用TLID前6位作为目录结构
2. **文件访问**: 预览和下载接口为公开访问，无需认证
3. **文件类型限制**: 仅支持PDF、DOC、DOCX格式
4. **文件大小限制**: 最大10MB
5. **数据迁移**: 支持从旧的UserProfile表迁移数据到新的ResumeRecord表

## 故障排除

### 常见问题
1. **文件上传失败**: 检查文件大小和类型限制
2. **文件预览失败**: 检查文件路径和存储权限
3. **API调用失败**: 检查认证状态和网络连接
4. **类型错误**: 确保前后端数据结构一致

### 调试工具
- 浏览器开发者工具网络面板
- 后端日志输出
- 测试页面的详细日志功能
