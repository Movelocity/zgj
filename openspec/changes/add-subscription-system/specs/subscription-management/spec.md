## ADDED Requirements

### Requirement: 动作计价管理
系统 SHALL 提供动作计价管理功能，管理员可以自定义各种动作及其单次积分消耗量。

#### Scenario: 管理员创建动作计价
- **WHEN** 管理员提供动作信息（动作key、名称、描述、积分消耗）
- **THEN** 系统创建动作计价记录
- **AND** action_key 必须唯一
- **AND** credits_cost 默认为 1

#### Scenario: 管理员修改动作计价
- **WHEN** 管理员修改某个动作的积分消耗
- **THEN** 系统更新动作计价
- **AND** 历史消费记录不受影响（使用快照）
- **AND** 新的消费按新价格扣减

#### Scenario: 管理员查询动作计价列表
- **WHEN** 管理员请求动作计价列表
- **THEN** 系统返回所有动作计价（包括已禁用）
- **AND** 支持按状态筛选

#### Scenario: 根据action_key获取价格
- **WHEN** 系统需要扣减积分时查询动作价格
- **THEN** 根据 action_key 返回对应的 credits_cost
- **AND** 如果动作不存在或已禁用，返回错误

---

### Requirement: 套餐定义管理
系统 SHALL 提供套餐定义管理功能，管理员可以创建、修改、查询、上下架套餐。

#### Scenario: 管理员创建套餐成功
- **WHEN** 管理员提供完整的套餐信息（名称、类型、价格、积分数量、有效期等）
- **THEN** 系统创建套餐记录并返回套餐ID
- **AND** 套餐状态默认为启用（is_active=true）

#### Scenario: 管理员查询套餐列表
- **WHEN** 管理员请求套餐列表
- **THEN** 系统返回所有套餐（包括已下架），支持按类型、状态筛选
- **AND** 支持分页查询

#### Scenario: 管理员修改套餐信息
- **WHEN** 管理员修改套餐的非核心字段（如描述、价格、可见性）
- **THEN** 系统更新套餐信息
- **AND** 已购买该套餐的用户不受影响（使用快照数据）

#### Scenario: 管理员下架套餐
- **WHEN** 管理员将套餐设置为不可见（is_visible=false）
- **THEN** 前台用户无法看到该套餐
- **AND** 已购买该套餐的用户仍可正常使用

#### Scenario: 创建套餐时类型无效
- **WHEN** 管理员提供的套餐类型不在允许范围内（duration/credits/hybrid/permanent）
- **THEN** 系统返回错误，提示套餐类型无效

---

### Requirement: 用户套餐订阅
系统 SHALL 支持用户订阅套餐，用户可以拥有多个套餐并行使用（套餐叠加）。

#### Scenario: 用户获得新套餐
- **WHEN** 用户通过购买、赠送或其他方式获得套餐
- **THEN** 系统创建用户套餐记录
- **AND** 记录套餐快照信息（名称、类型、总积分、有效期）
- **AND** 状态根据套餐类型设置（立即激活或待激活）

#### Scenario: 时长型套餐立即激活
- **WHEN** 用户获得时长型套餐（如月度会员）
- **THEN** 系统立即激活该套餐（activated_at=NOW(), status='active'）
- **AND** 计算过期时间（expires_at = activated_at + validity_days）

#### Scenario: 积分包延迟激活
- **WHEN** 用户获得积分包且配置为延迟激活
- **THEN** 系统创建套餐记录但不激活（status='pending'）
- **AND** 用户首次使用时自动激活

#### Scenario: 用户查询自己的套餐列表
- **WHEN** 用户请求查询自己的套餐
- **THEN** 系统返回该用户所有套餐（active、pending、expired、depleted）
- **AND** 包含剩余积分、过期时间等信息
- **AND** 按优先级和过期时间排序

