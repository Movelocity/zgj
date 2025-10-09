# 简历版本重整理 API 文档

## 概述

这个API用于触发文件整理和已有简历版本重计算，按存储的文件哈希来识别相同简历，按时间重新分配版本号。

## 背景

在实现了基于文件哈希的去重功能后，可能会出现以下情况：
1. 已有的简历记录版本号不连续
2. 相同文件的简历记录使用了不同的resume_number
3. 需要统一整理版本号，使其按时间顺序递增

本API提供了一键整理功能，可以：
- 按文件哈希识别相同的简历文件
- 将相同文件的简历记录归为一组
- 按创建时间重新分配版本号（1, 2, 3...）
- 统一相同文件的resume_number

## API 端点

### 重新整理简历版本

**路径**: `POST /api/admin/migration/reorganize-versions`

**权限**: 仅管理员可访问

**请求头**:
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**请求参数**: 无

**响应示例**:

成功响应（code = 0）:
```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "processed_users": 5,
    "processed_resumes": 23,
    "updated_versions": 8,
    "errors": []
  }
}
```

带警告的成功响应:
```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "processed_users": 5,
    "processed_resumes": 20,
    "updated_versions": 8,
    "errors": [
      "简历 ABC123: 文件 XYZ789 没有哈希值",
      "简历 DEF456: 无法查询文件 UVW012"
    ]
  }
}
```

失败响应（code != 0）:
```json
{
  "code": 1,
  "message": "简历版本整理失败: 查询用户列表失败"
}
```

## 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| processed_users | int | 成功处理的用户数量 |
| processed_resumes | int | 处理的简历记录总数 |
| updated_versions | int | 实际更新了版本号的简历数量 |
| errors | []string | 错误信息列表（可能为空） |

## 处理逻辑

### 1. 用户级别处理
- 遍历系统中的所有用户
- 对每个用户单独进行简历整理

### 2. 简历分组
对每个用户的简历记录：
- 查询所有状态为 `active` 的简历记录
- 按 `file_id` 关联查询对应的文件记录
- **自动计算缺失的哈希值**：如果文件没有哈希值，自动读取文件并计算SHA256哈希，然后更新到数据库
- 按文件的 `hash` 字段进行分组
- 纯文本简历（无file_id）单独处理，每个都是独立版本

### 3. 版本号重新分配
对每个哈希组：
- 按 `created_at` 时间升序排列
- 重新分配版本号：第1个为v1，第2个为v2，以此类推
- 如果版本号已经正确，则跳过更新

### 4. Resume Number 统一
对于同一哈希组内的多个版本：
- 使用最早的（第一个）简历记录的 `resume_number`
- 将其他版本的 `resume_number` 统一更新为相同值

## 使用场景

### 场景1: 初次部署后整理
在新部署文件哈希去重功能后，对已有数据进行一次性整理：

```bash
curl -X POST https://your-domain.com/api/admin/migration/reorganize-versions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 场景2: 定期维护
在系统运行一段时间后，定期执行整理以保持数据一致性。

### 场景3: 数据迁移后
在进行数据迁移或导入操作后，确保版本号的正确性。

## 注意事项

1. **管理员权限**: 此操作仅限管理员执行，需要有效的管理员token
2. **幂等性**: 多次执行此操作是安全的，已经正确的版本号不会被重复更新
3. **性能**: 对大量用户和简历的系统，此操作可能需要较长时间
4. **错误处理**: 即使部分简历处理失败，操作仍会继续，失败信息会记录在 `errors` 字段中
5. **数据完整性**: 需要确保 `files` 表中的记录都有正确的 `hash` 值

## 与文件哈希迁移的关系

**✨ 新特性：自动计算缺失的哈希值**

从 v2.0 开始，版本重整理API会自动为缺失哈希值的文件计算并保存哈希值，因此**不再强制要求**先运行迁移脚本。

### 推荐流程

**方式A：直接执行整理（推荐）**
```bash
# 直接调用版本重整理API，会自动处理缺失的哈希值
curl -X POST https://your-domain.com/api/admin/migration/reorganize-versions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**方式B：先批量迁移（大量文件时更高效）**
```bash
# 1. 先执行数据库迁移，添加hash字段（如果还没有）
psql -U your_user -d your_database -f scripts/migration_add_file_hash.sql

# 2. 批量计算所有文件的哈希值（推荐用于大量文件）
cd /path/to/server
go run scripts/migrate_file_hash.go

# 3. 最后调用版本重整理API
curl -X POST https://your-domain.com/api/admin/migration/reorganize-versions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**说明：**
- 整理API会在处理过程中自动计算并保存缺失的哈希值
- 对于少量文件，直接使用整理API即可
- 对于大量文件（1000+），建议先运行 `migrate_file_hash.go` 批量处理，效率更高

## 前端集成示例

### React 示例

```typescript
import { showSuccess, showError } from '@/utils/toast';
import { adminApi } from '@/api/admin';

