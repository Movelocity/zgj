package eventlog

import (
	"server/service"
	eventlogService "server/service/eventlog"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// QueryEventLogs 查询事件日志（管理员）
func QueryEventLogs(c *gin.Context) {
	var req eventlogService.QueryRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 调用服务层
	response, err := service.EventLogService.Query(c.Request.Context(), &req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

