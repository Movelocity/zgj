package initialize

import (
	"net/http"
	"path/filepath"
	"server/global"
	"server/middleware"
	"server/router"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化路由
func InitRouter() *gin.Engine {
	// 设置gin模式
	gin.SetMode(gin.DebugMode)

	// 创建路由
	r := gin.New()

	// 添加中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	// 静态文件服务 - 提供前端打包文件
	staticPath := global.CONFIG.Server.StaticPath
	if staticPath == "" {
		staticPath = "../web/dist" // 默认路径
	}
	r.Static("/assets", filepath.Join(staticPath, "assets"))
	r.Static("/images", filepath.Join(staticPath, "images"))
	r.StaticFile("/favicon.ico", filepath.Join(staticPath, "favicon.ico"))

	// 注册API路由
	router.InitRoutes(r)

	// SPA 回退路由 - 所有非API路由都返回 index.html
	r.NoRoute(func(c *gin.Context) {
		// 如果是API路由，返回404
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}
		// 其他所有路由都返回前端的 index.html (SPA)
		c.File(filepath.Join(staticPath, "index.html"))
	})

	return r
}