#### Scenario: 用户拥有多个有效套餐
- **WHEN** 用户同时拥有多个 active 状态的套餐
- **THEN** 系统允许这些套餐并存
- **AND** 消费时按优先级依次扣减积分

---

### Requirement: 积分检查与扣减
系统 SHALL 提供积分检查和扣减功能，根据动作计价表扣减用户积分。

#### Scenario: 检查用户剩余积分
- **WHEN** 系统需要检查用户是否有足够积分
- **THEN** 系统查询用户所有 active 状态的套餐
- **AND** 计算总剩余积分（sum(remaining_credits)）
- **AND** 过滤掉已过期的套餐（expires_at < NOW()）

#### Scenario: 扣减积分成功
- **WHEN** 用户执行需要消耗积分的操作（如简历优化）
- **AND** 系统根据 action_key 从动作计价表获取所需积分数
- **AND** 用户有足够的剩余积分
- **THEN** 系统按优先级顺序扣减套餐积分（priority ASC, expires_at ASC）
- **AND** 更新 used_credits 和 remaining_credits
- **AND** 创建消费记录（保存 action_key 和 credits_cost 快照）
- **AND** 所有操作在同一事务中完成

#### Scenario: 扣减积分导致套餐耗尽
- **WHEN** 扣减积分后某套餐的 remaining_credits 降为 0
- **THEN** 系统将该套餐状态更新为 'depleted'
- **AND** 该套餐不再参与后续的积分扣减

#### Scenario: 积分不足
- **WHEN** 用户执行需要消耗积分的操作
- **AND** 用户的总剩余积分不足
- **THEN** 系统返回错误，提示积分不足
- **AND** 不创建消费记录
- **AND** 不扣减任何积分

#### Scenario: 并发扣减积分
- **WHEN** 多个请求同时为同一用户扣减积分
- **THEN** 系统使用数据库行锁（SELECT FOR UPDATE）保证原子性
- **AND** 串行处理扣减操作，避免超扣

#### Scenario: 动作不存在或已禁用
- **WHEN** 用户执行操作，但对应的 action_key 不存在或已禁用
- **THEN** 系统返回错误，提示该操作暂不可用
- **AND** 不扣减积分

---

### Requirement: 消费记录跟踪
系统 SHALL 记录所有消费行为，支持消费历史查询和统计分析。

#### Scenario: 创建消费记录
- **WHEN** 用户执行消费操作且扣减积分成功
- **THEN** 系统创建消费记录
- **AND** 记录用户ID、用户套餐ID、action_key、credits_cost（快照）
- **AND** 记录资源类型和资源ID（如 resume, resume_id）
- **AND** 状态默认为 'success'

#### Scenario: 用户查询消费历史
- **WHEN** 用户请求查询自己的消费记录
- **THEN** 系统返回该用户的所有消费记录
- **AND** 支持按时间范围筛选
- **AND** 支持按动作类型（action_key）筛选
- **AND** 支持分页查询
- **AND** 显示每次消费的积分数

#### Scenario: 管理员查询消费统计
- **WHEN** 管理员请求消费统计数据
- **THEN** 系统返回指定时间范围内的消费汇总
- **AND** 支持按用户、动作类型、套餐类型分组统计
- **AND** 包含总消费次数、总消费积分

#### Scenario: 消费失败不创建记录
- **WHEN** 服务执行失败（如AI调用超时）
- **AND** 在创建消费记录前失败
- **THEN** 系统不创建消费记录
- **AND** 不扣减用户积分

---

### Requirement: 消费回滚
系统 SHALL 支持消费回滚，在服务失败或用户取消时退回已扣减的积分。

#### Scenario: 回滚消费成功
- **WHEN** 服务失败或需要退款
- **THEN** 系统将消费记录状态更新为 'refunded'
- **AND** 记录退款原因和退款时间
- **AND** 回退对应用户套餐的 used_credits（减少）和 remaining_credits（增加）
- **AND** 如果套餐因此次回滚有了可用积分，状态从 'depleted' 恢复为 'active'