const handleReorganizeVersions = async () => {
  try {
    const response = await adminApi.reorganizeResumeVersions();
    
    if (response.code === 0) {
      const { processed_users, processed_resumes, updated_versions, errors } = response.data;
      
      if (errors.length > 0) {
        showWarning(
          `处理完成，但有 ${errors.length} 个错误。` +
          `处理了 ${processed_users} 个用户，${processed_resumes} 份简历，` +
          `更新了 ${updated_versions} 个版本号。`,
          5000
        );
        console.error('整理错误:', errors);
      } else {
        showSuccess(
          `成功整理了 ${processed_users} 个用户的简历，` +
          `处理 ${processed_resumes} 份简历，更新 ${updated_versions} 个版本号。`
        );
      }
    } else {
      showError(response.message);
    }
  } catch (error) {
    showError('版本整理失败: ' + error.message);
  }
};
```

### API 客户端方法

在 `web/src/api/admin.ts` 中添加：

```typescript
export const adminApi = {
  // ... 其他方法
  
  /**
   * 重新整理简历版本
   */
  reorganizeResumeVersions: async () => {
    return apiClient.post('/api/admin/migration/reorganize-versions');
  },
};
```

## 测试建议

### 1. 准备测试数据
```sql
-- 创建测试场景：同一文件被上传多次
-- 确保这些记录有相同的file_id（指向同一个hash的文件）
SELECT 
  rr.id, 
  rr.resume_number, 
  rr.version, 
  rr.created_at,
  f.hash
FROM resume_records rr
JOIN files f ON rr.file_id = f.id
WHERE rr.user_id = 'test_user_id'
ORDER BY f.hash, rr.created_at;
```

### 2. 执行整理
调用API进行整理

### 3. 验证结果
```sql
-- 验证版本号是否按时间顺序正确分配
SELECT 
  rr.id, 
  rr.resume_number, 
  rr.version, 
  rr.created_at,
  f.hash
FROM resume_records rr
JOIN files f ON rr.file_id = f.id
WHERE rr.user_id = 'test_user_id'
ORDER BY f.hash, rr.created_at;

-- 应该看到：
-- 1. 相同hash的简历有相同的resume_number
-- 2. 版本号按时间递增：1, 2, 3...
```

## 常见问题

### Q: 执行整理会不会影响用户使用？
A: 整理操作只是更新数据库中的版本号和简历编号字段，不会影响文件内容和用户的正常使用。建议在低峰时段执行。

### Q: 如果有些文件没有hash值怎么办？
A: **系统会自动计算并保存哈希值**。从 v2.0 开始，整理API会在处理过程中自动为缺失哈希值的文件计算SHA256哈希。如果文件不存在或读取失败，会记录在错误信息中。

### Q: 整理后原来的版本号会丢失吗？
A: 版本号会被重新计算，但基于创建时间的顺序关系保持不变。如果需要保留原始版本号，建议在执行前做好数据备份。

### Q: 可以针对单个用户执行整理吗？
A: 当前API会处理所有用户。如需针对单个用户，可以修改代码或在数据库层面手动处理。

## 相关文档

- [文件去重和版本控制实现文档](./FILE_DEDUPLICATION_AND_VERSION_CONTROL.md)
- [简历管理API文档](./RESUME_MANAGEMENT_API.md)
- [迁移脚本说明](../scripts/MIGRATION_README.md)

