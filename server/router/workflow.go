package router

import (
	"server/api/app"
	"server/api/workflow"

	"github.com/gin-gonic/gin"
)

// InitWorkflowRouter 初始化工作流相关路由
func InitWorkflowRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 用户工作流操作
	WorkflowRouter := privateGroup.Group("/api/workflow")
	{
		WorkflowRouter.GET("", app.GetWorkflows)                        // 获取工作流列表
		WorkflowRouter.GET("/:id", app.GetWorkflow)                     // 获取特定工作流
		WorkflowRouter.POST("", app.CreateWorkflow)                     // 创建工作流
		WorkflowRouter.DELETE("/:id", app.DeleteWorkflow)               // 删除工作流
		WorkflowRouter.POST("/:id/execute", app.ExecuteWorkflow)        // 执行工作流
		WorkflowRouter.GET("/:id/history", workflow.GetWorkflowHistory) // 获取工作流执行历史
		WorkflowRouter.GET("/:id/stats", workflow.GetWorkflowStats)     // 获取工作流统计
	}

	// 工作流执行历史
	ExecutionRouter := privateGroup.Group("/api/execution")
	{
		ExecutionRouter.GET("/:id", workflow.GetExecutionDetail) // 获取执行详情
	}

	// 用户工作流历史
	UserWorkflowRouter := privateGroup.Group("/api/user/workflow_history")
	{
		UserWorkflowRouter.GET("", workflow.GetUserWorkflowHistory) // 获取用户工作流使用历史
	}

	// 管理员路由 - 工作流管理
	AdminWorkflowRouter := adminGroup.Group("/api/workflow")
	{
		AdminWorkflowRouter.GET("/all", app.GetAllWorkflows)     // 获取所有工作流
		AdminWorkflowRouter.PUT("/:id", app.AdminUpdateWorkflow) // 管理员更新工作流
	}
}
