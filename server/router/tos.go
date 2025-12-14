package router

import (
	"server/api/tos"

	"github.com/gin-gonic/gin"
)

// InitTOSRouter 初始化TOS相关路由
func InitTOSRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 需要认证的TOS操作
	if privateGroup != nil {
		TOSRouter := privateGroup.Group("/api/tos")
		{
			TOSRouter.GET("/sts", tos.GetSTSCredentials)                  // 获取STS临时凭证
			TOSRouter.POST("/presign", tos.GeneratePresignURL)            // 生成上传预签名URL
			TOSRouter.GET("/presign/download", tos.GenerateDownloadURL)   // 生成下载预签名URL
			TOSRouter.POST("/uploads/complete", tos.RecordUploadComplete) // 上传完成回调
			TOSRouter.GET("/uploads", tos.ListUploads)                    // 获取上传记录列表
		}
	}
}
