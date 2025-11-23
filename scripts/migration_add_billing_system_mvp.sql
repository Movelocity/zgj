-- Migration: Add Billing System MVP Tables
-- Description: Create 3 core tables for subscription management (MVP version)
-- Date: 2025-11-23

-- Table 1: billing_action_prices - Action pricing configuration
CREATE TABLE IF NOT EXISTS billing_action_prices (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    action_key VARCHAR(50) NOT NULL UNIQUE,
    action_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    credits_cost INT NOT NULL DEFAULT 1,
    
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    
    metadata JSONB
);

CREATE INDEX idx_billing_action_prices_active ON billing_action_prices(is_active);
CREATE INDEX idx_billing_action_prices_key ON billing_action_prices(action_key);

COMMENT ON TABLE billing_action_prices IS 'Action pricing configuration table';
COMMENT ON COLUMN billing_action_prices.action_key IS 'Unique action identifier (e.g., resume_optimize, ai_chat)';
COMMENT ON COLUMN billing_action_prices.credits_cost IS 'Credits required for one action';

-- Table 2: billing_packages - Package definitions
CREATE TABLE IF NOT EXISTS billing_packages (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    package_type VARCHAR(20) NOT NULL,
    
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    original_price DECIMAL(10,2),
    
    credits_amount INT NOT NULL,
    validity_days INT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    
    metadata JSONB
);

CREATE INDEX idx_billing_packages_active ON billing_packages(is_active, is_visible);
CREATE INDEX idx_billing_packages_type ON billing_packages(package_type);

COMMENT ON TABLE billing_packages IS 'Billing package definitions';
COMMENT ON COLUMN billing_packages.package_type IS 'Package type: duration/credits/hybrid/permanent';
COMMENT ON COLUMN billing_packages.credits_amount IS 'Total credits in package';
COMMENT ON COLUMN billing_packages.validity_days IS 'Valid days (0=permanent)';

-- Table 3: user_billing_packages - User package instances
CREATE TABLE IF NOT EXISTS user_billing_packages (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    user_id VARCHAR(20) NOT NULL,
    billing_package_id BIGINT NOT NULL,
    
    package_name VARCHAR(100) NOT NULL,
    package_type VARCHAR(20) NOT NULL,
    
    total_credits INT NOT NULL,
    used_credits INT DEFAULT 0,
    remaining_credits INT NOT NULL,
    
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    status VARCHAR(20) DEFAULT 'pending',
    priority INT DEFAULT 0,
    
    source VARCHAR(50) DEFAULT 'purchase',
    order_id VARCHAR(50),
    
    notes TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_billing_packages_user ON user_billing_packages(user_id, status, priority);
CREATE INDEX idx_user_billing_packages_expires ON user_billing_packages(expires_at);
CREATE INDEX idx_user_billing_packages_package ON user_billing_packages(billing_package_id);

COMMENT ON TABLE user_billing_packages IS 'User billing package instances';
COMMENT ON COLUMN user_billing_packages.status IS 'Status: pending/active/expired/depleted';
COMMENT ON COLUMN user_billing_packages.priority IS 'Deduction priority (smaller first)';
COMMENT ON COLUMN user_billing_packages.source IS 'Source: purchase/gift/promotion/system';

-- Insert preset action prices (MVP)
INSERT INTO billing_action_prices (action_key, action_name, description, credits_cost, is_active, sort_order) VALUES
    ('resume_optimize', '简历优化', '简历内容优化服务', 1, true, 1),
    ('ai_chat', 'AI对话', 'AI智能对话服务', 1, true, 2),
    ('pdf_export', 'PDF导出', '简历PDF导出服务', 1, true, 3),
    ('advanced_analysis', '高级分析', '简历深度分析服务', 3, true, 4)
ON CONFLICT (action_key) DO NOTHING;

-- Insert default package template (MVP)
INSERT INTO billing_packages (name, description, package_type, price, original_price, credits_amount, validity_days, is_active, is_visible, sort_order) VALUES
    ('新用户体验包', '新用户注册赠送的体验套餐，包含10积分', 'credits', 0, 0, 10, 30, true, false, 1),
    ('月度会员', '月度会员套餐，30天内100积分', 'hybrid', 2900, 3900, 100, 30, true, true, 2)
ON CONFLICT DO NOTHING;

-- Rollback script (comment out, for reference):
-- DROP TABLE IF EXISTS user_billing_packages;
-- DROP TABLE IF EXISTS billing_packages;
-- DROP TABLE IF EXISTS billing_action_prices;

