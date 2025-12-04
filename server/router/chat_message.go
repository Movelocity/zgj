package router

import (
	"server/api/chatmessage"

	"github.com/gin-gonic/gin"
)

// InitChatMessageRouter 初始化聊天消息相关路由
func InitChatMessageRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 用户聊天消息操作
	ChatMessageRouter := privateGroup.Group("/api/chat-messages")
	{
		ChatMessageRouter.POST("", chatmessage.CreateChatMessage)                              // 创建聊天消息
		ChatMessageRouter.GET("", chatmessage.GetChatMessages)                                 // 获取聊天消息列表
		ChatMessageRouter.DELETE("/:id", chatmessage.DeleteChatMessage)                        // 删除单条聊天消息
		ChatMessageRouter.DELETE("/resume/:resume_id", chatmessage.DeleteChatMessagesByResume) // 删除简历下的所有消息
	}

	// 目前聊天消息功能没有公共路由和管理员专用路由
	// 如果以后需要可以在这里添加
}
