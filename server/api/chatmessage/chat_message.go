package chatmessage

import (
	"server/service/chatmessage"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// CreateChatMessage 创建聊天消息
// POST /api/chat-messages
func CreateChatMessage(c *gin.Context) {
	userID := c.GetString("userID")
	var req chatmessage.CreateChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	message, err := chatmessage.ChatMessageService.CreateChatMessage(userID, req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(message, c)
}

// GetChatMessages 获取聊天消息列表
// GET /api/chat-messages?resume_id=xxx&page=1&page_size=20&before_time=2024-01-01T00:00:00Z
func GetChatMessages(c *gin.Context) {
	userID := c.GetString("userID")
	var req chatmessage.GetChatMessagesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	messages, err := chatmessage.ChatMessageService.GetChatMessages(userID, req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(messages, c)
}

// DeleteChatMessage 删除聊天消息
// DELETE /api/chat-messages/:id
func DeleteChatMessage(c *gin.Context) {
	messageID := c.Param("id")
	userID := c.GetString("userID")

	// 调用服务层
	if err := chatmessage.ChatMessageService.DeleteChatMessage(messageID, userID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("删除成功", c)
}

// DeleteChatMessagesByResume 删除简历下的所有聊天消息
// DELETE /api/chat-messages/resume/:resume_id
func DeleteChatMessagesByResume(c *gin.Context) {
	resumeID := c.Param("resume_id")
	userID := c.GetString("userID")

	// 调用服务层
	if err := chatmessage.ChatMessageService.DeleteChatMessagesByResume(resumeID, userID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("删除成功", c)
}
