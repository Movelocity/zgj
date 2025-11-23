# Implementation Tasks

## 1. 数据库设计与迁移
- [ ] 1.1 创建 `billing_action_prices` 表结构定义（动作计价表）
- [ ] 1.2 创建 `billing_packages` 表结构定义（使用 credits_amount）
- [ ] 1.3 创建 `user_billing_packages` 表结构定义（使用 total_credits, used_credits, remaining_credits）
- [ ] 1.4 创建 `billing_consumption_records` 表结构定义（使用 action_key, credits_cost）
- [ ] 1.5 创建必要的索引（用户ID、action_key、时间、状态等）
- [ ] 1.6 准备预置动作数据（resume_optimize, ai_chat, pdf_export, advanced_analysis）

## 2. 后端数据模型层
- [ ] 2.1 创建 `server/model/billing_action_price.go` - 动作计价模型
- [ ] 2.2 创建 `server/model/billing_package.go` - 套餐模型（使用 CreditsAmount）
- [ ] 2.3 创建 `server/model/user_billing_package.go` - 用户套餐模型
  - [ ] 使用 TotalCredits, UsedCredits, RemainingCredits
  - [ ] 包含 IsValid() 方法检查套餐是否有效
  - [ ] 包含 IsExpired() 方法检查是否过期
- [ ] 2.4 创建 `server/model/billing_consumption_record.go` - 消费记录模型
  - [ ] 使用 ActionKey 和 CreditsCost
- [ ] 2.5 在 `server/model/enter.go` 中注册新模型

## 3. 后端服务层 - 动作计价管理
- [ ] 3.1 创建 `server/service/billing/` 目录
- [ ] 3.2 创建 `server/service/billing/types.go` - 类型定义
  - [ ] 定义套餐类型枚举（duration/credits/hybrid/permanent）
  - [ ] 定义动作key常量（resume_optimize/ai_chat/pdf_export/advanced_analysis等）
  - [ ] 定义套餐来源枚举（purchase/gift/promotion/system）
  - [ ] 定义状态枚举（pending/active/expired/depleted）
- [ ] 3.3 创建 `server/service/billing/action_price_service.go` - 动作计价服务
  - [ ] CreateActionPrice() - 创建动作计价
  - [ ] UpdateActionPrice() - 更新动作计价
  - [ ] GetActionPrice() - 根据action_key获取价格
  - [ ] ListActionPrices() - 查询动作计价列表
  - [ ] SetActionPriceStatus() - 启用/禁用动作
- [ ] 3.4 创建 `server/service/billing/package_service.go` - 套餐管理服务
  - [ ] CreateBillingPackage() - 创建套餐（使用credits_amount）
  - [ ] UpdateBillingPackage() - 更新套餐
  - [ ] GetBillingPackage() - 查询单个套餐
  - [ ] ListBillingPackages() - 查询套餐列表
  - [ ] SetBillingPackageVisibility() - 设置套餐可见性
  - [ ] DeleteBillingPackage() - 软删除套餐（可选）
- [ ] 3.5 编写服务单元测试（可选）

## 4. 后端服务层 - 用户套餐管理
- [ ] 4.1 创建 `server/service/billing/user_package_service.go` - 用户套餐服务
  - [ ] AssignBillingPackageToUser() - 为用户分配套餐
  - [ ] ActivateBillingPackage() - 激活套餐
  - [ ] GetUserBillingPackages() - 查询用户套餐列表
  - [ ] GetUserActiveBillingPackages() - 查询用户有效套餐
  - [ ] GetUserTotalCredits() - 查询用户总剩余积分
  - [ ] CleanExpiredBillingPackages() - 清理过期套餐（定时任务，积分作废）
- [ ] 4.2 编写用户套餐服务单元测试（可选）

## 5. 后端服务层 - 消费管理
- [ ] 5.1 创建 `server/service/billing/consumption_service.go` - 消费服务
  - [ ] CheckCredits() - 检查用户剩余积分
  - [ ] DeductCredits() - 扣减积分（原子操作）
    - [ ] 根据action_key获取价格
    - [ ] 按优先级扣减积分
    - [ ] 保存action_key和credits_cost快照
  - [ ] CreateConsumptionRecord() - 创建消费记录
  - [ ] RefundConsumption() - 消费回滚（积分退回）
  - [ ] GetUserConsumptionHistory() - 查询用户消费历史
  - [ ] GetConsumptionStatistics() - 消费统计（管理员）
