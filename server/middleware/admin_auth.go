package middleware

import (
	"server/utils"

	"github.com/gin-gonic/gin"
)

// AdminAuth 管理员权限验证中间件
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			utils.FailWithUnauthorized("用户信息获取失败", c)
			c.Abort()
			return
		}

		role, ok := userRole.(int)
		if !ok || role != 888 { // 888表示管理员
			utils.FailWithForbidden("权限不足", c)
			c.Abort()
			return
		}

		c.Next()
	}
}
