# 文件哈希字段迁移指南

本文档说明如何为现有的文件记录添加哈希值。

## 背景

为了实现文件去重功能，我们在 `files` 表中添加了 `hash` 字段。对于新上传的文件，系统会自动计算并存储哈希值。但对于已存在的文件记录，需要执行数据迁移来计算并填充哈希值。

## 迁移步骤

### 步骤 1: 备份数据库

在执行任何迁移操作之前，务必备份数据库：

```bash
# PostgreSQL 备份示例
pg_dump -h localhost -U your_user -d resume_polisher > backup_before_hash_migration.sql
```

### 步骤 2: 执行数据库结构迁移

运行 SQL 脚本添加 hash 字段：

```bash
cd /Users/hollway/projects/resume-polisher
psql -h localhost -U your_user -d resume_polisher -f scripts/migration_add_file_hash.sql
```

### 步骤 3: 运行数据迁移脚本

使用 Go 脚本为现有文件计算哈希值：

```bash
cd /Users/hollway/projects/resume-polisher/server
go run ../scripts/migrate_file_hash.go
```

**注意**: 脚本会自动读取 `config.yaml` 配置文件，确保配置文件存在且正确。

### 步骤 4: 验证迁移结果

检查是否所有文件都已有哈希值：

```sql
-- 查询没有哈希值的文件数量
SELECT COUNT(*) FROM files WHERE hash IS NULL OR hash = '';

-- 应该返回 0

-- 查看哈希值示例
SELECT id, hash, original_name FROM files LIMIT 10;
```

### 步骤 5: 添加 NOT NULL 约束（可选）

如果确认所有文件都已有哈希值，可以添加 NOT NULL 约束：

```sql
ALTER TABLE files ALTER COLUMN hash SET NOT NULL;
```

## 迁移脚本说明

### migrate_file_hash.go

该脚本的功能：
1. 连接到数据库
2. 查询所有没有哈希值的文件记录
3. 对每个文件：
   - 根据文件ID和扩展名构建存储路径
   - 读取物理文件内容
   - 计算 SHA256 哈希值
   - 更新数据库记录
4. 输出迁移统计信息

**输出示例**：
```
开始迁移文件哈希值...
找到 150 个需要计算哈希的文件
[1/150] 处理文件 T12345678901... 成功 (hash: 3a5b9c8d1e2f...)
[2/150] 处理文件 T12345678902... 成功 (hash: 4b6c0d9e2f3a...)
...
[150/150] 处理文件 T12345678950... 成功 (hash: 9f8e7d6c5b4a...)

迁移完成！
成功: 148, 失败: 0, 文件不存在: 2
警告: 还有 2 个文件未处理
```

## 常见问题

### Q: 如果物理文件不存在怎么办？

A: 脚本会跳过这些文件并记录为"文件不存在"。你需要手动清理这些数据库记录：

```sql
-- 查询物理文件不存在的记录
SELECT id, original_name FROM files WHERE hash IS NULL OR hash = '';

-- 手动删除这些记录（谨慎操作）
-- DELETE FROM files WHERE hash IS NULL OR hash = '';
```

### Q: 迁移需要多长时间？

A: 取决于文件数量和大小。通常：
- 小文件（< 1MB）：每个文件约 10-50ms
- 大文件（> 10MB）：每个文件约 100-500ms
- 1000 个文件约需 1-5 分钟

### Q: 可以重复运行迁移脚本吗？

A: 可以。脚本只处理没有哈希值的文件，已处理的文件会被跳过。

### Q: 如果发现两个不同的文件有相同的哈希值怎么办？

A: SHA256 碰撞概率极低（理论上可能但实际几乎不可能）。如果发生，需要人工检查：

```sql
-- 查找重复的哈希值
SELECT hash, COUNT(*) as count 
FROM files 
GROUP BY hash 
HAVING COUNT(*) > 1;
```

### Q: 如何回滚迁移？

A: 执行以下步骤：

```sql
-- 1. 删除唯一索引
DROP INDEX IF EXISTS idx_files_hash;

-- 2. 删除 hash 字段
ALTER TABLE files DROP COLUMN IF EXISTS hash;

-- 3. 恢复数据库备份（如果需要）
psql -h localhost -U your_user -d resume_polisher < backup_before_hash_migration.sql
```

## 注意事项

1. **备份重要性**: 在执行迁移前务必备份数据库
2. **停机时间**: 建议在低峰期执行迁移，或短暂停止服务
3. **文件完整性**: 确保物理文件存在且可读
4. **权限检查**: 确保脚本有权限读取文件存储目录
5. **并发安全**: 迁移期间避免其他程序修改文件表

## 验证清单

迁移完成后，请检查：

- [ ] 所有文件记录都有哈希值（hash 字段不为空）
- [ ] 唯一索引已创建（`idx_files_hash`）
- [ ] 新上传的文件能正常工作
- [ ] 上传相同文件时能正确识别并复用
- [ ] 简历版本号正确递增
- [ ] 没有异常错误日志

## 技术支持

如果遇到问题，请检查：
1. 服务器日志：`server/log/app.log`
2. 数据库连接配置
3. 文件存储路径配置
4. 文件系统权限

相关文档：
- [文件去重与简历版本管理功能](../docs/FILE_DEDUPLICATION_AND_VERSION_CONTROL.md)

