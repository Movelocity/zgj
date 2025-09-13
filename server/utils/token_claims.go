package utils

import (
	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims 自定义JWT声明
type CustomClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     int    `json:"role"`
	jwt.RegisteredClaims
}
