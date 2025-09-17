package router

import (
	"server/api/app"
	"server/api/file"
	"server/api/resume"
	"server/api/user"
	"server/api/workflow"

	"github.com/gin-gonic/gin"
)

// InitPrivateRouter 初始化私有路由
func InitPrivateRouter(privateRouter *gin.RouterGroup, publicRouter *gin.RouterGroup) {
	// 用户相关
	UserRouter := privateRouter.Group("/api/user")
	{
		UserRouter.GET("/profile", user.GetUserProfile)      // 获取用户信息
		UserRouter.PUT("/profile", user.UpdateUserProfile)   // 更新用户信息
		UserRouter.PUT("/password", user.ChangePassword)     // 修改密码
		UserRouter.POST("/logout", user.Logout)              // 用户登出
		UserRouter.POST("/upload_avatar", user.UploadAvatar) // 上传头像
		UserRouter.POST("/upload_resume", user.UploadResume) // 上传简历
	}

	// 对话相关
	ConversationRouter := privateRouter.Group("/api/conversation")
	{
		ConversationRouter.GET("", app.GetConversations)          // 获取对话列表
		ConversationRouter.GET("/:id", app.GetConversation)       // 获取特定对话
		ConversationRouter.POST("", app.CreateConversation)       // 创建对话
		ConversationRouter.PUT("/:id", app.UpdateConversation)    // 更新对话
		ConversationRouter.DELETE("/:id", app.DeleteConversation) // 删除对话
	}

	// 工作流相关
	WorkflowRouter := privateRouter.Group("/api/workflow")
	{
		WorkflowRouter.GET("", app.GetWorkflows)                        // 获取工作流列表
		WorkflowRouter.GET("/:id", app.GetWorkflow)                     // 获取特定工作流
		WorkflowRouter.POST("", app.CreateWorkflow)                     // 创建工作流
		WorkflowRouter.PUT("/:id", app.UpdateWorkflow)                  // 更新工作流
		WorkflowRouter.DELETE("/:id", app.DeleteWorkflow)               // 删除工作流
		WorkflowRouter.POST("/:id/execute", app.ExecuteWorkflow)        // 执行工作流
		WorkflowRouter.GET("/:id/history", workflow.GetWorkflowHistory) // 获取工作流执行历史
		WorkflowRouter.GET("/:id/stats", workflow.GetWorkflowStats)     // 获取工作流统计
	}

	// 工作流执行历史
	ExecutionRouter := privateRouter.Group("/api/execution")
	{
		ExecutionRouter.GET("/:id", workflow.GetExecutionDetail) // 获取执行详情
	}

	// 用户工作流历史
	UserWorkflowRouter := privateRouter.Group("/api/user/workflow_history")
	{
		UserWorkflowRouter.GET("", workflow.GetUserWorkflowHistory) // 获取用户工作流使用历史
	}

	// 简历管理相关
	ResumeRouter := privateRouter.Group("/api/user/resumes")
	{
		ResumeRouter.GET("", resume.GetUserResumes)       // 获取用户简历列表
		ResumeRouter.GET("/:id", resume.GetResumeByID)    // 获取特定简历详情
		ResumeRouter.PUT("/:id", resume.UpdateResume)     // 更新简历信息
		ResumeRouter.DELETE("/:id", resume.DeleteResume)  // 删除简历
		ResumeRouter.POST("/upload", resume.UploadResume) // 上传简历（新版本）
	}

	// 文件管理相关（新的统一文件接口）
	FileRouter := privateRouter.Group("/api/files")
	{
		FileRouter.POST("/upload", file.UploadFile) // 上传文件
		// FileRouter.GET("/:id/preview", file.PreviewFile) // 预览/下载文件
		// FileRouter.GET("/:id/info", file.GetFileInfo)    // 获取文件信息
	}
	FilePublicRouter := publicRouter.Group("/api/files")
	{
		FilePublicRouter.GET("/:id/preview", file.PreviewFile) // 预览/下载文件
		FilePublicRouter.GET("/:id/info", file.GetFileInfo)    // 获取文件信息
	}
}
