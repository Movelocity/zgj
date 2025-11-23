# 设计文档：用户套餐订阅管理系统

## Context

系统需要支持灵活的套餐订阅模式，为不同用户提供差异化服务，并准确跟踪消费情况。核心挑战包括：

1. **套餐叠加**: 用户可能同时拥有多个套餐（如赠送的体验包 + 购买的月度会员）
2. **额度扣减顺序**: 多个套餐时，需要明确扣减优先级
3. **过期管理**: 自动处理过期套餐，不影响业务
4. **消费回滚**: 服务失败时需要退回消费额度
5. **并发安全**: 高并发场景下的额度扣减需要保证准确性

## Goals / Non-Goals

### Goals
- 支持多种套餐类型（时长型、次数型、混合型、永久型）
- 支持用户叠加多个套餐
- 提供原子性的额度扣减操作
- 完整记录所有消费行为
- 管理员可灵活配置套餐
- 用户可清晰查看套餐和消费情况

### Non-Goals
- 不包含支付功能（后续独立实现）
- 不包含自动续费逻辑
- 不包含套餐推荐算法
- 暂不支持套餐转让或分享

## Decisions

### 1. 数据库设计

#### 动作计价表 (billing_action_prices)
```sql
CREATE TABLE billing_action_prices (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  action_key VARCHAR(50) NOT NULL UNIQUE, -- 动作标识（如 resume_optimize, ai_chat, pdf_export）
  action_name VARCHAR(100) NOT NULL,      -- 动作显示名称
  description TEXT,                       -- 动作描述
  
  credits_cost INT NOT NULL DEFAULT 1,    -- 单次消耗积分数
  
  is_active BOOLEAN DEFAULT true,         -- 是否启用
  sort_order INT DEFAULT 0,               -- 排序
  
  metadata JSONB,                         -- 扩展字段
  
  INDEX idx_billing_action_prices_active (is_active),
  INDEX idx_billing_action_prices_key (action_key)
);
```

**设计要点**:
- `action_key` 作为唯一标识，代码中使用该key进行扣减
- `credits_cost` 定义该动作消耗的积分数，管理员可调整
- 预置常见动作，管理员可添加自定义动作

**预置动作示例**:
- `resume_optimize` - 简历优化（1积分）
- `ai_chat` - AI对话（1积分）
- `pdf_export` - PDF导出（1积分）
- `advanced_analysis` - 高级分析（3积分）

#### 套餐表 (billing_packages)
```sql
CREATE TABLE billing_packages (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  name VARCHAR(100) NOT NULL,           -- 套餐名称
  description TEXT,                     -- 套餐描述
  package_type VARCHAR(20) NOT NULL,    -- 套餐类型: duration/credits/hybrid/permanent
  
  price DECIMAL(10,2) NOT NULL,         -- 价格（分）
  original_price DECIMAL(10,2),         -- 原价（用于展示折扣）
  
  credits_amount INT,                   -- 积分数量
  validity_days INT,                    -- 有效天数（时长型/混合型，0表示永久）
  
  is_active BOOLEAN DEFAULT true,       -- 是否启用
  is_visible BOOLEAN DEFAULT true,      -- 是否前台可见
  sort_order INT DEFAULT 0,             -- 排序
  
  metadata JSONB,                       -- 扩展字段（如特权描述等）
  
  INDEX idx_billing_packages_active (is_active, is_visible),
  INDEX idx_billing_packages_type (package_type)
);
```

**设计要点**:
- `package_type` 区分套餐类型，支持纯积分、时长+积分组合
- `credits_amount` 统一使用积分，不再使用 quota/amount
- `validity_days` 和积分一起过期，过期后积分作废
- `metadata` JSONB字段用于扩展（如特权列表、标签等）

