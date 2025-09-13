package router

import (
	"server/api/app"
	"server/api/system"
	"server/api/user"

	"github.com/gin-gonic/gin"
)

// InitAdminRouter 初始化管理员路由
func InitAdminRouter(Router *gin.RouterGroup) {
	// 用户管理
	AdminUserRouter := Router.Group("/api/admin/user")
	{
		AdminUserRouter.GET("", user.GetAllUsers)                    // 获取所有用户
		AdminUserRouter.GET("/:id", user.GetUserByID)                // 获取特定用户
		AdminUserRouter.PUT("/:id", user.UpdateUserByAdmin)          // 更新用户信息
		AdminUserRouter.DELETE("/:id", user.DeleteUser)              // 删除用户
		AdminUserRouter.POST("/:id/activate", user.ActivateUser)     // 激活用户
		AdminUserRouter.POST("/:id/deactivate", user.DeactivateUser) // 停用用户
	}

	// 系统统计
	AdminSystemRouter := Router.Group("/api/admin/system")
	{
		AdminSystemRouter.GET("/stats", system.GetSystemStats) // 获取系统统计
		AdminSystemRouter.GET("/logs", system.GetSystemLogs)   // 获取系统日志
	}

	// 工作流管理
	AdminWorkflowRouter := Router.Group("/api/admin/workflow")
	{
		AdminWorkflowRouter.GET("/all", app.GetAllWorkflows)     // 获取所有工作流
		AdminWorkflowRouter.PUT("/:id", app.AdminUpdateWorkflow) // 管理员更新工作流
	}
}
