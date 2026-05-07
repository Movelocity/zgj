package router

import (
	"server/api/opportunity"

	"github.com/gin-gonic/gin"
)

// InitOpportunityRouter 初始化岗位机会相关路由
func InitOpportunityRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	PublicOpportunityRouter := publicGroup.Group("/api/opportunities")
	{
		PublicOpportunityRouter.GET("", opportunity.ListPublicOpportunities)
	}

	AdminOpportunityRouter := adminGroup.Group("/api/admin/opportunities")
	{
		AdminOpportunityRouter.GET("", opportunity.ListAdminOpportunities)
		AdminOpportunityRouter.POST("", opportunity.CreateOpportunity)
		AdminOpportunityRouter.POST("/batch", opportunity.BatchCreateOpportunities)
		AdminOpportunityRouter.PUT("/:id", opportunity.UpdateOpportunity)
		AdminOpportunityRouter.DELETE("/:id", opportunity.ArchiveOpportunity)
	}
}