- [ ] 5.2 实现并发安全的积分扣减逻辑（SELECT FOR UPDATE）
- [ ] 5.3 实现扣减优先级排序（priority ASC, expires_at ASC）
- [ ] 5.4 编写消费服务单元测试

## 6. 后端API层 - 管理员接口
- [ ] 6.1 创建 `server/api/billing/` 目录
- [ ] 6.2 创建 `server/api/billing/action_price.go` - 动作计价管理API
  - [ ] CreateActionPriceHandler() - POST /api/admin/billing/action-prices
  - [ ] UpdateActionPriceHandler() - PUT /api/admin/billing/action-prices/:id
  - [ ] ListActionPricesHandler() - GET /api/admin/billing/action-prices
  - [ ] SetActionPriceStatusHandler() - PATCH /api/admin/billing/action-prices/:id/status
- [ ] 6.3 创建 `server/api/billing/package.go` - 套餐管理API
  - [ ] CreateBillingPackageHandler() - POST /api/admin/billing/packages
  - [ ] UpdateBillingPackageHandler() - PUT /api/admin/billing/packages/:id
  - [ ] GetBillingPackageHandler() - GET /api/admin/billing/packages/:id
  - [ ] ListBillingPackagesHandler() - GET /api/admin/billing/packages
  - [ ] SetBillingPackageVisibilityHandler() - PATCH /api/admin/billing/packages/:id/visibility
- [ ] 6.4 创建 `server/api/billing/user_package.go` - 用户套餐管理API
  - [ ] AssignBillingPackageHandler() - POST /api/admin/billing/user-packages（手动分配）
  - [ ] GetUserBillingPackagesHandler() - GET /api/admin/users/:userId/billing-packages
  - [ ] GetBillingPackageUsersHandler() - GET /api/admin/billing/packages/:packageId/users
- [ ] 6.5 创建 `server/api/billing/consumption.go` - 消费统计API
  - [ ] GetConsumptionStatisticsHandler() - GET /api/admin/billing/consumption/statistics

## 7. 后端API层 - 用户接口
- [ ] 7.1 在 `server/api/billing/user_package.go` 中添加用户接口
  - [ ] GetMyBillingPackagesHandler() - GET /api/user/billing/packages（我的套餐）
  - [ ] GetMyCreditsHandler() - GET /api/user/billing/credits（我的积分）
- [ ] 7.2 在 `server/api/billing/consumption.go` 中添加用户接口
  - [ ] GetMyConsumptionHandler() - GET /api/user/billing/consumption（我的消费记录）
- [ ] 7.3 在 `server/api/billing/action_price.go` 中添加公共接口
  - [ ] GetActiveActionPricesHandler() - GET /api/billing/action-prices（前端显示价格）

## 8. 后端API层 - 内部接口
- [ ] 8.1 在 `server/api/billing/consumption.go` 中添加内部接口
  - [ ] DeductCreditsHandler() - POST /api/internal/billing/credits/deduct（扣减积分）
    - [ ] 参数：user_id, action_key
  - [ ] RefundCreditsHandler() - POST /api/internal/billing/credits/refund（退回积分）
- [ ] 8.2 考虑是否需要内部认证机制（可选，V1可以跳过）

## 9. 路由注册
- [ ] 9.1 创建 `server/router/billing.go` - 计费路由
- [ ] 9.2 注册管理员路由（需要admin_auth中间件）
- [ ] 9.3 注册用户路由（需要jwt中间件）
- [ ] 9.4 注册内部路由（根据需要）
- [ ] 9.5 在 `server/initialize/router.go` 中引入计费路由

## 10. 定时任务
- [ ] 10.1 创建 `server/service/billing/scheduled_tasks.go`
- [ ] 10.2 实现 CleanExpiredBillingPackagesJob() - 清理过期套餐
- [ ] 10.3 实现 ReconcileQuotaJob() - 对账任务（可选，推荐）
- [ ] 10.4 在 `server/initialize/service.go` 或 main.go 中启动定时任务
- [ ] 10.5 使用 cron 库或简单的 time.Ticker

