package resume

import (
	"strconv"

	"server/service/resume"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// GetUserResumes 获取用户简历列表
func GetUserResumes(c *gin.Context) {
	userID := c.GetString("userID")
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	resumes, total, err := resume.ResumeService.GetUserResumes(userID, page, pageSize)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	response := resume.ResumeListResponse{
		List:     resumes,
		Total:    total,
		Page:     pageInt,
		PageSize: pageSizeInt,
	}

	utils.OkWithData(response, c)
}

// GetResumeByID 获取特定简历详情
func GetResumeByID(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	resumeDetail, err := resume.ResumeService.GetResumeByID(userID, resumeID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(resumeDetail, c)
}

// UpdateResume 更新简历信息
func UpdateResume(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	var req resume.UpdateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	if err := resume.ResumeService.UpdateResume(userID, resumeID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("简历更新成功", c)
}

// DeleteResume 删除简历
func DeleteResume(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	if err := resume.ResumeService.DeleteResume(userID, resumeID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("简历删除成功", c)
}

// UploadResume 上传简历（新版本，使用独立表）
func UploadResume(c *gin.Context) {
	userID := c.GetString("userID")

	file, err := c.FormFile("file")
	if err != nil {
		utils.FailWithMessage("文件上传失败", c)
		return
	}

	response, err := resume.ResumeService.UploadResume(userID, file)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

func ResumeFileToText(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	if err := resume.ResumeService.ResumeFileToText(userID, resumeID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("文本提取成功", c)
}

func StructureTextToJSON(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	if err := resume.ResumeService.StructureTextToJSON(userID, resumeID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}
}

// CreateTextResume 创建纯文本简历
func CreateTextResume(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		Name        string `json:"name" binding:"required"`
		TextContent string `json:"text_content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	response, err := resume.ResumeService.CreateTextResume(userID, req.Name, req.TextContent)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// GetAdminUserResumes 管理员查看用户简历
func GetAdminUserResumes(c *gin.Context) {
	userID := c.Param("id")
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	resumes, total, err := resume.ResumeService.GetAdminUserResumes(userID, page, pageSize)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	response := resume.ResumeListResponse{
		List:     resumes,
		Total:    total,
		Page:     pageInt,
		PageSize: pageSizeInt,
	}

	utils.OkWithData(response, c)
}

// MigrateResumeData 迁移简历数据（管理员功能）
func MigrateResumeData(c *gin.Context) {
	if err := resume.ResumeService.MigrateOldResumeData(); err != nil {
		utils.FailWithMessage("数据迁移失败: "+err.Error(), c)
		return
	}

	utils.OkWithMessage("简历数据迁移成功", c)
}
