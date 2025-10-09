-- 测试简历版本重整理功能的SQL脚本

-- ==========================================
-- 1. 查看整理前的数据状态
-- ==========================================

-- 查看所有简历记录及其对应的文件哈希
SELECT 
    rr.id AS resume_id,
    rr.user_id,
    rr.resume_number,
    rr.version,
    rr.name,
    rr.created_at,
    f.id AS file_id,
    f.hash AS file_hash,
    f.original_name AS file_original_name
FROM resume_records rr
LEFT JOIN files f ON rr.file_id = f.id
WHERE rr.status = 'active'
ORDER BY rr.user_id, f.hash, rr.created_at;

-- ==========================================
-- 2. 查看相同文件（相同hash）的多个版本
-- ==========================================

-- 查找有相同文件哈希的简历记录（可能版本号不正确）
SELECT 
    f.hash,
    COUNT(*) AS version_count,
    STRING_AGG(DISTINCT rr.resume_number, ', ') AS resume_numbers,
    STRING_AGG(rr.version::text, ', ' ORDER BY rr.created_at) AS versions,
    MIN(rr.created_at) AS first_upload,
    MAX(rr.created_at) AS last_upload
FROM resume_records rr
JOIN files f ON rr.file_id = f.id
WHERE rr.status = 'active' AND f.hash IS NOT NULL AND f.hash != ''
GROUP BY f.hash, rr.user_id
HAVING COUNT(*) > 1
ORDER BY version_count DESC;

-- ==========================================
-- 3. 检查版本号是否连续
-- ==========================================

-- 查找版本号不连续的简历组
WITH ranked_resumes AS (
    SELECT 
        rr.id,
        rr.user_id,
        rr.resume_number,
        rr.version,
        f.hash,
        rr.created_at,
        ROW_NUMBER() OVER (PARTITION BY rr.user_id, f.hash ORDER BY rr.created_at) AS expected_version
    FROM resume_records rr
    LEFT JOIN files f ON rr.file_id = f.id
    WHERE rr.status = 'active'
)
SELECT 
    user_id,
    resume_number,
    hash,
    version AS current_version,
    expected_version,
    (version - expected_version) AS version_diff
FROM ranked_resumes
WHERE version != expected_version
ORDER BY user_id, hash, created_at;

-- ==========================================
-- 4. 查看没有哈希值的文件
-- ==========================================

-- 这些文件需要先运行 migrate_file_hash.go 脚本
SELECT 
    f.id,
    f.original_name,
    f.extension,
    f.size,
    f.created_by,
    f.created_at,
    COUNT(rr.id) AS resume_count
FROM files f
LEFT JOIN resume_records rr ON rr.file_id = f.id AND rr.status = 'active'
WHERE f.hash IS NULL OR f.hash = ''
GROUP BY f.id
ORDER BY f.created_at DESC;

-- ==========================================
-- 5. 统计信息
-- ==========================================

-- 用户简历统计
SELECT 
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT rr.id) AS total_resumes,
    COUNT(DISTINCT rr.resume_number) AS unique_resume_numbers,
    COUNT(DISTINCT f.hash) AS unique_file_hashes
FROM users u
LEFT JOIN resume_records rr ON rr.user_id = u.id AND rr.status = 'active'
LEFT JOIN files f ON rr.file_id = f.id
GROUP BY u.id, u.username
HAVING COUNT(DISTINCT rr.id) > 0
ORDER BY total_resumes DESC;

-- 文件去重效果统计
SELECT 
    'Total Files' AS metric,
    COUNT(*) AS count
FROM files
WHERE hash IS NOT NULL AND hash != ''
UNION ALL
SELECT 
    'Unique File Hashes' AS metric,
    COUNT(DISTINCT hash) AS count
FROM files
WHERE hash IS NOT NULL AND hash != ''
UNION ALL
SELECT 
    'Duplicate Files (saved by deduplication)' AS metric,
    COUNT(*) - COUNT(DISTINCT hash) AS count
FROM files
WHERE hash IS NOT NULL AND hash != '';

-- ==========================================
-- 6. 整理后验证脚本
-- ==========================================

-- 运行整理API后，执行以下查询验证结果

-- 验证：相同哈希的简历是否有相同的resume_number
SELECT 
    f.hash,
    COUNT(DISTINCT rr.resume_number) AS unique_resume_numbers,
    STRING_AGG(DISTINCT rr.resume_number, ', ') AS resume_numbers,
    COUNT(*) AS version_count
FROM resume_records rr
JOIN files f ON rr.file_id = f.id
WHERE rr.status = 'active' AND f.hash IS NOT NULL AND f.hash != ''
GROUP BY f.hash, rr.user_id
HAVING COUNT(DISTINCT rr.resume_number) > 1;
-- 结果应该为空

-- 验证：版本号是否按时间正确递增
WITH ranked_resumes AS (
    SELECT 
        rr.id,
        rr.user_id,
        rr.resume_number,
        rr.version,
        f.hash,
        rr.created_at,
        ROW_NUMBER() OVER (PARTITION BY rr.user_id, f.hash ORDER BY rr.created_at) AS expected_version
    FROM resume_records rr
    LEFT JOIN files f ON rr.file_id = f.id
    WHERE rr.status = 'active'
)
SELECT COUNT(*) AS incorrect_versions
FROM ranked_resumes
WHERE version != expected_version;
-- 结果应该为 0

-- ==========================================
-- 7. 清理测试数据（可选）
-- ==========================================

-- 如果需要重置测试，可以删除测试数据
-- 注意：请谨慎使用，确保只删除测试数据！

-- DELETE FROM resume_records WHERE user_id = 'test_user_id';
-- DELETE FROM files WHERE created_by = 'test_user_id';

