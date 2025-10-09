-- 数据库迁移脚本：为 files 表添加 hash 字段
-- 日期：2025-10-09
-- 功能：实现文件哈希去重功能

-- 步骤1: 添加 hash 字段（允许为 NULL）
ALTER TABLE files ADD COLUMN IF NOT EXISTS hash VARCHAR(64);

-- 步骤2: 为 hash 字段添加注释
COMMENT ON COLUMN files.hash IS '文件SHA256哈希值';

-- 步骤3: 创建临时函数用于计算已有文件的哈希值
-- 注意：这需要在应用层完成，因为需要读取物理文件内容
-- 以下是伪代码示例：
-- 
-- for each file in files where hash is null:
--     physicalPath = getPhysicalPath(file)
--     if fileExists(physicalPath):
--         hash = calculateSHA256(physicalPath)
--         UPDATE files SET hash = ? WHERE id = ?
--     else:
--         log warning: file not found

-- 步骤4: 在所有现有记录都有 hash 值后，添加 NOT NULL 约束
-- ALTER TABLE files ALTER COLUMN hash SET NOT NULL;

-- 步骤5: 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_files_hash ON files(hash);

-- 步骤6: 验证迁移
-- SELECT COUNT(*) FROM files WHERE hash IS NULL;
-- 应该返回 0

-- 回滚脚本（如需要）
-- DROP INDEX IF EXISTS idx_files_hash;
-- ALTER TABLE files DROP COLUMN IF EXISTS hash;

