# Change: 用户套餐订阅管理系统

## Why

系统当前缺乏完整的套餐管理和用户订阅跟踪能力，导致以下问题：
- 无法为用户提供差异化的服务套餐（免费版、基础版、专业版等）
- 无法准确跟踪用户的套餐使用情况和剩余额度
- 缺少消费记录，无法对账和分析用户消费行为
- 用户无法购买或叠加多个套餐
- 运营人员无法灵活配置和调整套餐内容

需要建立一个完整的套餐订阅管理系统，支持套餐定义、用户订阅（可叠加）、消费记录跟踪。

## What Changes

### 数据库改动
- **新增表 1**: `billing_action_prices` - 动作计价表
  - 管理员自定义各种动作及其单次积分消耗量
  - 支持动作启用/禁用、排序
  - 预置常见动作（简历优化、AI对话、PDF导出等）

- **新增表 2**: `billing_packages` - 套餐定义表
  - 定义可用的套餐类型（如"月度会员"、"年度会员"、"积分包"等）
  - 包含套餐名称、价格、有效期、**积分数量**、描述等信息
  - 支持套餐上下架、启用禁用
  - **统一使用积分**，不再使用 amount、quota 等字段
  
- **新增表 3**: `user_billing_packages` - 用户套餐表（支持叠加）
  - 记录用户拥有的套餐实例
  - 支持多个套餐并存（可叠加）
  - 跟踪每个套餐的**剩余积分**、有效期、使用状态
  - 记录购买时间、激活时间、过期时间
  - **积分随套餐过期而作废**
  
- **新增表 4**: `billing_consumption_records` - 消费记录表
  - 记录每次资源消耗（如简历优化、AI对话等）
  - 关联用户套餐ID和动作key
  - 记录**消耗的积分数**（快照，不受价格调整影响）
  - 支持消费回滚（如服务失败退款）

### 后端改进
- **动作计价服务层**: 
  - 动作CRUD、价格调整
  - 根据action_key获取价格
  
- **套餐服务层**: 套餐CRUD、套餐查询、套餐统计

- **用户套餐服务层**: 
  - 套餐购买/激活
  - 套餐叠加逻辑
  - **积分查询和扣减**
  - 过期套餐清理（积分作废）
  
- **消费服务层**: 
  - 消费记录创建（保存action_key和积分快照）
  - 消费统计和分析
  - 消费回滚（积分退回）
  
- **API接口**: 
  - 管理员：动作计价管理API、套餐管理API
  - 用户：查看我的套餐、消费记录、剩余积分
  - 内部：积分检查、积分扣减

### 套餐类型示例
- **时长型套餐**: 月度会员（30天，100积分）、年度会员（365天，1500积分）
- **积分包**: 10积分包、50积分包、100积分包（纯积分，可设置有效期）
- **混合型套餐**: 月度200积分（时长+积分组合）
- **永久型套餐**: 终身会员（无过期时间，积分永久有效）

### 动作计价示例
管理员可配置以下动作的积分消耗：
- **简历优化**: 1积分/次
- **AI对话**: 1积分/次
- **PDF导出**: 1积分/次
- **高级分析**: 3积分/次
- **批量优化**: 5积分/次
- **自定义动作**: 可由管理员添加新动作

## Impact

### Affected specs
- `subscription-management` (新capability)：套餐订阅和消费管理规范

### Affected code

**数据库（PostgreSQL）**:
- 新增表 `billing_action_prices` - 动作计价表
- 新增表 `billing_packages` - 套餐定义表
- 新增表 `user_billing_packages` - 用户套餐表
- 新增表 `billing_consumption_records` - 消费记录表
- 创建必要的索引（用户ID、套餐ID、动作key、时间等）


**后端（Go）**:
- `server/model/billing_action_price.go` - 动作计价模型
- `server/model/billing_package.go` - 套餐模型
- `server/model/user_billing_package.go` - 用户套餐模型
- `server/model/billing_consumption_record.go` - 消费记录模型
- `server/service/billing/` - 新服务包
  - `action_price_service.go` - 动作计价服务
  - `package_service.go` - 套餐管理服务
  - `user_package_service.go` - 用户套餐服务
  - `consumption_service.go` - 消费记录服务
  - `types.go` - 类型定义
- `server/api/billing/` - 新API包
  - `action_price.go` - 动作计价接口（管理员）
  - `package.go` - 套餐管理接口（管理员）
  - `user_package.go` - 用户套餐接口
  - `consumption.go` - 消费记录接口
- `server/router/billing.go` - 新路由
- `server/middleware/credits_check.go` - 积分检查中间件（可选）

**前端（React + TypeScript）**:
- `web/src/types/billing.ts` - 计费/订阅类型定义
- `web/src/api/billing.ts` - 计费API封装
- `web/src/pages/admin/` - 管理员页面
  - `BillingActionPriceManagement.tsx` - 动作计价管理
  - `BillingPackageManagement.tsx` - 套餐管理
  - `UserBillingPackageList.tsx` - 用户套餐列表
  - `BillingConsumptionReport.tsx` - 消费报表
- `web/src/pages/profile/` - 用户页面
  - `MyBillingPackages.tsx` - 我的套餐
  - `BillingConsumptionHistory.tsx` - 消费历史
- `web/src/components/billing/` - 计费组件
  - `BillingPackageCard.tsx` - 套餐卡片
  - `CreditsDisplay.tsx` - 积分显示
  - `ActionPriceTag.tsx` - 动作价格标签

### 兼容性
- **完全向后兼容**：新增功能，不影响现有业务
- **平滑迁移**：可为现有用户分配默认套餐
- **渐进接入**：可逐步将现有功能接入消费扣减逻辑

### 依赖关系
- **依赖**: `add-user-event-log` (消费记录需要记录事件日志)
- **后续**: 支付系统集成（购买套餐）

### 优先级
- **P1 - 高优先级**
- 为后续商业化和运营提供基础能力
- 需要在付费功能上线前完成

