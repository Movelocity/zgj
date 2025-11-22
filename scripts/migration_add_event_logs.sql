-- =====================================================
-- 用户事件日志表迁移脚本
-- 创建时间: 2025-11-22
-- 用途: 记录用户关键操作和系统事件，支持审计和分析
-- =====================================================

-- 创建事件日志表
CREATE TABLE IF NOT EXISTS user_event_logs (
    -- 主键和时间
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- 用户和事件信息
    user_id VARCHAR(20) NOT NULL DEFAULT '',  -- 用户ID，空字符串表示未登录或匿名
    event_type VARCHAR(50) NOT NULL,          -- 事件类型（如user_login, user_register）
    event_category VARCHAR(20) NOT NULL,      -- 事件分类（auth, user, resume, payment, system）
    
    -- 安全相关信息
    ip_address VARCHAR(45),                   -- IP地址，支持IPv6
    user_agent TEXT,                          -- User-Agent字符串
    
    -- 业务资源关联
    resource_type VARCHAR(50),                -- 资源类型（如resume, order）
    resource_id VARCHAR(50),                  -- 资源ID
    
    -- 状态和错误信息
    status VARCHAR(20) DEFAULT 'success',     -- 状态：success/failed/error
    error_message TEXT,                       -- 错误信息（如果失败）
    
    -- 事件详情（JSON格式）
    details JSONB                             -- 事件详细信息，灵活存储
);

-- 创建注释
COMMENT ON TABLE user_event_logs IS '用户事件日志表，记录所有关键操作和系统事件';
COMMENT ON COLUMN user_event_logs.id IS '自增主键';
COMMENT ON COLUMN user_event_logs.created_at IS '事件发生时间';
COMMENT ON COLUMN user_event_logs.user_id IS '用户ID，空字符串表示未登录';
COMMENT ON COLUMN user_event_logs.event_type IS '事件类型，如user_login';
COMMENT ON COLUMN user_event_logs.event_category IS '事件分类：auth/user/resume/payment/system';
COMMENT ON COLUMN user_event_logs.ip_address IS '客户端IP地址';
COMMENT ON COLUMN user_event_logs.user_agent IS '客户端User-Agent';
COMMENT ON COLUMN user_event_logs.resource_type IS '关联资源类型';
COMMENT ON COLUMN user_event_logs.resource_id IS '关联资源ID';
COMMENT ON COLUMN user_event_logs.status IS '事件状态：success/failed/error';
COMMENT ON COLUMN user_event_logs.error_message IS '错误信息（如果失败）';
COMMENT ON COLUMN user_event_logs.details IS '事件详情JSON';

-- =====================================================
-- 创建索引
-- =====================================================

-- 时间索引（倒序，最新记录优先）
CREATE INDEX IF NOT EXISTS idx_user_event_logs_time 
ON user_event_logs (created_at DESC);

-- 用户+时间组合索引（查询某用户的操作历史）
CREATE INDEX IF NOT EXISTS idx_user_event_logs_user 
ON user_event_logs (user_id, created_at DESC);

-- 事件类型+时间组合索引（统计某类事件）
CREATE INDEX IF NOT EXISTS idx_user_event_logs_type 
ON user_event_logs (event_type, created_at DESC);

-- 事件分类+时间组合索引（按分类查询）
CREATE INDEX IF NOT EXISTS idx_user_event_logs_category 
ON user_event_logs (event_category, created_at DESC);

-- JSONB字段的GIN索引（可选，用于details字段查询）
-- CREATE INDEX IF NOT EXISTS idx_user_event_logs_details 
-- ON user_event_logs USING GIN (details);

-- =====================================================
-- 验证和测试数据（可选）
-- =====================================================

-- 插入测试数据
-- INSERT INTO user_event_logs (user_id, event_type, event_category, ip_address, user_agent, status, details)
-- VALUES 
-- ('test_user_001', 'user_login', 'auth', '192.168.1.100', 'Mozilla/5.0...', 'success', '{"method": "password"}'),
-- ('test_user_001', 'resume_upload', 'resume', '192.168.1.100', 'Mozilla/5.0...', 'success', '{"filename": "resume.pdf", "size": 102400}'),
-- ('', 'login_failed', 'auth', '192.168.1.200', 'Mozilla/5.0...', 'failed', '{"phone": "13800138000", "reason": "password_error"}');

-- 查询验证
-- SELECT * FROM user_event_logs ORDER BY created_at DESC LIMIT 10;

-- 验证索引是否生效
-- EXPLAIN ANALYZE SELECT * FROM user_event_logs WHERE user_id = 'test_user_001' ORDER BY created_at DESC LIMIT 10;
-- EXPLAIN ANALYZE SELECT * FROM user_event_logs WHERE event_type = 'user_login' ORDER BY created_at DESC LIMIT 10;
-- EXPLAIN ANALYZE SELECT * FROM user_event_logs WHERE created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 100;

-- =====================================================
-- 回滚脚本（如需删除表）
-- =====================================================
-- DROP INDEX IF EXISTS idx_user_event_logs_time;
-- DROP INDEX IF EXISTS idx_user_event_logs_user;
-- DROP INDEX IF EXISTS idx_user_event_logs_type;
-- DROP INDEX IF EXISTS idx_user_event_logs_category;
-- DROP TABLE IF EXISTS user_event_logs;

