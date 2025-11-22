package router

import (
	"server/api/eventlog"

	"github.com/gin-gonic/gin"
)

// InitEventLogRouter 初始化事件日志相关路由
func InitEventLogRouter(adminGroup *gin.RouterGroup) {
	// 管理员路由 - 事件日志查询
	AdminEventLogRouter := adminGroup.Group("/api/admin/event-logs")
	{
		AdminEventLogRouter.GET("", eventlog.QueryEventLogs) // 查询事件日志
	}
}

