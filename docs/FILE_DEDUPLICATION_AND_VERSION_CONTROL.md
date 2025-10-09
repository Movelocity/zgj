# 文件去重与简历版本管理功能

## 概述

本文档描述了文件去重和简历版本管理功能的实现细节。该功能主要解决以下问题：

1. **文件去重**：避免重复存储相同的文件，节省存储空间
2. **简历版本管理**：当用户上传相同文件时，自动创建新版本而不是新简历

## 实现细节

### 1. 文件哈希计算

**文件位置**: `server/utils/hash.go`

新增了 `CalculateFileHash` 函数，使用 SHA256 算法计算文件哈希值：

```go
func CalculateFileHash(fileHeader *multipart.FileHeader) (string, error)
```

该函数读取上传的文件内容，计算其 SHA256 哈希值并返回十六进制字符串。

### 2. File 模型变更

**文件位置**: `server/model/file.go`

在 `File` 模型中添加了 `Hash` 字段：

```go
type File struct {
    ID           string    // 文件ID(TLID)
    Hash         string    // 文件SHA256哈希值（新增）
    DifyID       string    
    OriginalName string    
    Extension    string    
    MimeType     string    
    Size         int64     
    CreatedBy    string    
    CreatedAt    time.Time 
    UpdatedAt    time.Time 
    User         User      
}
```

**数据库变更**：
- 添加 `hash` 字段：`varchar(64)`
- 创建唯一索引：`uniqueIndex` on `hash`

### 3. 文件上传服务去重逻辑

**文件位置**: `server/service/file/file_service.go`

修改了 `UploadFile` 函数，实现基于哈希的文件去重：

**处理流程**：
1. 计算上传文件的哈希值
2. 查询数据库是否存在相同哈希的文件
3. 如果存在：
   - 直接返回已有文件的信息
   - 不创建新的物理文件
   - 不创建新的数据库记录
4. 如果不存在：
   - 创建新的文件记录（包含哈希值）
   - 保存物理文件

**优势**：
- 节省存储空间
- 提高上传效率（相同文件无需重复传输和存储）
- 保持数据一致性

### 4. 简历版本管理逻辑

**文件位置**: `server/service/resume/resume_service.go`

修改了 `UploadResume` 函数，实现智能版本管理：

**处理流程**：

```
用户上传简历文件
    ↓
文件服务检查哈希（去重）
    ↓
返回文件ID（可能是已存在的）
    ↓
查询是否存在相同 user_id + file_id 的简历记录
    ↓
    ├─ 存在 → 复用简历号，版本号+1
    └─ 不存在 → 生成新简历号，版本号=1
    ↓
创建新的简历记录
    ↓
不复用 text_content 和 structured_data
```

**关键逻辑**：

```go
// 查询相同用户的相同文件
err = global.DB.Where("user_id = ? AND file_id = ? AND status = ?", 
    userID, uploadedFile.ID, "active").
    Order("version DESC").
    First(&existingResume).Error

if err == nil {
    // 找到相同文件，复用简历号，版本号+1
    resumeNumber = existingResume.ResumeNumber
    version = existingResume.Version + 1
} else if errors.Is(err, gorm.ErrRecordNotFound) {
    // 新文件，生成新简历号
    resumeNumber = s.generateResumeNumber(userID)
    version = 1
}
```

**重要说明**：
- `text_content` 和 `structured_data` 始终为空，不从旧版本复用
- 每次上传都会创建新的简历记录，即使文件内容相同
- 版本号自动递增，确保版本追踪

## 数据库迁移

需要执行以下 SQL 来更新数据库结构：

```sql
-- 添加 hash 字段
ALTER TABLE files ADD COLUMN hash VARCHAR(64);

-- 为 hash 字段创建唯一索引
CREATE UNIQUE INDEX idx_files_hash ON files(hash);

-- 为现有文件添加 NOT NULL 约束（在数据迁移后）
-- ALTER TABLE files ALTER COLUMN hash SET NOT NULL;
```

**注意**：对于已存在的文件记录，需要编写数据迁移脚本来计算并填充 hash 值。

## 使用场景

### 场景1：首次上传简历
```
用户A上传 resume.pdf
→ 计算哈希: abc123...
→ 未找到相同哈希的文件
→ 创建文件记录（ID=F001, Hash=abc123）
→ 创建简历记录（ResumeNumber=R001, Version=1, FileID=F001）
```

### 场景2：上传相同文件（哈希碰撞）
```
用户A再次上传相同的 resume.pdf
→ 计算哈希: abc123...
→ 找到相同哈希的文件（ID=F001）
→ 复用文件记录 F001
→ 查询发现该用户已有该文件的简历记录
→ 创建新简历记录（ResumeNumber=R001, Version=2, FileID=F001）
```

### 场景3：不同用户上传相同文件
```
用户B上传与用户A相同的 resume.pdf
→ 计算哈希: abc123...
→ 找到相同哈希的文件（ID=F001）
→ 复用文件记录 F001
→ 查询发现该用户没有该文件的简历记录
→ 创建新简历记录（ResumeNumber=R002, Version=1, FileID=F001）
```

### 场景4：上传不同文件
```
用户A上传新的 resume_v2.pdf
→ 计算哈希: xyz789...
→ 未找到相同哈希的文件
→ 创建文件记录（ID=F002, Hash=xyz789）
→ 创建简历记录（ResumeNumber=R003, Version=1, FileID=F002）
```

## API 响应示例

### 首次上传
```json
{
  "code": 0,
  "data": {
    "id": "T001",
    "resume_number": "R001",
    "url": "/api/files/F001/preview",
    "filename": "resume.pdf",
    "size": 102400
  }
}
```

### 版本更新（相同文件）
```json
{
  "code": 0,
  "data": {
    "id": "T002",
    "resume_number": "R001",  // 简历号相同
    "url": "/api/files/F001/preview",  // 文件ID相同
    "filename": "resume.pdf",
    "size": 102400
  }
}
```

## 注意事项

1. **哈希碰撞处理**：虽然 SHA256 碰撞概率极低，但理论上可能存在。当前实现假设哈希唯一性。

2. **text_content 和 structured_data**：这两个字段在版本更新时不会复用，需要重新提取和处理。

3. **物理文件清理**：当文件记录被删除但有多个简历引用时，需要谨慎处理物理文件删除逻辑。

4. **版本号管理**：版本号基于用户+文件ID组合，每个用户对同一文件的版本号独立计算。

5. **数据库事务**：建议在实际使用中添加事务处理，确保文件记录和简历记录的一致性。

## 后续优化建议

1. **添加事务处理**：确保文件和简历记录创建的原子性
2. **文件引用计数**：跟踪文件被多少简历引用，优化删除逻辑
3. **异步哈希计算**：对于大文件，考虑异步计算哈希值
4. **哈希索引优化**：根据实际使用情况优化索引策略
5. **版本历史查询**：提供 API 查询某个简历的所有版本
6. **版本对比功能**：支持不同版本之间的内容对比

## 相关文件

- `server/utils/hash.go` - 哈希计算工具
- `server/model/file.go` - 文件模型定义
- `server/model/resume.go` - 简历模型定义
- `server/service/file/file_service.go` - 文件服务实现
- `server/service/resume/resume_service.go` - 简历服务实现
- `server/api/resume/resume.go` - 简历上传API