## 11. 前端类型定义
- [ ] 11.1 创建 `web/src/types/billing.ts`
  - [ ] BillingActionPrice - 动作计价类型
  - [ ] BillingPackage - 套餐类型（使用 creditsAmount）
  - [ ] UserBillingPackage - 用户套餐类型（使用 totalCredits, usedCredits, remainingCredits）
  - [ ] BillingConsumptionRecord - 消费记录类型（使用 actionKey, creditsCost）
  - [ ] BillingPackageType - 套餐类型枚举（duration/credits/hybrid/permanent）
  - [ ] ActionKey - 动作key枚举

## 12. 前端API封装
- [ ] 12.1 创建 `web/src/api/billing.ts`
  - [ ] 管理员API：
    - [ ] 动作计价：createActionPrice, updateActionPrice, listActionPrices
    - [ ] 套餐管理：createBillingPackage, updateBillingPackage, listBillingPackages
  - [ ] 用户API：getMyBillingPackages, getMyCredits, getMyConsumption
  - [ ] 公共API：getActiveActionPrices
  - [ ] 统一错误处理

## 13. 前端管理员界面 - 动作计价管理
- [ ] 13.1 创建 `web/src/pages/admin/BillingActionPriceManagement.tsx`
- [ ] 13.2 实现动作计价列表展示（Table组件）
- [ ] 13.3 实现创建/编辑动作计价模态框（Modal + Form）
- [ ] 13.4 实现修改积分价格功能（带确认提示）
- [ ] 13.5 实现启用/禁用动作功能
- [ ] 13.6 显示每个动作的使用统计（可选）

## 14. 前端管理员界面 - 套餐管理
- [ ] 14.1 创建 `web/src/pages/admin/BillingPackageManagement.tsx`
- [ ] 14.2 实现套餐列表展示（Table组件）
- [ ] 14.3 实现创建套餐模态框（Modal + Form，输入积分数量）
- [ ] 14.4 实现编辑套餐模态框
- [ ] 14.5 实现套餐上下架功能
- [ ] 14.6 实现套餐排序和筛选

## 15. 前端管理员界面 - 用户套餐管理
- [ ] 15.1 创建 `web/src/pages/admin/UserBillingPackageList.tsx`
- [ ] 15.2 实现用户套餐列表展示（显示积分信息）
- [ ] 15.3 实现手动分配套餐功能（选择用户、选择套餐、填写备注）
- [ ] 15.4 实现按用户筛选套餐
- [ ] 15.5 显示套餐状态标签（active/expired/depleted）

## 16. 前端管理员界面 - 消费报表
- [ ] 16.1 创建 `web/src/pages/admin/BillingConsumptionReport.tsx`
- [ ] 16.2 实现消费统计图表（按日期、按动作类型、按积分）
- [ ] 16.3 实现消费记录列表展示
- [ ] 16.4 实现筛选功能（时间范围、用户、动作类型）
- [ ] 16.5 实现导出功能（CSV或Excel）

## 17. 前端用户界面 - 我的套餐
- [ ] 17.1 创建 `web/src/pages/profile/MyBillingPackages.tsx`
- [ ] 17.2 实现套餐卡片组件 `web/src/components/billing/BillingPackageCard.tsx`
- [ ] 17.3 显示用户所有有效套餐（active、pending）
- [ ] 17.4 显示每个套餐的剩余积分、过期时间
- [ ] 17.5 显示总可用积分（CreditsDisplay组件）
- [ ] 17.6 友好的空状态提示（无套餐时）

## 18. 前端用户界面 - 消费历史
- [ ] 18.1 创建 `web/src/pages/profile/BillingConsumptionHistory.tsx`
- [ ] 18.2 实现消费记录列表（Table或Card）
- [ ] 18.3 实现时间范围筛选
- [ ] 18.4 实现动作类型筛选
- [ ] 18.5 实现分页加载
- [ ] 18.6 显示动作类型的友好名称和图标
- [ ] 18.7 显示每次消费的积分数

