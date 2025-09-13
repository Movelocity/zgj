package router

import (
	"server/middleware"

	"github.com/gin-gonic/gin"
)

// InitRoutes 初始化所有路由
func InitRoutes(r *gin.Engine) {
	// 公共路由
	PublicGroup := r.Group("")
	InitPublicRouter(PublicGroup)

	// 私有路由（需要认证）
	PrivateGroup := r.Group("")
	PrivateGroup.Use(middleware.JWTAuth())
	InitPrivateRouter(PrivateGroup)

	// 管理员路由
	AdminGroup := r.Group("")
	AdminGroup.Use(middleware.JWTAuth(), middleware.AdminAuth())
	InitAdminRouter(AdminGroup)
}
