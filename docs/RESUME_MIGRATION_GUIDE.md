# 简历数据迁移指南

## 概述

本次更新将后台 resume record 的 `FilePath` 字段改为 `file_id`，全局禁止存储文件路径到数据库，杜绝任何路径拼接异常。

## 主要变更

### 1. 数据库结构变更

**ResumeRecord 表字段变更:**
- 移除: `file_path` (varchar(500))
- 新增: `file_id` (varchar(20), index) - 关联 files 表的 ID

### 2. 代码变更

**后端变更:**
- `server/model/resume.go`: ResumeRecord 结构体字段更新
- `server/service/resume/types.go`: 服务层类型定义更新
- `server/service/resume/resume_service.go`: 使用统一文件服务
- `server/service/user/user_service.go`: 头像和简历上传使用统一文件服务
- `server/api/user/user.go`: API 层使用统一文件服务

**前端变更:**
- `web/src/types/resume.ts`: 接口定义更新
- `web/src/pages/resume/ResumeList.tsx`: 文件下载逻辑更新

## 数据迁移步骤

### 1. 数据库迁移 SQL

```sql
-- 1. 为 resume_records 表添加 file_id 字段
ALTER TABLE resume_records ADD COLUMN file_id VARCHAR(20);
ALTER TABLE resume_records ADD INDEX idx_file_id (file_id);

-- 2. 为现有简历创建文件记录并更新 file_id
-- 注意: 这需要根据实际的文件路径结构来调整
-- 以下是示例 SQL，需要根据实际情况修改

-- 3. 删除旧的 file_path 字段 (在确认迁移成功后执行)
-- ALTER TABLE resume_records DROP COLUMN file_path;
```

### 2. 使用管理员 API 迁移

系统提供了管理员 API 来自动迁移数据:

```bash
# 迁移文件数据
POST /api/admin/files/migrate

# 迁移简历数据  
POST /api/admin/resumes/migrate
```

### 3. 手动迁移步骤

如果需要手动迁移:

1. **备份数据库**
   ```bash
   # 备份整个数据库
   mysqldump -u username -p database_name > backup.sql
   ```

2. **创建文件记录**
   - 遍历所有 resume_records 中的 file_path
   - 为每个文件在 files 表中创建对应记录
   - 更新 resume_records 的 file_id 字段

3. **验证迁移**
   - 确认所有简历都有对应的 file_id
   - 测试文件下载功能
   - 测试简历上传功能

## 新的文件访问方式

### 前端访问文件

**旧方式 (已废弃):**
```javascript
// 直接使用文件路径
const fileUrl = resume.file_path;
```

**新方式:**
```javascript
// 使用文件 ID 通过 API 访问
const fileUrl = `/api/files/${resume.file_id}/preview`;
const downloadUrl = `/api/files/${resume.file_id}/preview?as_attachment=true`;
```

### 后端文件处理

**统一文件服务:**
- 所有文件上传使用 `fileService.FileService.UploadFile()`
- 文件访问通过 `/api/files/{id}/preview` 端点
- 文件存储路径由系统根据文件 ID 自动生成

## 优势

1. **安全性提升**: 消除路径拼接导致的安全风险
2. **一致性**: 所有文件使用统一的访问方式
3. **可维护性**: 文件路径逻辑集中管理
4. **扩展性**: 便于后续添加文件权限控制、CDN 等功能

## 注意事项

1. **兼容性**: 旧的文件路径访问方式将不再工作
2. **性能**: 文件访问现在需要通过数据库查询文件信息
3. **存储**: 确保 files 表有足够的存储空间
4. **权限**: 文件访问现在可以进行权限控制

## 回滚方案

如果需要回滚到旧版本:

1. 保留 file_path 字段 (不要执行删除 SQL)
2. 恢复旧版本代码
3. 如有必要，从备份恢复数据库

## 测试建议

1. **功能测试**:
   - 简历上传
   - 简历下载
   - 简历列表显示
   - 文件预览

2. **性能测试**:
   - 大量文件的访问性能
   - 数据库查询性能

3. **安全测试**:
   - 文件访问权限
   - 路径遍历攻击防护
