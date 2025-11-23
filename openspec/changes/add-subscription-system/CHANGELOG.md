# 订阅系统改进日志

## 2025-11-23：引入积分系统和动作计价表

### 新增功能

#### 1. 动作计价表 (billing_action_prices)
- ✅ 管理员可自定义各种操作的积分消耗
- ✅ 支持动态调整价格，无需修改代码
- ✅ 预置常见操作：简历优化(1)、AI对话(1)、PDF导出(1)、高级分析(3)

#### 2. 统一积分系统
- ✅ 所有表统一使用"积分"作为计费单位
- ✅ 套餐包含积分数量（credits_amount）
- ✅ 用户套餐跟踪积分使用（total_credits, used_credits, remaining_credits）
- ✅ 消费记录保存积分快照（action_key, credits_cost）

#### 3. 积分过期机制
- ✅ 积分随套餐过期而作废
- ✅ 过期后剩余积分无法使用
- ✅ 前端明确标记"已过期"和"积分已作废"

### 数据结构变更

| 表名 | 变更类型 | 说明 |
|------|----------|------|
| billing_action_prices | 新增 | 动作计价表 |
| billing_packages | 修改字段 | quota_amount → credits_amount |
| user_billing_packages | 修改字段 | quota → credits（3个字段） |
| billing_consumption_records | 修改字段 | consumption_type → action_key, consumption_amount → credits_cost |

### API变更

#### 新增
- `POST /api/admin/billing/action-prices` - 管理动作计价
- `GET /api/billing/action-prices` - 获取动作计价（公共）

#### 修改
- `POST /api/internal/billing/credits/deduct` - 扣减积分（需传 action_key）
- `GET /api/user/billing/credits` - 获取积分（原 quota）

### 前端变更

#### 新增页面
- 管理员：`BillingActionPriceManagement.tsx` - 动作计价管理

#### 新增组件
- `CreditsDisplay.tsx` - 积分显示
- `ActionPriceTag.tsx` - 动作价格标签
- `ActionTypeIcon.tsx` - 动作类型图标

#### 修改
- 所有"额度/次数"文案改为"积分"
- 操作前显示所需积分数
- 积分不足时显示详细提示

### 业务逻辑变更

#### 扣减流程
1. 根据 action_key 查询动作计价表
2. 获取所需积分数
3. 检查用户总积分
4. 按优先级扣减积分
5. 保存消费记录（包含价格快照）

#### 价格调整
- 管理员通过界面调整价格
- 新消费按新价格计算
- 历史记录不受影响（使用快照）

### 文档更新

- ✅ `proposal.md` - 更新为积分系统
- ✅ `design.md` - 新增动作计价表设计
- ✅ `spec.md` - 新增动作计价管理需求，所有需求改为积分
- ✅ `tasks.md` - 更新所有任务为积分相关
- ✅ `CREDITS_SYSTEM_SUMMARY.md` - 详细改进说明

### 验证状态

```bash
✅ openspec validate add-subscription-system --strict
✅ 12个 delta 变更被正确识别
✅ 所有需求包含场景
✅ 文档格式规范
```

### 下一步

1. 根据 `tasks.md` 开始实施
2. 优先级：P0（核心功能）→ P1（重要功能）→ P2（可选功能）
3. 建议先完成动作计价表和积分扣减逻辑
4. 前端和业务接入可以分批进行

---

**改进人员**: AI Assistant  
**审批状态**: 待审批  
**实施状态**: 待实施

