package middleware

import (
	"server/global"

	"github.com/gin-gonic/gin"
)

// CORS 跨域中间件
func CORS() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		corsConfig := global.CONFIG.CORS

		if len(corsConfig.Whitelist) > 0 {
			// 使用白名单模式
			origin := c.Request.Header.Get("Origin")
			for _, w := range corsConfig.Whitelist {
				if w.AllowOrigin == origin || w.AllowOrigin == "*" {
					c.Header("Access-Control-Allow-Origin", w.AllowOrigin)
					c.Header("Access-Control-Allow-Methods", w.AllowMethods)
					c.Header("Access-Control-Allow-Headers", w.AllowHeaders)
					c.Header("Access-Control-Expose-Headers", w.ExposeHeaders)
					if w.AllowCredentials {
						c.Header("Access-Control-Allow-Credentials", "true")
					}
					break
				}
			}
		}

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})
}
