package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code int         `json:"code"`
	Data interface{} `json:"data"`
	Msg  string      `json:"msg"`
}

const (
	SUCCESS      = 0
	ERROR        = 500
	UNAUTHORIZED = 401
	FORBIDDEN    = 403
	NOT_FOUND    = 404
)

// Result 统一返回结果
func Result(code int, data interface{}, msg string, c *gin.Context) {
	// 根据业务码确定HTTP状态码
	var httpStatus int
	switch code {
	case SUCCESS:
		httpStatus = http.StatusOK
	case UNAUTHORIZED:
		httpStatus = http.StatusUnauthorized
	case FORBIDDEN:
		httpStatus = http.StatusForbidden
	case NOT_FOUND:
		httpStatus = http.StatusNotFound
	case ERROR:
		httpStatus = http.StatusInternalServerError
	default:
		httpStatus = http.StatusOK
	}

	c.JSON(httpStatus, Response{
		Code: code,
		Data: data,
		Msg:  msg,
	})
}

// Ok 成功返回
func Ok(c *gin.Context) {
	Result(SUCCESS, map[string]interface{}{}, "操作成功", c)
}

// OkWithMessage 成功返回带消息
func OkWithMessage(message string, c *gin.Context) {
	Result(SUCCESS, map[string]interface{}{}, message, c)
}

// OkWithData 成功返回带数据
func OkWithData(data interface{}, c *gin.Context) {
	Result(SUCCESS, data, "查询成功", c)
}

// OkWithDetailed 成功返回详细信息
func OkWithDetailed(data interface{}, message string, c *gin.Context) {
	Result(SUCCESS, data, message, c)
}

// Fail 失败返回
func Fail(c *gin.Context) {
	Result(ERROR, map[string]interface{}{}, "操作失败", c)
}

// FailWithMessage 失败返回带消息
func FailWithMessage(message string, c *gin.Context) {
	Result(ERROR, map[string]interface{}{}, message, c)
}

// FailWithDetailed 失败返回详细信息
func FailWithDetailed(data interface{}, message string, c *gin.Context) {
	Result(ERROR, data, message, c)
}

// FailWithUnauthorized 未授权返回
func FailWithUnauthorized(message string, c *gin.Context) {
	Result(UNAUTHORIZED, map[string]interface{}{}, message, c)
}

// FailWithForbidden 禁止访问返回
func FailWithForbidden(message string, c *gin.Context) {
	Result(FORBIDDEN, map[string]interface{}{}, message, c)
}

// FailWithNotFound 未找到返回
func FailWithNotFound(message string, c *gin.Context) {
	Result(NOT_FOUND, map[string]interface{}{}, message, c)
}