#### Scenario: 回滚已退款的消费记录
- **WHEN** 尝试回滚状态为 'refunded' 的消费记录
- **THEN** 系统返回错误，提示该记录已退款

#### Scenario: 回滚成功后记录事件日志
- **WHEN** 消费回滚成功
- **THEN** 系统记录事件日志（event_type='consumption_refund'）
- **AND** 日志包含用户ID、消费记录ID、回滚原因

#### Scenario: 回滚过期套餐的积分
- **WHEN** 尝试回滚已过期套餐的消费记录
- **THEN** 系统仍然回退积分到该套餐
- **AND** 但套餐状态保持 'expired'
- **AND** 过期套餐的积分无法再次使用

---

### Requirement: 套餐过期处理
系统 SHALL 自动处理过期套餐，确保用户不会使用已过期的积分，过期后积分作废。

#### Scenario: 定时任务清理过期套餐
- **WHEN** 定时任务运行（建议每小时一次）
- **THEN** 系统查询所有 active 状态且 expires_at < NOW() 的套餐
- **AND** 批量更新状态为 'expired'
- **AND** 过期套餐的剩余积分全部作废，无法使用

#### Scenario: 查询时过滤过期套餐
- **WHEN** 系统查询用户的可用套餐
- **THEN** 额外过滤条件：expires_at IS NULL OR expires_at > NOW()
- **AND** 即使定时任务延迟，也不会使用过期套餐

#### Scenario: 过期套餐不参与积分扣减
- **WHEN** 用户执行消费操作
- **THEN** 系统只从 active 且未过期的套餐中扣减积分
- **AND** expired 状态的套餐被忽略
- **AND** 过期套餐的剩余积分无法使用

#### Scenario: 用户查看过期套餐
- **WHEN** 用户查询自己的套餐列表
- **THEN** 系统显示过期套餐及其剩余积分（已作废）
- **AND** 明确标记为"已过期"

---

### Requirement: 套餐优先级管理
系统 SHALL 支持套餐扣减优先级，管理员和系统可设置不同套餐的消费顺序。

#### Scenario: 设置套餐优先级
- **WHEN** 创建或分配用户套餐时
- **THEN** 系统可以设置 priority 字段（整数，越小越优先）
- **AND** 默认优先级为 0

#### Scenario: 按优先级扣减积分
- **WHEN** 用户有多个可用套餐
- **THEN** 系统按 priority ASC, expires_at ASC 排序后依次扣减积分
- **AND** 优先级相同时，先过期的套餐先扣减

#### Scenario: 赠送套餐优先消耗
- **WHEN** 用户同时拥有赠送套餐（source='gift'）和购买套餐（source='purchase'）
- **THEN** 系统可以设置赠送套餐的 priority 更小（如-10）
- **AND** 确保赠送的积分先消耗

---

### Requirement: 数据一致性保障
系统 SHALL 确保套餐积分和消费记录的数据一致性。

#### Scenario: 积分扣减事务性
- **WHEN** 执行积分扣减操作
- **THEN** 以下操作必须在同一数据库事务中完成：
  - 查询动作计价
  - 查询并锁定用户套餐
  - 更新用户套餐积分
  - 创建消费记录
- **AND** 任一步骤失败则全部回滚

#### Scenario: 定期对账检查
- **WHEN** 运行对账任务（建议每日一次）
- **THEN** 系统验证每个用户套餐的 used_credits 是否等于对应消费记录的总和
- **AND** 发现不一致时记录错误日志并告警

#### Scenario: 防止超扣积分
- **WHEN** 并发请求可能导致超扣
- **THEN** 数据库约束确保 remaining_credits >= 0
- **AND** 使用行锁（SELECT FOR UPDATE）避免竞态条件

---

### Requirement: 前端用户界面
系统 SHALL 为普通用户提供查看套餐和消费记录的界面。

