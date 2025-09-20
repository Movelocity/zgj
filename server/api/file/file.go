package file

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"

	"server/service/file"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// UploadFile 上传文件（新的统一接口）
func UploadFile(c *gin.Context) {
	// 获取上传的文件
	fileHeader, err := c.FormFile("file")
	if err != nil {
		utils.FailWithMessage("文件上传失败", c)
		return
	}

	// 获取用户ID
	userID := ""
	// 尝试从JWT token中获取用户ID
	if tokenUserID := c.GetString("userID"); tokenUserID != "" {
		userID = tokenUserID
		fmt.Println("userID", userID)
	} else {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 调用服务层上传文件
	response, err := file.FileService.UploadFile(userID, fileHeader, false)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// PreviewFile 预览/下载文件
func PreviewFile(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.FailWithMessage("文件ID不能为空", c)
		return
	}

	// 获取文件信息
	fileInfo, err := file.FileService.GetFileByID(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		return
	}

	// 获取物理文件路径
	physicalPath := file.FileService.GetFilePhysicalPath(fileInfo)

	// 检查文件是否存在
	if _, err := os.Stat(physicalPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		return
	}

	// 打开文件
	fileHandle, err := os.Open(physicalPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取文件"})
		return
	}
	defer fileHandle.Close()

	// 设置响应头
	c.Header("Content-Type", fileInfo.MimeType)
	c.Header("Content-Length", strconv.FormatInt(fileInfo.Size, 10))
	c.Header("Cache-Control", "public, max-age=3600")

	// 检查是否需要作为附件下载
	asAttachment := c.Query("as_attachment")
	if asAttachment == "true" {
		// 设置下载文件名，使用UTF-8编码
		filename := fileInfo.OriginalName
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename*=UTF-8''%s", filename))
	}

	// 流式传输文件内容
	io.Copy(c.Writer, fileHandle)
}

// GetFileStats 获取文件统计信息（管理员）
func GetFileStats(c *gin.Context) {
	stats, err := file.FileService.GetFileStats()
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(stats, c)
}

// GetFileList 获取文件列表（管理员）
func GetFileList(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "20")
	fileType := c.DefaultQuery("type", "")

	files, err := file.FileService.GetFileList(page, pageSize, fileType)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(files, c)
}

// DeleteFile 删除文件（管理员）
func DeleteFile(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.FailWithMessage("文件ID不能为空", c)
		return
	}

	if err := file.FileService.DeleteFile(fileID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("文件删除成功", c)
}

// BatchDeleteFiles 批量删除文件（管理员）
func BatchDeleteFiles(c *gin.Context) {
	var req file.BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	if err := file.FileService.BatchDeleteFiles(req.FileIDs); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("批量删除成功", c)
}

// MigrateFiles 迁移旧文件数据（管理员功能）
func MigrateFiles(c *gin.Context) {
	if err := file.FileService.MigrateOldFiles(); err != nil {
		utils.FailWithMessage("文件数据迁移失败: "+err.Error(), c)
		return
	}

	utils.OkWithMessage("文件数据迁移成功", c)
}

// GetFileInfo 获取文件信息
func GetFileInfo(c *gin.Context) {
	fileID := c.Param("id")
	if fileID == "" {
		utils.FailWithMessage("文件ID不能为空", c)
		return
	}

	fileInfo, err := file.FileService.GetFileByID(fileID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 构造响应数据
	response := gin.H{
		"id":           fileInfo.ID,
		"name":         fileInfo.OriginalName,
		"size":         fileInfo.Size,
		"extension":    fileInfo.Extension,
		"mime_type":    fileInfo.MimeType,
		"created_by":   fileInfo.CreatedBy,
		"created_at":   fileInfo.CreatedAt.Unix(),
		"preview_url":  fmt.Sprintf("/files/%s/preview", fileInfo.ID),
		"download_url": fmt.Sprintf("/files/%s/preview?as_attachment=true", fileInfo.ID),
	}

	utils.OkWithData(response, c)
}
