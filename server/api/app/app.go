package app

import (
	"server/service"
	appService "server/service/app"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// GetConversations 获取对话列表
func GetConversations(c *gin.Context) {
	userID := c.GetString("userID")

	// 调用服务层
	conversations, err := service.AppService.GetConversations(userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(conversations, c)
}

// GetConversation 获取特定对话
func GetConversation(c *gin.Context) {
	conversationID := c.Param("id")
	userID := c.GetString("userID")

	// 调用服务层
	conversation, err := service.AppService.GetConversation(conversationID, userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(conversation, c)
}

// CreateConversation 创建对话
func CreateConversation(c *gin.Context) {
	userID := c.GetString("userID")
	var req appService.CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	conversation, err := service.AppService.CreateConversation(userID, req.Title)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(conversation, c)
}

// UpdateConversation 更新对话
func UpdateConversation(c *gin.Context) {
	conversationID := c.Param("id")
	userID := c.GetString("userID")
	var req appService.UpdateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	if err := service.AppService.UpdateConversation(conversationID, userID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("更新成功", c)
}

// DeleteConversation 删除对话
func DeleteConversation(c *gin.Context) {
	conversationID := c.Param("id")
	userID := c.GetString("userID")

	// 调用服务层
	if err := service.AppService.DeleteConversation(conversationID, userID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("删除成功", c)
}

// GetWorkflows 获取工作流列表
func GetWorkflows(c *gin.Context) {
	userID := c.GetString("userID")

	// 调用服务层
	workflows, err := service.AppService.GetWorkflows(userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(workflows, c)
}

// GetWorkflow 获取特定工作流
func GetWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	userID := c.GetString("userID")

	// 调用服务层
	workflow, err := service.AppService.GetWorkflow(workflowID, userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(workflow, c)
}

// CreateWorkflow 创建工作流
func CreateWorkflow(c *gin.Context) {
	userID := c.GetString("userID")
	var req appService.CreateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	workflow, err := service.AppService.CreateWorkflow(userID, req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(workflow, c)
}

// UpdateWorkflow 更新工作流
func UpdateWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	userID := c.GetString("userID")
	var req appService.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	if err := service.AppService.UpdateWorkflow(workflowID, userID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("更新成功", c)
}

// DeleteWorkflow 删除工作流
func DeleteWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	userID := c.GetString("userID")

	// 调用服务层
	if err := service.AppService.DeleteWorkflow(workflowID, userID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("删除成功", c)
}

// ExecuteWorkflow 执行工作流
func ExecuteWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	userID := c.GetString("userID")
	var req appService.ExecuteWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	result, err := service.AppService.ExecuteWorkflow(workflowID, userID, req.Inputs)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(result, c)
}

// GetAllWorkflows 获取所有工作流（管理员）
func GetAllWorkflows(c *gin.Context) {
	// 调用服务层
	workflows, err := service.AppService.GetAllWorkflows()
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(workflows, c)
}

// AdminUpdateWorkflow 管理员更新工作流
func AdminUpdateWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	var req appService.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	if err := service.AppService.AdminUpdateWorkflow(workflowID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("更新成功", c)
}
