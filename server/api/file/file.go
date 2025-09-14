package file

import (
	"server/service/file"
	"server/utils"

	"github.com/gin-gonic/gin"
)

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
	fileType := c.Query("type")

	if fileType == "" {
		utils.FailWithMessage("文件类型参数不能为空", c)
		return
	}

	if err := file.FileService.DeleteFile(fileID, fileType); err != nil {
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

	if err := file.FileService.BatchDeleteFiles(req.FileIDs, req.FileType); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("批量删除成功", c)
}
