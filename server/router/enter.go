package router

import (
	"server/middleware"

	"github.com/gin-gonic/gin"
)

// InitRoutes 初始化所有路由
func InitRoutes(r *gin.Engine) {
	// 公共路由
	PublicGroup := r.Group("")

	// 私有路由（需要认证）
	PrivateGroup := r.Group("")
	PrivateGroup.Use(middleware.JWTAuth())

	// 管理员路由
	AdminGroup := r.Group("")
	AdminGroup.Use(middleware.JWTAuth(), middleware.AdminAuth())

	// 初始化各个实体的路由
	InitUserRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitWorkflowRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitConversationRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitChatMessageRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitResumeRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitFileRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitSystemRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitInvitationRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitSiteVariableRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitEventLogRouter(AdminGroup)
	InitBillingRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitTOSRouter(PrivateGroup, PublicGroup, AdminGroup)
	InitASRRouter(PrivateGroup, PublicGroup, AdminGroup)
}
