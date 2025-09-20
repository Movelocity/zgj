package router

import (
	"server/api/app"

	"github.com/gin-gonic/gin"
)

// InitConversationRouter 初始化对话相关路由
func InitConversationRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 用户对话操作
	ConversationRouter := privateGroup.Group("/api/conversation")
	{
		ConversationRouter.GET("", app.GetConversations)          // 获取对话列表
		ConversationRouter.GET("/:id", app.GetConversation)       // 获取特定对话
		ConversationRouter.POST("", app.CreateConversation)       // 创建对话
		ConversationRouter.PUT("/:id", app.UpdateConversation)    // 更新对话
		ConversationRouter.DELETE("/:id", app.DeleteConversation) // 删除对话
	}

	// 目前对话功能没有公共路由和管理员专用路由
	// 如果以后需要可以在这里添加
}
