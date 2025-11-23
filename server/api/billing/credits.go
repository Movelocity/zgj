package billing

import (
	billingService "server/service/billing"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// CheckCreditsRequest 检查积分请求
type CheckCreditsRequest struct {
	UserID    string `json:"user_id" binding:"required"`
	ActionKey string `json:"action_key" binding:"required"`
}

// DeductCreditsRequest 扣减积分请求
type DeductCreditsRequest struct {
	UserID       string `json:"user_id" binding:"required"`
	ActionKey    string `json:"action_key" binding:"required"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
}

// CheckCredits 检查积分（内部API）
// POST /api/internal/billing/credits/check
func CheckCredits(c *gin.Context) {
	var req CheckCreditsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	service := &billingService.UserPackageService{}
	result, err := service.CheckCredits(req.UserID, billingService.ActionKey(req.ActionKey))
	if err != nil {
		utils.FailWithMessage("检查积分失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(result, c)
}

// DeductCredits 扣减积分（内部API）
// POST /api/internal/billing/credits/deduct
func DeductCredits(c *gin.Context) {
	var req DeductCreditsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	service := &billingService.UserPackageService{}
	serviceReq := &billingService.DeductCreditsRequest{
		UserID:       req.UserID,
		ActionKey:    billingService.ActionKey(req.ActionKey),
		ResourceType: req.ResourceType,
		ResourceID:   req.ResourceID,
	}

	result, err := service.DeductCredits(serviceReq)
	if err != nil {
		utils.FailWithMessage("扣减积分失败: "+err.Error(), c)
		return
	}

	if !result.Success {
		utils.FailWithMessage(result.Message, c)
		return
	}

	utils.OkWithData(result, c)
}
