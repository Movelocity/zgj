package router

import (
	"server/api/file"

	"github.com/gin-gonic/gin"
)

// InitFileRouter 初始化文件相关路由
func InitFileRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 需要认证的文件操作
	if privateGroup != nil {
		FileRouter := privateGroup.Group("/api/files")
		{
			FileRouter.POST("/upload", file.UploadFile) // 上传文件
		}
	}

	// 公共路由 - 文件访问（不需要认证）
	FilePublicRouter := publicGroup.Group("/api/files")
	{
		FilePublicRouter.GET("/:id/preview", file.PreviewFile) // 预览/下载文件
		FilePublicRouter.GET("/:id/info", file.GetFileInfo)    // 获取文件信息
	}

	// 管理员路由 - 文件管理
	AdminFileRouter := adminGroup.Group("/api/admin/files")
	{
		AdminFileRouter.GET("/stats", file.GetFileStats)             // 获取文件统计
		AdminFileRouter.GET("", file.GetFileList)                    // 获取文件列表
		AdminFileRouter.DELETE("/:id", file.DeleteFile)              // 删除文件
		AdminFileRouter.POST("/batch_delete", file.BatchDeleteFiles) // 批量删除文件
	}
}
