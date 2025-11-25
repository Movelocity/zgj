package billing

import (
	"errors"
	"fmt"

	"gorm.io/gorm"
)

// CheckAndDeductForWorkflow 检查并扣减工作流执行所需积分
// 这是MVP版本的简化实现，根据工作流名称判断动作类型
func CheckAndDeductForWorkflow(userID string, workflowName string) error {
	// 根据工作流名称映射到动作key
	actionKey := mapWorkflowToActionKey(workflowName)
	if actionKey == "" {
		// 如果工作流不需要扣费，直接返回成功
		return nil
	}

	// 检查积分是否足够
	userPackageService := &UserPackageService{}
	checkResult, err := userPackageService.CheckCredits(userID, actionKey)
	if err != nil {
		return fmt.Errorf("检查积分失败: %w", err)
	}

	if !checkResult.HasEnough {
		return fmt.Errorf("积分不足，需要 %d 积分，当前仅有 %d 积分",
			checkResult.RequiredCredits, checkResult.TotalCredits)
	}

	// 扣减积分
	deductReq := &DeductCreditsRequest{
		UserID:    userID,
		ActionKey: actionKey,
	}

	deductResult, err := userPackageService.DeductCredits(deductReq)
	if err != nil {
		return fmt.Errorf("扣减积分失败: %w", err)
	}

	if !deductResult.Success {
		return fmt.Errorf(deductResult.Message)
	}

	return nil
}

// mapWorkflowToActionKey 将工作流名称映射到动作key
// MVP版本：仅支持简历优化相关工作流
func mapWorkflowToActionKey(workflowName string) ActionKey {
	// 根据工作流名称判断动作类型
	// 这里可以根据实际业务需求扩展
	switch workflowName {
	case "简历优化", "resume_optimize", "优化简历":
		return ActionResumeOptimize
	case "AI对话", "ai_chat":
		return ActionAIChat
	case "PDF导出", "pdf_export":
		return ActionPDFExport
	case "高级分析", "advanced_analysis":
		return ActionAdvancedAnalysis
	default:
		// 其他工作流暂不扣费
		return ""
	}
}

// GetWorkflowCreditsCost 获取工作流执行所需积分
// 用于前端显示
func GetWorkflowCreditsCost(workflowName string) (int, error) {
	actionKey := mapWorkflowToActionKey(workflowName)
	if actionKey == "" {
		return 0, nil
	}

	actionPriceService := &ActionPriceService{}
	actionPrice, err := actionPriceService.GetActionPrice(actionKey.String())
	if err != nil {
		return 0, err
	}

	return actionPrice.CreditsCost, nil
}

// AllocatePackageByName 根据套餐名称为用户分配套餐
func AllocatePackageByName(userID string, packageName string, source PackageSource, notes string) error {
	if packageName == "" {
		return nil // 如果没有指定套餐名，直接返回
	}

	// 根据套餐名称查找套餐
	packageService := &PackageService{}
	pkg, err := packageService.GetBillingPackageByName(packageName)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("套餐不存在: %s", packageName)
		}
		return fmt.Errorf("查找套餐失败: %w", err)
	}

	// 分配套餐给用户
	userPackageService := &UserPackageService{}
	_, err = userPackageService.AssignBillingPackageToUser(
		userID,
		pkg.ID,
		source,
		notes,
		true, // 自动激活
	)
	if err != nil {
		return fmt.Errorf("分配套餐失败: %w", err)
	}

	return nil
}