#### 用户套餐表 (user_billing_packages)
```sql
CREATE TABLE user_billing_packages (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  user_id VARCHAR(20) NOT NULL,         -- 用户ID
  billing_package_id BIGINT NOT NULL,   -- 套餐ID（快照，即使套餐删除也保留记录）
  
  package_name VARCHAR(100) NOT NULL,   -- 套餐名称快照
  package_type VARCHAR(20) NOT NULL,    -- 套餐类型快照
  
  total_credits INT,                    -- 总积分
  used_credits INT DEFAULT 0,           -- 已使用积分
  remaining_credits INT,                -- 剩余积分（冗余字段，便于查询）
  
  activated_at TIMESTAMP,               -- 激活时间
  expires_at TIMESTAMP,                 -- 过期时间（NULL表示永久）
  
  status VARCHAR(20) DEFAULT 'pending', -- 状态: pending/active/expired/depleted
  priority INT DEFAULT 0,               -- 扣减优先级（数字越小越优先）
  
  source VARCHAR(50) DEFAULT 'purchase',-- 来源: purchase/gift/promotion/system
  order_id VARCHAR(50),                 -- 关联订单ID（如果是购买）
  
  notes TEXT,                           -- 备注
  
  INDEX idx_user_billing_packages_user (user_id, status, priority),
  INDEX idx_user_billing_packages_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**设计要点**:
- **快照设计**: 保存套餐名称和类型快照，即使原套餐删除，用户记录仍完整
- **积分字段**: `remaining_credits = total_credits - used_credits`，冗余但提升查询效率
- **状态机**:
  - `pending`: 未激活（可延迟激活）
  - `active`: 使用中
  - `expired`: 已过期（积分作废）
  - `depleted`: 积分耗尽
- **priority**: 支持自定义扣减顺序（如赠送套餐优先消耗）
- **过期机制**: 套餐过期后，剩余积分全部作废，无法使用

#### 消费记录表 (billing_consumption_records)
```sql
CREATE TABLE billing_consumption_records (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  user_id VARCHAR(20) NOT NULL,         -- 用户ID
  user_package_id BIGINT NOT NULL,      -- 用户套餐ID
  
  action_key VARCHAR(50) NOT NULL,      -- 动作标识（关联 billing_action_prices）
  credits_cost INT NOT NULL,            -- 本次消耗的积分数（快照）
  
  resource_type VARCHAR(50),            -- 资源类型（如resume、conversation）
  resource_id VARCHAR(50),              -- 资源ID
  
  status VARCHAR(20) DEFAULT 'success', -- 状态: success/failed/refunded
  refund_reason TEXT,                   -- 退款原因
  refunded_at TIMESTAMP,                -- 退款时间
  
  metadata JSONB,                       -- 扩展信息
  
  INDEX idx_billing_consumption_user_time (user_id, created_at),
  INDEX idx_billing_consumption_package (user_package_id),
  INDEX idx_billing_consumption_action (action_key),
  INDEX idx_billing_consumption_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (user_package_id) REFERENCES user_billing_packages(id)
);
```

**设计要点**:
- 每次消费都记录，便于审计和分析
- `action_key` 关联动作计价表，但 `credits_cost` 保存快照（避免价格修改影响历史记录）
- `status` 支持退款状态，积分可回滚
- `metadata` 可存储详细上下文（如API响应时间、token数等）
- 不再使用 `consumption_type` 和 `consumption_amount`，统一使用 `action_key` 和 `credits_cost`

### 2. 积分扣减逻辑

**扣减策略**（按优先级顺序）:
1. 根据 `action_key` 查询动作计价表，获取所需积分数 `credits_cost`
2. 查询用户所有 `active` 状态的套餐
3. 按 `priority ASC, expires_at ASC` 排序（优先级小的先扣，同优先级则快过期的先扣）
4. 依次扣减积分，直到满足所需积分或无可用套餐
5. 更新 `used_credits` 和 `remaining_credits`
6. 如积分耗尽，更新状态为 `depleted`
7. 创建消费记录，保存 `action_key` 和 `credits_cost` 快照

**扣减流程示例**:
```go
// 1. 获取动作价格
actionPrice := GetActionPrice("resume_optimize") // 返回 1 积分
requiredCredits := actionPrice.CreditsCost

// 2. 检查用户总积分是否足够
totalCredits := GetUserTotalCredits(userID)
if totalCredits < requiredCredits {
    return ErrInsufficientCredits
}

// 3. 扣减积分（事务中进行）
tx.Begin()
packages := GetActivePackages(userID) // 按优先级排序
remainingCost := requiredCredits

for _, pkg := range packages {
    if remainingCost <= 0 {
        break
    }
    
    deduct := min(pkg.RemainingCredits, remainingCost)
    pkg.UsedCredits += deduct
    pkg.RemainingCredits -= deduct
    remainingCost -= deduct
    
    if pkg.RemainingCredits == 0 {
        pkg.Status = "depleted"
    }
    tx.Save(&pkg)
}

// 4. 创建消费记录
record := BillingConsumptionRecord{
    UserID: userID,
    ActionKey: "resume_optimize",
    CreditsCost: requiredCredits, // 保存快照
    ...
}
tx.Create(&record)
tx.Commit()
```

**并发控制**:
```go
// 使用数据库行锁保证原子性
tx := db.Begin()
defer tx.Rollback()

// 悲观锁：锁定用户套餐行
var userBillingPackages []UserBillingPackage
err := tx.Where("user_id = ? AND status = 'active' AND remaining_credits > 0", userID).
    Order("priority ASC, expires_at ASC").
    Clauses(clause.Locking{Strength: "UPDATE"}).
    Find(&userBillingPackages).Error

// ... 扣减逻辑 ...

