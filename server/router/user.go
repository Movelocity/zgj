package router

import (
	"server/api/user"

	"github.com/gin-gonic/gin"
)

// InitUserRouter 初始化用户相关路由
func InitUserRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 公共路由 - 用户认证相关
	UserPublicRouter := publicGroup.Group("/api/user")
	{
		UserPublicRouter.POST("/register", user.Register)            // 用户注册
		UserPublicRouter.POST("/login", user.Login)                  // 用户登录
		UserPublicRouter.POST("/auth", user.UnifiedAuth)             // 统一认证（自动注册+登录）
		UserPublicRouter.POST("/send_sms", user.SendSMS)             // 发送短信验证码
		UserPublicRouter.POST("/verify_sms", user.VerifySMS)         // 验证短信验证码
		UserPublicRouter.POST("/reset_password", user.ResetPassword) // 重置密码
	}

	// 私有路由 - 需要认证的用户操作
	UserPrivateRouter := privateGroup.Group("/api/user")
	{
		UserPrivateRouter.GET("/profile", user.GetUserProfile)      // 获取用户信息
		UserPrivateRouter.PUT("/profile", user.UpdateUserProfile)   // 更新用户信息
		UserPrivateRouter.PUT("/password", user.ChangePassword)     // 修改密码
		UserPrivateRouter.POST("/logout", user.Logout)              // 用户登出
		UserPrivateRouter.POST("/upload_avatar", user.UploadAvatar) // 上传头像
	}

	// 管理员路由 - 用户管理
	AdminUserRouter := adminGroup.Group("/api/admin/user")
	{
		AdminUserRouter.GET("", user.GetAllUsers)                      // 获取所有用户
		AdminUserRouter.GET("/:id", user.GetUserByID)                  // 获取特定用户
		AdminUserRouter.PUT("/:id", user.UpdateUserByAdmin)            // 更新用户信息
		AdminUserRouter.DELETE("/:id", user.DeleteUser)                // 删除用户
		AdminUserRouter.POST("/:id/activate", user.ActivateUser)       // 激活用户
		AdminUserRouter.POST("/:id/deactivate", user.DeactivateUser)   // 停用用户
		AdminUserRouter.PUT("/:id/role", user.UpdateUserRole)          // 更新用户角色权限
		AdminUserRouter.PUT("/:id/password", user.AdminChangePassword) // 管理员修改用户密码
	}
}
