package router

import (
	"server/api/billing"

	"github.com/gin-gonic/gin"
)

// InitBillingRouter 初始化计费相关路由
func InitBillingRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 公共路由 - 动作价格查询和套餐列表
	BillingPublicRouter := publicGroup.Group("/api/billing")
	{
		BillingPublicRouter.GET("/action-prices", billing.ListActionPrices)             // 查询动作价格列表
		BillingPublicRouter.GET("/action-prices/active", billing.GetActiveActionPrices) // 获取启用的动作价格
		BillingPublicRouter.GET("/packages", billing.GetPublicBillingPackages)          // 获取公开可见的套餐列表
	}

	// 用户路由 - 我的套餐和积分
	BillingUserRouter := privateGroup.Group("/api/user/billing")
	{
		BillingUserRouter.GET("/packages", billing.GetMyBillingPackages) // 我的套餐
		BillingUserRouter.GET("/credits", billing.GetMyCredits)          // 我的积分
	}

	// 管理员路由 - 套餐管理
	AdminBillingRouter := adminGroup.Group("/api/admin/billing")
	{
		// 套餐管理
		AdminBillingRouter.POST("/packages", billing.CreateBillingPackage)    // 创建套餐
		AdminBillingRouter.GET("/packages", billing.ListBillingPackages)      // 查询套餐列表
		AdminBillingRouter.GET("/packages/:id", billing.GetBillingPackage)    // 获取单个套餐
		AdminBillingRouter.PUT("/packages/:id", billing.UpdateBillingPackage) // 更新套餐

		// 用户套餐管理
		AdminBillingRouter.POST("/user-packages", billing.AssignBillingPackage)                   // 分配套餐
		AdminBillingRouter.GET("/users/:userId/billing-packages", billing.GetUserBillingPackages) // 查询用户套餐
		AdminBillingRouter.POST("/user-packages/:id/activate", billing.ActivateBillingPackage)    // 激活套餐
	}

	// 内部路由 - 积分扣减
	BillingInternalRouter := publicGroup.Group("/api/internal/billing")
	{
		BillingInternalRouter.POST("/credits/check", billing.CheckCredits)   // 检查积分
		BillingInternalRouter.POST("/credits/deduct", billing.DeductCredits) // 扣减积分
	}
}