#### Scenario: 用户查看我的套餐
- **WHEN** 用户访问"我的套餐"页面
- **THEN** 显示用户所有有效套餐（active、pending）
- **AND** 显示每个套餐的剩余积分、过期时间
- **AND** 显示总可用积分

#### Scenario: 用户查看消费历史
- **WHEN** 用户访问"消费历史"页面
- **THEN** 显示用户的消费记录列表
- **AND** 支持按时间范围筛选
- **AND** 显示动作类型、消耗积分数、消费时间

#### Scenario: 积分不足时前端提示
- **WHEN** 用户积分不足时尝试使用服务
- **THEN** 前端显示友好的提示信息
- **AND** 提示所需积分和当前剩余积分
- **AND** 引导用户查看套餐或购买

#### Scenario: 显示操作所需积分
- **WHEN** 用户准备执行某个操作
- **THEN** 前端显示该操作所需的积分数
- **AND** 根据动作计价表实时获取价格

---

### Requirement: 管理员界面
系统 SHALL 为管理员提供动作计价管理、套餐管理、用户套餐管理、消费统计的界面。

#### Scenario: 管理员管理动作计价
- **WHEN** 管理员访问动作计价管理页面
- **THEN** 显示所有动作及其积分价格
- **AND** 支持创建、修改、启用/禁用动作
- **AND** 修改价格时提示影响范围

#### Scenario: 管理员创建套餐
- **WHEN** 管理员在套餐管理页面创建新套餐
- **THEN** 提供表单输入套餐信息（名称、类型、价格、积分数量、有效期等）
- **AND** 提交后调用后端API创建套餐
- **AND** 成功后显示成功提示并刷新列表

#### Scenario: 管理员查看用户套餐
- **WHEN** 管理员查看某个用户的套餐列表
- **THEN** 显示该用户所有套餐（包括过期和耗尽的）
- **AND** 显示套餐来源、剩余积分、状态等信息

#### Scenario: 管理员手动分配套餐
- **WHEN** 管理员为某用户手动分配套餐（如补偿、赠送）
- **THEN** 选择套餐类型，填写备注
- **AND** 系统创建用户套餐记录，来源标记为 'gift' 或 'system'

#### Scenario: 管理员查看消费报表
- **WHEN** 管理员访问消费报表页面
- **THEN** 显示消费统计数据（按日期、用户、动作类型）
- **AND** 显示总消费积分和消费次数
- **AND** 支持导出为CSV或Excel

---

### Requirement: API接口规范
系统 SHALL 提供RESTful API接口，遵循项目的API响应格式约定。

#### Scenario: API响应格式
- **WHEN** 任意订阅相关API返回响应
- **THEN** 遵循统一格式：`{ "code": 0, "data": {...}, "msg": "..." }`
- **AND** code=0 表示成功，其他值表示失败

#### Scenario: 管理员管理动作计价API
- **WHEN** 管理员调用 POST /api/admin/billing/action-prices
- **THEN** 创建或更新动作计价
- **AND** 需要管理员权限（role=888）

#### Scenario: 获取动作计价API
- **WHEN** 前端调用 GET /api/billing/action-prices
- **THEN** 返回所有启用的动作计价列表
- **AND** 前端可据此显示各操作所需积分

#### Scenario: 用户查询套餐API
- **WHEN** 用户调用 GET /api/user/billing/packages
- **THEN** 返回该用户的套餐列表和总剩余积分
- **AND** 需要JWT认证

#### Scenario: 管理员创建套餐API
- **WHEN** 管理员调用 POST /api/admin/billing/packages
- **THEN** 需要管理员权限（role=888）
- **AND** 参数验证失败返回 code=500，msg包含错误详情

#### Scenario: 内部扣减积分API
- **WHEN** 其他服务调用内部API扣减积分
- **THEN** 提供 POST /api/internal/billing/credits/deduct 接口
- **AND** 参数包含 user_id 和 action_key
- **AND** 返回是否扣减成功和剩余积分

