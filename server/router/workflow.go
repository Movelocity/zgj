package router

import (
	"server/api/app"

	"github.com/gin-gonic/gin"
)

// InitWorkflowRouter 初始化工作流相关路由
func InitWorkflowRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 用户工作流操作
	WorkflowRouter := privateGroup.Group("/api/workflow")
	{
		WorkflowRouter.GET("", app.GetWorkflows)                 // 获取工作流列表
		WorkflowRouter.GET("/:id", app.GetWorkflow)              // 获取特定工作流
		WorkflowRouter.POST("", app.CreateWorkflow)              // 创建工作流
		WorkflowRouter.DELETE("/:id", app.DeleteWorkflow)        // 删除工作流
		WorkflowRouter.POST("/:id/execute", app.ExecuteWorkflow) // 执行工作流
	}

	// 管理员路由 - 工作流管理
	AdminWorkflowRouter := adminGroup.Group("/api/workflow")
	{
		AdminWorkflowRouter.GET("/all", app.GetAllWorkflows)     // 获取所有工作流
		AdminWorkflowRouter.PUT("/:id", app.AdminUpdateWorkflow) // 管理员更新工作流
	}
}
