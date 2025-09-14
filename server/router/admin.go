package router

import (
	"server/api/app"
	"server/api/file"
	"server/api/resume"
	"server/api/system"
	"server/api/user"

	"github.com/gin-gonic/gin"
)

// InitAdminRouter 初始化管理员路由
func InitAdminRouter(Router *gin.RouterGroup) {
	// 移除了专门的管理员认证API，管理员使用统一的用户登录系统

	// 用户管理
	AdminUserRouter := Router.Group("/api/admin/user")
	{
		AdminUserRouter.GET("", user.GetAllUsers)                       // 获取所有用户
		AdminUserRouter.GET("/:id", user.GetUserByID)                   // 获取特定用户
		AdminUserRouter.PUT("/:id", user.UpdateUserByAdmin)             // 更新用户信息
		AdminUserRouter.DELETE("/:id", user.DeleteUser)                 // 删除用户
		AdminUserRouter.POST("/:id/activate", user.ActivateUser)        // 激活用户
		AdminUserRouter.POST("/:id/deactivate", user.DeactivateUser)    // 停用用户
		AdminUserRouter.PUT("/:id/role", user.UpdateUserRole)           // 更新用户角色权限
		AdminUserRouter.PUT("/:id/password", user.AdminChangePassword)  // 管理员修改用户密码
		AdminUserRouter.GET("/:id/resumes", resume.GetAdminUserResumes) // 管理员查看用户简历
	}

	// 系统统计
	AdminSystemRouter := Router.Group("/api/admin/system")
	{
		AdminSystemRouter.GET("/stats", system.GetSystemStats) // 获取系统统计
		AdminSystemRouter.GET("/logs", system.GetSystemLogs)   // 获取系统日志
	}

	// 工作流管理
	AdminWorkflowRouter := Router.Group("/api/admin/workflow")
	{
		AdminWorkflowRouter.GET("/all", app.GetAllWorkflows)     // 获取所有工作流
		AdminWorkflowRouter.PUT("/:id", app.AdminUpdateWorkflow) // 管理员更新工作流
	}

	// 文件管理
	AdminFileRouter := Router.Group("/api/admin/files")
	{
		AdminFileRouter.GET("/stats", file.GetFileStats)             // 获取文件统计
		AdminFileRouter.GET("", file.GetFileList)                    // 获取文件列表
		AdminFileRouter.DELETE("/:id", file.DeleteFile)              // 删除文件
		AdminFileRouter.POST("/batch_delete", file.BatchDeleteFiles) // 批量删除文件
	}

	// 数据迁移
	AdminMigrationRouter := Router.Group("/api/admin/migration")
	{
		AdminMigrationRouter.POST("/resume", resume.MigrateResumeData) // 迁移简历数据
	}
}
