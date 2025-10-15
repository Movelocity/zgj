package app

import (
	"server/service"
	appService "server/service/app"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// GetConversations 获取对话列表
// GET /api/conversation
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
// GET /api/conversation/:id
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
// POST /api/conversation
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
// PUT /api/conversation/:id
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
// DELETE /api/conversation/:id
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
// GET /api/workflow
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
// GET /api/workflow/:id
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
// POST /api/workflow
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

// DeleteWorkflow 删除工作流
// DELETE /api/workflow/:id
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

// 可以指定 block 或 streaming 响应方式
// POST /api/workflow/v2/:name/execute
func ExecuteWorkflowByName(c *gin.Context) {
	workflowName := c.Param("name")
	userID := c.GetString("userID")
	var req appService.WorkflowAPIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	if req.ResponseMode == "" {
		req.ResponseMode = "blocking"
	}

	// 调用服务层
	result, err := service.AppService.ExecuteWorkflowByName(c, workflowName, userID, req.Inputs, req.ResponseMode)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	if req.ResponseMode == "blocking" {
		utils.OkWithData(result, c)
	} // streaming 类型不用在这里响应
}

// ExecuteWorkflow 执行工作流
// POST /api/workflow/v1/:id/execute
func ExecuteWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	userID := c.GetString("userID") // 从中间件设置的上下文参数中获取用户ID
	var req appService.WorkflowAPIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	switch req.ResponseMode {
	case "blocking":
		// 调用服务层
		result, err := service.AppService.ExecuteWorkflow(workflowID, userID, req.Inputs)
		if err != nil {
			utils.FailWithMessage(err.Error(), c)
			return
		}
		utils.OkWithData(result, c)
	case "streaming":
		// 调用服务层流式执行
		if err := service.AppService.ExecuteWorkflowStream(c, workflowID, userID, req.Inputs); err != nil {
			// 错误已经在服务层处理并发送给客户端
			return
		}
	default:
		utils.FailWithMessage("响应模式不支持", c)
		return
	}

}

// GetAllWorkflows 获取所有工作流（管理员）
// GET /api/workflow/all
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
// PUT /api/workflow/:id
func UpdateWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	var req appService.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	if err := service.AppService.UpdateWorkflow(workflowID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("更新成功", c)
}

// ExecuteWorkflowStream 流式执行工作流
// func ExecuteWorkflowStream(c *gin.Context) {
// 	workflowID := c.Param("id")
// 	userID := c.GetString("userID")
// 	var req appService.WorkflowAPIRequest
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		utils.FailWithMessage(err.Error(), c)
// 		return
// 	}

// 	// 调用服务层流式执行
// 	if err := service.AppService.ExecuteWorkflowStream(c, workflowID, userID, req.Inputs); err != nil {
// 		// 错误已经在服务层处理并发送给客户端
// 		return
// 	}
// }
