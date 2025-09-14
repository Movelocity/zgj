package workflow

import (
	"server/service/workflow"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// GetWorkflowHistory 获取工作流执行历史
func GetWorkflowHistory(c *gin.Context) {
	workflowID := c.Param("id")
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	history, err := workflow.WorkflowService.GetWorkflowHistory(workflowID, page, pageSize)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(history, c)
}

// GetUserWorkflowHistory 获取用户工作流使用历史
func GetUserWorkflowHistory(c *gin.Context) {
	userID := c.GetString("userID")
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	history, err := workflow.WorkflowService.GetUserWorkflowHistory(userID, page, pageSize)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(history, c)
}

// GetExecutionDetail 获取执行详情
func GetExecutionDetail(c *gin.Context) {
	executionID := c.Param("id")

	detail, err := workflow.WorkflowService.GetExecutionDetail(executionID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(detail, c)
}

// GetWorkflowStats 获取工作流统计信息
func GetWorkflowStats(c *gin.Context) {
	workflowID := c.Param("id")

	stats, err := workflow.WorkflowService.GetWorkflowStats(workflowID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(stats, c)
}
