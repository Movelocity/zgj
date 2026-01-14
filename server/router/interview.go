package router

import (
	"server/api/interview"

	"github.com/gin-gonic/gin"
)

// InitInterviewRouter 初始化面试复盘相关路由
func InitInterviewRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 需要认证的面试复盘操作
	if privateGroup != nil {
		interviewRouter := privateGroup.Group("/api/interview")
		{
			interviewRouter.POST("/reviews", interview.CreateReview)          // 创建面试复盘记录
			interviewRouter.GET("/reviews/:id", interview.GetReview)          // 获取记录详情
			interviewRouter.GET("/reviews", interview.ListReviews)            // 获取记录列表
			interviewRouter.POST("/reviews/:id/analyze", interview.TriggerAnalysis) // 触发分析
		}
	}
}
