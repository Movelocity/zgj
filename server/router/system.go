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
		AdminSystemRouter.GET("/stats", system.GetSystemStats) // 获取系统统计
		AdminSystemRouter.GET("/logs", system.GetSystemLogs)   // 获取系统日志
	}

	// 如果以后需要公共系统信息或用户系统信息可以在这里添加
}
