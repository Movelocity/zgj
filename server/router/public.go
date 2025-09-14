package router

import (
	"server/api/user"

	"github.com/gin-gonic/gin"
)

// InitPublicRouter 初始化公共路由
func InitPublicRouter(Router *gin.RouterGroup) {
	// 用户相关
	UserRouter := Router.Group("/api/user")
	{
		UserRouter.POST("/register", user.Register)            // 用户注册
		UserRouter.POST("/login", user.Login)                  // 用户登录
		UserRouter.POST("/auth", user.UnifiedAuth)             // 统一认证（自动注册+登录）
		UserRouter.POST("/send_sms", user.SendSMS)             // 发送短信验证码
		UserRouter.POST("/verify_sms", user.VerifySMS)         // 验证短信验证码
		UserRouter.POST("/reset_password", user.ResetPassword) // 重置密码
	}
}