tx.Commit()
```

**Alternatives considered**:
- **乐观锁**: 使用版本号，冲突时重试。优点是并发性能好，但会增加代码复杂度
- **Redis锁**: 分布式锁。当前单机部署，暂不需要
- **选择**: 悲观锁，简单可靠，性能对当前规模足够

### 3. 套餐激活时机

**支持两种模式**:
1. **立即激活**: 购买后立即生效（`activated_at = NOW()`）
2. **延迟激活**: 购买后不立即生效（`status = 'pending'`），用户首次使用时激活

**使用场景**:
- 立即激活：月度会员、年度会员
- 延迟激活：次数包、体验券（避免用户囤积后过期）

### 4. 过期套餐处理

**定时任务**（cron job）:
```go
// 每小时执行一次
func CleanExpiredPackages() {
    db.Model(&UserBillingPackage{}).
        Where("status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()").
        Update("status", "expired")
}
```

**查询时过滤**:
- 所有查询 `active` 套餐时，额外加条件 `(expires_at IS NULL OR expires_at > NOW())`
- 双重保障，避免定时任务延迟

### 5. 消费回滚

**场景**:
- AI服务调用失败
- 文件导出失败
- 用户取消操作

**实现**:
```go
func RefundConsumption(recordID int64, reason string) error {
    tx := db.Begin()
    
    // 1. 查询消费记录
    var record BillingConsumptionRecord
    tx.First(&record, recordID)
    
    // 2. 更新消费记录状态
    tx.Model(&record).Updates(map[string]interface{}{
        "status": "refunded",
        "refund_reason": reason,
        "refunded_at": time.Now(),
    })
    
    // 3. 回退用户套餐积分
    tx.Model(&UserBillingPackage{}).Where("id = ?", record.UserPackageID).
        UpdateColumn("used_credits", gorm.Expr("used_credits - ?", record.CreditsCost)).
        UpdateColumn("remaining_credits", gorm.Expr("remaining_credits + ?", record.CreditsCost))
    
    // 4. 如果套餐因积分耗尽而 depleted，恢复为 active
    tx.Model(&UserBillingPackage{}).
        Where("id = ? AND status = 'depleted' AND remaining_credits > 0", record.UserPackageID).
        Update("status", "active")
    
    tx.Commit()
    return nil
}
```

## Risks / Trade-offs

### Risk 1: 积分扣减性能瓶颈
- **风险**: 高并发场景下，行锁可能导致等待
- **缓解**: 
  - 当前用户规模小，问题不明显
  - 后续可引入Redis缓存热点用户积分
  - 优化SQL查询，减少锁持有时间

### Risk 2: 动作价格修改影响
- **风险**: 管理员修改动作价格后，可能影响用户预期
- **缓解**: 
  - 消费记录保存价格快照，历史记录不受影响
  - 价格修改前需要管理员确认
  - 建议提供价格修改历史记录（可选）

### Risk 3: 套餐快照与原始套餐不一致
- **风险**: 套餐修改后，用户套餐的快照字段可能过时
- **缓解**: 
  - 只快照关键字段（名称、类型、积分）
  - 详细信息通过 `metadata` 补充
  - 明确快照字段的语义（购买时的套餐信息）

### Risk 4: 数据一致性
- **风险**: 消费记录与用户套餐数据不一致
- **缓解**: 
  - 所有操作在事务中完成
  - 定期对账任务（sum(consumption_records.credits_cost) == user_packages.used_credits）
  - 记录事件日志用于审计

## Migration Plan

### 阶段1: 数据库初始化
1. 创建三张表
2. 创建索引
3. 为现有用户分配默认套餐（可选）

### 阶段2: 服务层开发
1. 实现套餐CRUD服务
2. 实现用户套餐服务
3. 实现消费记录服务
4. 单元测试

### 阶段3: API开发
1. 管理员API（套餐管理）
2. 用户API（查看套餐、消费记录）
3. 内部API（额度检查、扣减）

### 阶段4: 前端开发
1. 管理员页面
2. 用户页面

### 阶段5: 业务接入
1. 简历优化功能接入消费扣减
2. AI对话功能接入消费扣减
3. 其他功能逐步接入

### Rollback Plan
- 数据库迁移可回滚（保留迁移脚本的 down 版本）
- 新表独立，不影响现有业务
- 接入时使用特性开关（feature flag），可快速关闭

## Open Questions

1. **默认套餐**: 新用户是否自动分配默认套餐（如免费体验套餐）？
   - 建议：是，分配一个"新用户体验包"（如10积分体验）
   
2. **套餐组合优惠**: 是否支持套餐组合购买优惠？
   - 建议：V1暂不支持，V2考虑

3. **积分转移**: 用户能否转移积分给其他用户？
   - 建议：暂不支持，避免滥用

4. **套餐暂停**: 用户能否暂停套餐（停止计时，保留积分）？
   - 建议：V1暂不支持，业务复杂度较高

5. **动作价格调整策略**: 修改动作价格后是否需要通知用户？
   - 建议：重大调价时通过站内信或邮件通知
   
6. **积分精度**: 是否支持小数积分（如0.5积分）？
   - 建议：V1使用整数积分，简化计算和显示

7. **预置动作列表**: 系统初始化时需要预置哪些动作？
   - 建议：resume_optimize, ai_chat, pdf_export, advanced_analysis

