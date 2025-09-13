package router

import (
	"server/api/app"
	"server/api/user"

	"github.com/gin-gonic/gin"
)

// InitPrivateRouter 初始化私有路由
func InitPrivateRouter(Router *gin.RouterGroup) {
	// 用户相关
	UserRouter := Router.Group("/api/user")
	{
		UserRouter.GET("/profile", user.GetUserProfile)      // 获取用户信息
		UserRouter.PUT("/profile", user.UpdateUserProfile)   // 更新用户信息
		UserRouter.POST("/logout", user.Logout)              // 用户登出
		UserRouter.POST("/upload_avatar", user.UploadAvatar) // 上传头像
		UserRouter.POST("/upload_resume", user.UploadResume) // 上传简历
	}

	// 对话相关
	ConversationRouter := Router.Group("/api/conversation")
	{
		ConversationRouter.GET("", app.GetConversations)          // 获取对话列表
		ConversationRouter.GET("/:id", app.GetConversation)       // 获取特定对话
		ConversationRouter.POST("", app.CreateConversation)       // 创建对话
		ConversationRouter.PUT("/:id", app.UpdateConversation)    // 更新对话
		ConversationRouter.DELETE("/:id", app.DeleteConversation) // 删除对话
	}

	// 工作流相关
	WorkflowRouter := Router.Group("/api/workflow")
	{
		WorkflowRouter.GET("", app.GetWorkflows)                 // 获取工作流列表
		WorkflowRouter.GET("/:id", app.GetWorkflow)              // 获取特定工作流
		WorkflowRouter.POST("", app.CreateWorkflow)              // 创建工作流
		WorkflowRouter.PUT("/:id", app.UpdateWorkflow)           // 更新工作流
		WorkflowRouter.DELETE("/:id", app.DeleteWorkflow)        // 删除工作流
		WorkflowRouter.POST("/:id/execute", app.ExecuteWorkflow) // 执行工作流
	}
}
