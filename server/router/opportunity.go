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

	PrivateOpportunityRouter := privateGroup.Group("/api/opportunities")
	{
		PrivateOpportunityRouter.POST("/match", opportunity.MatchOpportunities)
	}

	AdminOpportunityRouter := adminGroup.Group("/api/admin/opportunities")
	{
		AdminOpportunityRouter.GET("", opportunity.ListAdminOpportunities)
		AdminOpportunityRouter.POST("", opportunity.CreateOpportunity)
		AdminOpportunityRouter.POST("/batch", opportunity.BatchCreateOpportunities)
		AdminOpportunityRouter.POST("/vector/rebuild", opportunity.RebuildOpportunityVectors)
		AdminOpportunityRouter.PUT("/:id", opportunity.UpdateOpportunity)
		AdminOpportunityRouter.DELETE("/:id", opportunity.ArchiveOpportunity)
	}
}
