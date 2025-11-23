package billing

import (
	billingService "server/service/billing"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// ListActionPrices 查询动作价格列表
// GET /api/billing/action-prices
func ListActionPrices(c *gin.Context) {
	activeOnly := c.Query("active_only") == "true"

	service := &billingService.ActionPriceService{}
	actionPrices, err := service.ListActionPrices(activeOnly)
	if err != nil {
		utils.FailWithMessage("查询失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(actionPrices, c)
}

// GetActiveActionPrices 获取所有启用的动作价格（前端使用）
// GET /api/billing/action-prices/active
func GetActiveActionPrices(c *gin.Context) {
	service := &billingService.ActionPriceService{}
	actionPrices, err := service.ListActionPrices(true)
	if err != nil {
		utils.FailWithMessage("查询失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(actionPrices, c)
}
