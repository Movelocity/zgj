package router

import (
	"server/api/asr"

	"github.com/gin-gonic/gin"
)

// InitASRRouter 初始化ASR相关路由
func InitASRRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 私有路由 - 需要认证的ASR操作
	if privateGroup != nil {
		ASRRouter := privateGroup.Group("/api/asr")
		{
			ASRRouter.POST("/tasks", asr.SubmitTask)          // 提交识别任务
			ASRRouter.GET("/tasks/:id", asr.GetTask)          // 查询任务详情
			ASRRouter.POST("/tasks/:id/poll", asr.PollTask)   // 轮询任务结果
			ASRRouter.GET("/tasks", asr.ListTasks)            // 获取任务列表
			ASRRouter.DELETE("/tasks/:id", asr.DeleteTask)    // 删除任务
			ASRRouter.POST("/tasks/:id/retry", asr.RetryTask) // 重试任务
		}
	}
}
