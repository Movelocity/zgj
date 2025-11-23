# 计费系统集成指南

## MVP 版本 - 简历优化功能接入

### 概述

本文档说明如何将计费系统集成到业务功能中，以简历优化功能为例。

### 后端集成步骤

#### 1. 导入计费服务

```go
import (
    billingService "server/service/billing"
)
```

#### 2. 在工作流执行前检查和扣减积分

在 `server/api/app/app.go` 的 `ExecuteWorkflowByName` 函数中添加积分检查：

```go
func ExecuteWorkflowByName(c *gin.Context) {
    workflowName := c.Param("name")
    userID := c.GetString("userID")
    var req appService.WorkflowAPIRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.FailWithMessage(err.Error(), c)
        return
    }

    if req.ResponseMode == "" {
        req.ResponseMode = "blocking"
    }

    // ========== 添加积分检查和扣减 ==========
    // 检查并扣减积分（仅针对需要计费的工作流）
    if err := billingService.ServiceGroupApp.UserPackageService.CheckAndDeductForWorkflow(userID, workflowName); err != nil {
        utils.FailWithMessage(err.Error(), c)
        return
    }
    // ========================================

    // 调用服务层
    result, err := service.AppService.ExecuteWorkflowByName(c, workflowName, userID, req.Inputs, req.ResponseMode)
    if err != nil {
        // 如果执行失败，可以考虑退回积分（可选）
        // TODO: 实现退款逻辑
        utils.FailWithMessage(err.Error(), c)
        return
    }

    if req.ResponseMode == "blocking" {
        utils.OkWithData(result, c)
    }
}
```

#### 3. 工作流名称映射规则

目前在 `server/service/billing/integration_helper.go` 中定义了以下映射：

- `"简历优化"`, `"resume_optimize"`, `"优化简历"` → 扣减 1 积分（resume_optimize）
- `"AI对话"`, `"ai_chat"` → 扣减 1 积分（ai_chat）
- `"PDF导出"`, `"pdf_export"` → 扣减 1 积分（pdf_export）
- `"高级分析"`, `"advanced_analysis"` → 扣减 3 积分（advanced_analysis）
- 其他工作流 → 不扣费

可根据实际业务需求修改映射规则。

### 前端集成步骤

#### 1. 显示用户积分

在页面头部添加积分显示组件：

```tsx
import CreditsDisplay from '@/components/billing/CreditsDisplay';

// 在组件中使用
<CreditsDisplay />
```

#### 2. 优化前检查积分

在简历优化按钮点击前检查积分：

```tsx
import { checkCredits } from '@/api/billing';
import { showError } from '@/utils/toast';

const handleOptimizeResume = async () => {
  try {
    // 检查积分
    const checkResult = await checkCredits({
      user_id: userID,
      action_key: 'resume_optimize',
    });

    if (checkResult.data.code === 0) {
      if (!checkResult.data.data.has_enough) {
        showError(
          `积分不足，需要 ${checkResult.data.data.required_credits} 积分，` +
          `当前仅有 ${checkResult.data.data.total_credits} 积分`
        );
        return;
      }
    }

    // 执行优化（积分会在后端自动扣减）
    await executeWorkflow(...);
    
    // 刷新积分显示
    // CreditsDisplay 组件会自动刷新
  } catch (error) {
    console.error('优化失败:', error);
    showError('优化失败');
  }
};
```

#### 3. 显示操作所需积分

在操作按钮旁显示所需积分：

```tsx
import { getActiveActionPrices } from '@/api/billing';

const [actionPrices, setActionPrices] = useState({});

useEffect(() => {
  loadActionPrices();
}, []);

const loadActionPrices = async () => {
  const response = await getActiveActionPrices();
  if (response.data.code === 0) {
    const prices = {};
    response.data.data.forEach(item => {
      prices[item.action_key] = item.credits_cost;
    });
    setActionPrices(prices);
  }
};

// 显示按钮
<Button onClick={handleOptimizeResume}>
  优化简历 ({actionPrices['resume_optimize'] || 1} 积分)
</Button>
```

### 测试步骤

1. **运行数据库迁移**：
   ```bash
   psql -U your_user -d your_database -f scripts/migration_add_billing_system_mvp.sql
   ```

2. **为测试用户分配套餐**：
   - 登录管理后台
   - 进入"用户套餐管理"页面
   - 选择测试用户，分配"新用户体验包"或其他套餐

3. **测试简历优化**：
   - 登录用户账号
   - 查看积分余额
   - 执行简历优化操作
   - 验证积分是否正确扣减
   - 验证积分不足时的提示

4. **测试积分耗尽**：
   - 多次执行操作直到积分耗尽
   - 验证积分不足提示
   - 确认无法执行操作

### 管理员操作指南

#### 查看和管理套餐

1. 登录管理后台
2. 进入"套餐管理"页面
3. 可以创建、编辑套餐
4. 设置套餐的积分数量、有效期、价格等

#### 为用户分配套餐

1. 进入"用户套餐管理"页面
2. 选择用户
3. 点击"分配套餐"
4. 选择套餐类型
5. 填写备注（如：新用户赠送、运营补偿等）
6. 选择是否立即激活
7. 确认分配

#### 查看用户套餐使用情况

1. 在"用户套餐管理"页面选择用户
2. 查看用户所有套餐的状态
3. 查看已用积分和剩余积分
4. 查看套餐过期时间

### 常见问题

**Q: 积分扣减失败怎么办？**

A: 积分扣减是在事务中完成的，如果失败会自动回滚。失败原因可能是：
- 积分不足
- 套餐已过期
- 数据库连接问题

**Q: 如何退回已扣减的积分？**

A: MVP版本暂未实现自动退款功能。如需退款，需要通过管理后台手动为用户分配补偿套餐。

**Q: 如何添加新的计费动作？**

A: 
1. 在管理后台的"动作计价管理"页面添加新动作（V1功能，MVP暂不支持前端管理）
2. 或直接在数据库中插入新记录：
   ```sql
   INSERT INTO billing_action_prices (action_key, action_name, description, credits_cost, is_active, sort_order)
   VALUES ('new_action', '新动作', '新动作描述', 2, true, 10);
   ```
3. 在 `integration_helper.go` 中添加工作流名称映射

**Q: 如何修改动作价格？**

A: 在管理后台的"动作计价管理"页面修改（V1功能），或直接更新数据库。价格修改不影响已产生的消费记录。

### 后续扩展

MVP版本完成后，可以考虑以下扩展：

1. **消费记录系统**（V1）：记录每次积分扣减的详细信息
2. **自动退款**：工作流执行失败时自动退回积分
3. **动作计价管理界面**（V1）：前端管理动作价格
4. **消费统计报表**（V1）：用户和管理员查看消费历史
5. **积分预警**：积分不足时提前提醒用户
6. **套餐推荐**：根据用户使用情况推荐合适的套餐

### API参考

详见：`docs/简历润色工具-API.md`（需要补充计费相关API文档）

### 相关文件

- 后端服务：`server/service/billing/`
- 后端API：`server/api/billing/`
- 前端类型：`web/src/types/billing.ts`
- 前端API：`web/src/api/billing.ts`
- 前端组件：`web/src/components/billing/`
- 管理界面：`web/src/pages/admin/components/`

