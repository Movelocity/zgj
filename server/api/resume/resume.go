package resume

import (
	"strconv"

	"server/service/resume"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// GetUserResumes 获取用户简历列表
// GET /api/user/resumes
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
// GET /api/user/resumes/:id
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
// PUT /api/user/resumes/:id
// 支持 new_version 参数创建新版本而不是覆盖原简历
func UpdateResume(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	var req resume.UpdateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	newResumeID, err := resume.ResumeService.UpdateResume(userID, resumeID, req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 如果创建了新版本，返回新简历ID
	if newResumeID != nil {
		utils.OkWithData(map[string]interface{}{
			"message":        "简历新版本创建成功",
			"new_resume_id":  *newResumeID,
			"is_new_version": true,
		}, c)
		return
	}

	utils.OkWithMessage("简历更新成功", c)
}

// DeleteResume 删除简历
// DELETE /api/user/resumes/:id
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
// POST /api/user/resumes/upload
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

// POST /api/user/resumes/file_to_text/:id
func ResumeFileToText(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	if err := resume.ResumeService.ResumeFileToText(userID, resumeID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("文本提取成功", c)
}

// POST /api/user/resumes/structure_data/:id
func StructureTextToJSON(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	if err := resume.ResumeService.StructureTextToJSON(userID, resumeID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("文本结构化成功", c)
}

// CreateTextResume 创建纯文本简历
// POST /api/user/resumes/create_text
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
// GET /api/admin/user-resumes?user_id=xx&page=1&page_size=10
func GetAdminUserResumes(c *gin.Context) {
	userID := c.DefaultQuery("user_id", "")
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
// POST /api/admin/migration/resume
func MigrateResumeData(c *gin.Context) {
	if err := resume.ResumeService.MigrateOldResumeData(); err != nil {
		utils.FailWithMessage("数据迁移失败: "+err.Error(), c)
		return
	}

	utils.OkWithMessage("简历数据迁移成功", c)
}

// ReorganizeResumeVersions 重新整理简历版本（管理员功能）
// 按文件哈希识别相同简历，按时间重新分配版本号
// POST /api/admin/migration/reorganize-versions
func ReorganizeResumeVersions(c *gin.Context) {
	result, err := resume.ResumeService.ReorganizeResumeVersions()
	if err != nil {
		utils.FailWithMessage("简历版本整理失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(result, c)
}

// SavePendingContent 保存待处理的AI生成内容
// POST /api/user/resumes/:id/pending
func SavePendingContent(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	var req resume.SavePendingContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	if err := resume.ResumeService.SavePendingContent(userID, resumeID, req.PendingContent); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("待处理内容保存成功", c)
}

// ClearPendingContent 清除待处理内容
// DELETE /api/user/resumes/:id/pending
func ClearPendingContent(c *gin.Context) {
	userID := c.GetString("userID")
	resumeID := c.Param("id")

	if err := resume.ResumeService.ClearPendingContent(userID, resumeID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("待处理内容清除成功", c)
}