## 19. 前端通用组件
- [ ] 19.1 创建 `web/src/components/billing/CreditsDisplay.tsx` - 积分显示组件
- [ ] 19.2 创建 `web/src/components/billing/BillingPackageStatusBadge.tsx` - 套餐状态徽章
- [ ] 19.3 创建 `web/src/components/billing/ActionPriceTag.tsx` - 动作价格标签
- [ ] 19.4 创建 `web/src/components/billing/ActionTypeIcon.tsx` - 动作类型图标

## 20. 业务功能接入 - 简历优化
- [ ] 20.1 在简历优化前调用 CheckCredits 检查积分
- [ ] 20.2 积分不足时返回友好提示（显示所需积分和剩余积分）
- [ ] 20.3 优化开始时调用 DeductCredits 扣减积分（传入 action_key='resume_optimize'）
- [ ] 20.4 优化失败时调用 RefundCredits 退回积分
- [ ] 20.5 记录事件日志（resume_optimize）

## 21. 业务功能接入 - AI对话（可选）
- [ ] 21.1 在AI对话前检查积分
- [ ] 21.2 对话开始时扣减积分（action_key='ai_chat'）
- [ ] 21.3 对话失败时退回积分

## 22. 业务功能接入 - 其他功能
- [ ] 22.1 PDF导出功能接入（action_key='pdf_export'）
- [ ] 22.2 高级分析功能接入（action_key='advanced_analysis'）
- [ ] 22.3 前端显示各操作所需积分

## 23. 事件日志集成
- [ ] 23.1 套餐购买/分配时记录事件（billing_package_assign）
- [ ] 23.2 积分扣减时记录事件（billing_credits_deduct）
- [ ] 23.3 消费回滚时记录事件（billing_consumption_refund）
- [ ] 23.4 套餐过期时记录事件（billing_package_expired，可选）
- [ ] 23.5 动作价格修改时记录事件（billing_action_price_update）

## 24. 默认套餐和动作配置
- [ ] 24.1 创建预置动作计价（resume_optimize=1, ai_chat=1, pdf_export=1, advanced_analysis=3）
- [ ] 24.2 创建默认套餐配置（如"新用户体验包"10积分）
- [ ] 24.3 实现新用户注册时自动分配默认套餐
- [ ] 24.4 在用户注册流程中调用 AssignBillingPackageToUser

## 25. 测试与验证
- [ ] 25.1 测试动作计价创建、修改、查询
- [ ] 25.2 测试套餐创建、修改、查询（包含积分）
- [ ] 25.3 测试用户套餐分配、激活、过期（积分作废）
- [ ] 25.4 测试积分扣减（单套餐、多套餐、跨套餐）
- [ ] 25.5 测试积分扣减的并发安全性（压力测试）
- [ ] 25.6 测试消费回滚（积分退回）
- [ ] 25.7 测试定时任务（过期清理、对账）
- [ ] 25.8 测试动作价格修改不影响历史记录
- [ ] 25.9 测试前端界面功能
- [ ] 25.10 测试API权限控制（用户只能看自己的数据）

## 26. 文档更新
- [ ] 26.1 更新API文档（`docs/简历润色工具-API.md` 或新建订阅API文档）
  - [ ] 添加动作计价API文档
  - [ ] 更新套餐API文档（积分相关）
  - [ ] 更新消费API文档（action_key相关）
- [ ] 26.2 更新数据库表结构文档
- [ ] 26.3 编写动作计价管理指南（给运营人员）
- [ ] 26.4 编写套餐管理使用指南（给运营人员）
- [ ] 26.5 更新前端组件文档（如果有）

## 27. 部署准备
- [ ] 27.1 在生产数据库执行迁移脚本
- [ ] 27.2 创建预置动作计价数据
- [ ] 27.3 创建初始套餐数据（如免费套餐、月度会员等）
- [ ] 27.4 为现有用户分配默认套餐（可选，看业务需求）
- [ ] 27.5 配置定时任务（cron或系统级任务）
- [ ] 27.6 验证生产环境功能正常

## 28. 监控与优化
- [ ] 28.1 监控积分扣减操作的性能（响应时间）
- [ ] 28.2 监控定时任务的执行情况
- [ ] 28.3 监控数据一致性（对账任务结果）
- [ ] 28.4 根据监控结果优化SQL查询和索引
- [ ] 28.5 考虑引入Redis缓存热点用户积分（如果性能不足）
- [ ] 28.6 监控动作价格修改频率和影响

