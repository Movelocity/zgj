package router

import (
	"server/api/sitevariable"

	"github.com/gin-gonic/gin"
)

// InitSiteVariableRouter 初始化网站变量相关路由
func InitSiteVariableRouter(privateGroup *gin.RouterGroup, publicGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	// 管理员路由 - 网站变量的增删查改
	AdminSiteVariableRouter := adminGroup.Group("/api/admin/site-variables")
	{
		AdminSiteVariableRouter.POST("", sitevariable.CreateSiteVariable)       // 创建网站变量
		AdminSiteVariableRouter.PUT("/:id", sitevariable.UpdateSiteVariable)    // 更新网站变量
		AdminSiteVariableRouter.DELETE("/:id", sitevariable.DeleteSiteVariable) // 删除网站变量
		AdminSiteVariableRouter.GET("", sitevariable.GetSiteVariableList)       // 获取网站变量列表
		AdminSiteVariableRouter.GET("/:id", sitevariable.GetSiteVariableByID)   // 通过ID获取网站变量详情
	}

	// 公开路由 - 非管理员通过key查询
	PublicSiteVariableRouter := publicGroup.Group("/api/public/site-variables")
	{
		PublicSiteVariableRouter.GET("/by-key", sitevariable.GetSiteVariableByKey) // 通过key获取网站变量
	}
}
