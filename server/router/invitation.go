package router

import (
	"server/api/invitation"

	"github.com/gin-gonic/gin"
)

// InitInvitationRouter 初始化邀请码相关路由
func InitInvitationRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 公共路由 - 验证邀请码
	InvitationPublicRouter := publicGroup.Group("/api/invitations")
	{
		InvitationPublicRouter.POST("/validate", invitation.ValidateInvitation) // 验证邀请码
		InvitationPublicRouter.POST("/use", invitation.UseInvitation)           // 使用邀请码
	}

	// 私有路由 - 需要认证的用户操作
	InvitationPrivateRouter := privateGroup.Group("/api/invitations")
	{
		InvitationPrivateRouter.POST("", invitation.CreateInvitation) // 创建邀请码
	}

	// 管理员路由 - 邀请码管理
	AdminInvitationRouter := adminGroup.Group("/api/invitations")
	{
		AdminInvitationRouter.GET("", invitation.GetInvitationList)                      // 获取邀请码列表
		AdminInvitationRouter.GET("/:code", invitation.GetInvitationDetail)              // 获取邀请码详情
		AdminInvitationRouter.POST("/:code/deactivate", invitation.DeactivateInvitation) // 禁用邀请码
		AdminInvitationRouter.POST("/:code/activate", invitation.ActivateInvitation)     // 激活邀请码
	}
}
