package system

import (
	"server/service"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// GetSystemStats 获取系统统计
func GetSystemStats(c *gin.Context) {
	// 调用服务层
	stats, err := service.SystemService.GetSystemStats()
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(stats, c)
}

// GetSystemLogs 获取系统日志
func GetSystemLogs(c *gin.Context) {
	var req GetSystemLogsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 设置默认值
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 20
	}

	// 调用服务层
	logs, err := service.SystemService.GetSystemLogs(req.Page, req.PageSize, req.Level)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(logs, c)
}
