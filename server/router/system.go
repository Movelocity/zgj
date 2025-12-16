package router

import (
	"server/api/system"

	"github.com/gin-gonic/gin"
)

// InitSystemRouter 初始化系统相关路由
func InitSystemRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 系统相关功能目前只有管理员路由
	AdminSystemRouter := adminGroup.Group("/api/admin/system")
	{
		AdminSystemRouter.GET("/stats", system.GetSystemStats)                       // 获取系统统计
		AdminSystemRouter.GET("/logs", system.GetSystemLogs)                         // 获取系统日志
		AdminSystemRouter.GET("/daily-user-growth", system.GetDailyUserGrowth)       // 获取每日用户增长统计
		AdminSystemRouter.GET("/daily-workflow-usage", system.GetDailyWorkflowUsage) // 获取每日工作流使用统计
	}

	// 如果以后需要公共系统信息或用户系统信息可以在这里添加
}
