package tos

import (
	"server/global"
	"server/model"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetSTSCredentials 获取STS临时凭证
func GetSTSCredentials(c *gin.Context) {
	// 检查TOS服务是否可用
	if global.TOSService == nil {
		utils.FailWithMessage("TOS服务未启用", c)
		return
	}

	// 获取STS凭证
	credentials, err := global.TOSService.GetSTSCredentials(c.Request.Context())
	if err != nil {
		utils.FailWithMessage("获取STS凭证失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(credentials, c)
}

// GeneratePresignURL 生成上传预签名URL
func GeneratePresignURL(c *gin.Context) {
	// 检查TOS服务是否可用
	if global.TOSService == nil {
		utils.FailWithMessage("TOS服务未启用", c)
		return
	}

	var req global.TOSPresignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 验证必填参数
	if req.Key == "" {
		utils.FailWithMessage("文件key不能为空", c)
		return
	}

	// 生成预签名URL
	response, err := global.TOSService.GeneratePresignedURL(c.Request.Context(), &req)
	if err != nil {
		utils.FailWithMessage("生成预签名URL失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// GenerateDownloadURL 生成下载预签名URL
func GenerateDownloadURL(c *gin.Context) {
	// 检查TOS服务是否可用
	if global.TOSService == nil {
		utils.FailWithMessage("TOS服务未启用", c)
		return
	}

	key := c.Query("key")
	if key == "" {
		utils.FailWithMessage("文件key不能为空", c)
		return
	}

	// 生成下载URL
	response, err := global.TOSService.GenerateDownloadURL(c.Request.Context(), key)
	if err != nil {
		utils.FailWithMessage("生成下载URL失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// RecordUploadComplete 上传完成回调
func RecordUploadComplete(c *gin.Context) {
	// 检查TOS服务是否可用
	if global.TOSService == nil {
		utils.FailWithMessage("TOS服务未启用", c)
		return
	}

	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	var req struct {
		Key         string `json:"key" binding:"required"`
		Filename    string `json:"filename" binding:"required"`
		ContentType string `json:"content_type"`
		Size        int64  `json:"size"`
		Metadata    string `json:"metadata"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 创建上传记录
	upload := &model.TOSUpload{
		UserID:      userID,
		Key:         req.Key,
		Filename:    req.Filename,
		ContentType: req.ContentType,
		Size:        req.Size,
		Status:      "success",
		Metadata:    req.Metadata,
	}

	// 记录到数据库
	if err := global.TOSService.RecordUpload(c.Request.Context(), upload); err != nil {
		utils.FailWithMessage("记录上传失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(upload, c)
}

// ListUploads 获取上传记录列表
func ListUploads(c *gin.Context) {
	// 检查TOS服务是否可用
	if global.TOSService == nil {
		utils.FailWithMessage("TOS服务未启用", c)
		return
	}

	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	// 查询上传记录
	response, err := global.TOSService.ListUploads(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		utils.FailWithMessage("查询上传记录失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}
