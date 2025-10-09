package router

import (
	"server/api/resume"

	"github.com/gin-gonic/gin"
)

// InitResumeRouter 初始化简历相关路由
func InitResumeRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 用户简历管理
	ResumeRouter := privateGroup.Group("/api/user/resumes")
	{
		ResumeRouter.GET("", resume.GetUserResumes)                          // 获取用户简历列表
		ResumeRouter.GET("/:id", resume.GetResumeByID)                       // 获取特定简历详情
		ResumeRouter.PUT("/:id", resume.UpdateResume)                        // 更新简历信息
		ResumeRouter.DELETE("/:id", resume.DeleteResume)                     // 删除简历
		ResumeRouter.POST("/upload", resume.UploadResume)                    // 上传简历（新版本）
		ResumeRouter.POST("/file_to_text/:id", resume.ResumeFileToText)      // 将简历文件转换为文本
		ResumeRouter.POST("/structure_data/:id", resume.StructureTextToJSON) // 将简历文本转换为JSON
		ResumeRouter.POST("/create_text", resume.CreateTextResume)           // 创建纯文本简历
	}

	// 管理员路由 - 简历管理
	AdminResumeRouter := adminGroup.Group("/api/admin")
	{
		// 管理员查看用户简历（在用户管理下）
		AdminResumeRouter.GET("/user/:id/resumes", resume.GetAdminUserResumes) // 管理员查看用户简历
	}

	// 数据迁移
	AdminMigrationRouter := adminGroup.Group("/api/admin/migration")
	{
		AdminMigrationRouter.POST("/resume", resume.MigrateResumeData)                     // 迁移简历数据
		AdminMigrationRouter.POST("/reorganize-versions", resume.ReorganizeResumeVersions) // 重新整理简历版本
	}

}
