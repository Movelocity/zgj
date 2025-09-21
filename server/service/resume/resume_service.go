package resume

import (
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"server/global"
	"server/model"
	appService "server/service/app"
	fileService "server/service/file"
	"server/utils"
)

type resumeService struct{}

var ResumeService = &resumeService{}

// GetUserResumes 获取用户简历列表（分页）
func (s *resumeService) GetUserResumes(userID string, page, pageSize string) ([]ResumeInfo, int64, error) {
	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	if pageInt <= 0 {
		pageInt = 1
	}
	if pageSizeInt <= 0 || pageSizeInt > 100 {
		pageSizeInt = 10
	}

	offset := (pageInt - 1) * pageSizeInt

	var resumes []model.ResumeRecord
	var total int64

	// 查询总数
	if err := global.DB.Model(&model.ResumeRecord{}).Where("user_id = ? AND status = ?", userID, "active").Count(&total).Error; err != nil {
		return nil, 0, errors.New("查询简历总数失败")
	}

	// 分页查询
	if err := global.DB.Where("user_id = ? AND status = ?", userID, "active").
		Order("created_at DESC").
		Limit(pageSizeInt).
		Offset(offset).
		Find(&resumes).Error; err != nil {
		return nil, 0, errors.New("查询简历列表失败")
	}

	var resumeInfos []ResumeInfo
	for _, resume := range resumes {
		resumeInfo := ResumeInfo{
			ID:               resume.ID,
			ResumeNumber:     resume.ResumeNumber,
			Version:          resume.Version,
			Name:             resume.Name,
			OriginalFilename: resume.OriginalFilename,
			FileID:           resume.FileID,
			Status:           resume.Status,
			CreatedAt:        resume.CreatedAt,
			UpdatedAt:        resume.UpdatedAt,
		}
		resumeInfos = append(resumeInfos, resumeInfo)
	}

	return resumeInfos, total, nil
}

// GetResumeByID 获取特定简历详情
func (s *resumeService) GetResumeByID(userID, resumeID string) (*ResumeDetailInfo, error) {
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ? AND status = ?", resumeID, userID, "active").First(&resume).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("简历不存在")
		}
		return nil, errors.New("查询简历失败")
	}

	// 解析结构化数据
	var structuredData interface{}
	if len(resume.StructuredData) > 0 {
		json.Unmarshal(resume.StructuredData, &structuredData)
	}

	resumeDetail := &ResumeDetailInfo{
		ID:               resume.ID,
		ResumeNumber:     resume.ResumeNumber,
		Version:          resume.Version,
		Name:             resume.Name,
		OriginalFilename: resume.OriginalFilename,
		FileID:           resume.FileID,
		TextContent:      resume.TextContent,
		StructuredData:   structuredData,
		Status:           resume.Status,
		CreatedAt:        resume.CreatedAt,
		UpdatedAt:        resume.UpdatedAt,
	}

	return resumeDetail, nil
}

// UpdateResume 更新简历信息（重命名等）
func (s *resumeService) UpdateResume(userID, resumeID string, req UpdateResumeRequest) error {
	// 检查简历是否存在且属于用户
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ? AND status = ?", resumeID, userID, "active").First(&resume).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("简历不存在")
		}
		return errors.New("查询简历失败")
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.TextContent != "" {
		updates["text_content"] = req.TextContent
	}
	if req.StructuredData != nil {
		dataJSON, err := json.Marshal(req.StructuredData)
		if err != nil {
			return errors.New("结构化数据格式错误")
		}
		updates["structured_data"] = model.JSON(dataJSON)
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := global.DB.Model(&resume).Updates(updates).Error; err != nil {
			return errors.New("更新简历失败")
		}
	}

	return nil
}

// DeleteResume 删除简历（软删除）
func (s *resumeService) DeleteResume(userID, resumeID string) error {
	// 检查简历是否存在且属于用户
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ? AND status = ?", resumeID, userID, "active").First(&resume).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("简历不存在")
		}
		return errors.New("查询简历失败")
	}

	// 软删除
	if err := global.DB.Model(&resume).Updates(map[string]interface{}{
		"status":     "deleted",
		"updated_at": time.Now(),
	}).Error; err != nil {
		return errors.New("删除简历失败")
	}

	return nil
}

// UploadResume 上传简历到新的简历表
func (s *resumeService) UploadResume(userID string, file *multipart.FileHeader) (*UploadResumeResponse, error) {
	// 使用统一文件服务上传文件
	uploadedFile, err := fileService.FileService.UploadFile(userID, file, true)
	if err != nil {
		return nil, err
	}

	// 生成简历编号
	resumeNumber := s.generateResumeNumber(userID)

	// 创建简历记录
	resume := model.ResumeRecord{
		ID:               utils.GenerateTLID(),
		UserID:           userID,
		ResumeNumber:     resumeNumber,
		Version:          1,
		Name:             file.Filename,
		OriginalFilename: file.Filename,
		FileID:           &uploadedFile.ID, // 使用文件ID而不是路径
		Status:           "active",
	}

	if err := global.DB.Create(&resume).Error; err != nil {
		// 如果创建简历记录失败，删除已上传的文件
		fileService.FileService.DeleteFile(uploadedFile.ID)
		return nil, errors.New("简历记录创建失败")
	}

	response := &UploadResumeResponse{
		ID:           resume.ID,
		ResumeNumber: resume.ResumeNumber,
		URL:          fmt.Sprintf("/api/files/%s/preview", uploadedFile.ID), // 使用文件预览API
		Filename:     uploadedFile.Name,
		Size:         file.Size,
	}

	return response, nil
}

func removeThinkTags(input string) string {
	// (?s) 表示 . 匹配包括换行符在内的所有字符
	re := regexp.MustCompile(`(?s)<think>.*?</think>`)
	return re.ReplaceAllString(input, "")
}

func (s *resumeService) ResumeFileToText(userId string, resumeId string) error {
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ?", resumeId).First(&resume).Error; err != nil {
		return errors.New("查询简历失败")
	}

	if resume.FileID == nil {
		return errors.New("简历没有文件")
	}

	file := model.File{}
	if err := global.DB.Where("id = ?", *resume.FileID).First(&file).Error; err != nil {
		return errors.New("查询文件失败")
	}
	difyFileId := file.DifyID

	workflow := model.Workflow{}
	if err := global.DB.Where("name = ?", "doc_extract").First(&workflow).Error; err != nil {
		return errors.New("查询工作流失败")
	}

	// doc_file is a list of map[string]any, how to fix?
	fileInput := map[string]any{
		"doc_file": map[string]any{
			"transfer_method": "local_file",
			"upload_file_id":  difyFileId,
			"type":            "document",
		},
	}

	// 使用新的ExecuteWorkflowAPI方法，自动处理日志记录
	response, err := appService.AppService.ExecuteWorkflowAPI(workflow.ID, resume.UserID, fileInput)
	if err != nil {
		fmt.Println("[err] ", err)
		return errors.New("工作流执行失败: " + err.Error())
	}
	if !response.Success {
		fmt.Println("[response error] ", response.Message)
		return errors.New(response.Message)
	}

	// 从响应中提取输出
	outputs, ok := response.Data["outputs"].(map[string]interface{})
	if !ok {
		return errors.New("响应格式错误")
	}

	resume.TextContent = outputs["output"].(string)
	resume.TextContent = removeThinkTags(resume.TextContent)
	if err := global.DB.Model(&model.ResumeRecord{}).Where("id = ?", resume.ID).Updates(&resume).Error; err != nil {
		return errors.New("更新简历表格失败")
	}

	return nil
}

// 从字符串中提取可能的完整JSON子串
func extractCompleteJSON(s string) string {
	// 查找第一个 '{' 或 '['
	start := strings.IndexAny(s, "{[")
	if start == -1 {
		return ""
	}

	// 从可能的开始位置向后扫描
	for end := len(s); end > start; end-- {
		candidate := s[start:end]
		if json.Valid([]byte(candidate)) {
			return candidate
		}
	}

	return ""
}

func (s *resumeService) StructureTextToJSON(userId string, resumeId string) error {
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ?", resumeId).First(&resume).Error; err != nil {
		return errors.New("查询简历失败")
	}

	if resume.TextContent == "" {
		return errors.New("简历内容不能为空")
	}

	workflow := model.Workflow{}
	if err := global.DB.Where("name = ?", "resume_structure").First(&workflow).Error; err != nil {
		return errors.New("查询工作流失败")
	}

	input := map[string]any{
		"text_content": resume.TextContent,
	}

	// 使用新的ExecuteWorkflowAPI方法，自动处理日志记录
	response, err := appService.AppService.ExecuteWorkflowAPI(workflow.ID, resume.UserID, input)
	if err != nil {
		return errors.New("工作流执行失败: " + err.Error())
	}
	if !response.Success {
		return errors.New(response.Message)
	}

	// 从响应中提取输出
	outputs, ok := response.Data["outputs"].(map[string]interface{})
	if !ok {
		return errors.New("响应格式错误")
	}

	completeJSON := extractCompleteJSON(outputs["output"].(string))
	resume.StructuredData = model.JSON(completeJSON)
	if err := global.DB.Model(&model.ResumeRecord{}).Where("id = ?", resume.ID).Updates(&resume).Error; err != nil {
		return errors.New("更新简历结构化数据失败")
	}

	return nil
}

// CreateTextResume 创建纯文本简历
func (s *resumeService) CreateTextResume(userID, name, textContent string) (*UploadResumeResponse, error) {
	if name == "" {
		return nil, errors.New("简历名称不能为空")
	}
	if textContent == "" {
		return nil, errors.New("简历内容不能为空")
	}

	// 生成简历编号
	resumeNumber := s.generateResumeNumber(userID)

	// 创建简历记录（无文件）
	resume := model.ResumeRecord{
		ID:           utils.GenerateTLID(),
		UserID:       userID,
		ResumeNumber: resumeNumber,
		Version:      1,
		Name:         name,
		FileID:       nil, // 纯文本简历，无文件
		TextContent:  textContent,
		Status:       "active",
	}

	if err := global.DB.Create(&resume).Error; err != nil {
		return nil, errors.New("简历记录创建失败")
	}

	response := &UploadResumeResponse{
		ID:           resume.ID,
		ResumeNumber: resume.ResumeNumber,
		URL:          "", // 纯文本简历无URL
		Filename:     name,
		Size:         int64(len(textContent)),
	}

	return response, nil
}

// generateResumeNumber 生成简历编号
func (s *resumeService) generateResumeNumber(userID string) string {
	var count int64
	global.DB.Model(&model.ResumeRecord{}).Where("user_id = ?", userID).Count(&count)

	// 使用用户ID后6位 + 序号
	userSuffix := userID
	if len(userID) > 6 {
		userSuffix = userID[len(userID)-6:]
	}

	return fmt.Sprintf("R%s%03d", userSuffix, count+1)
}

// GetAdminUserResumes 管理员查看用户简历
func (s *resumeService) GetAdminUserResumes(userID string, page, pageSize string) ([]ResumeInfo, int64, error) {
	// 检查用户是否存在
	var user model.User
	if err := global.DB.First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, errors.New("用户不存在")
		}
		return nil, 0, errors.New("查询用户失败")
	}

	// 复用用户简历查询逻辑
	return s.GetUserResumes(userID, page, pageSize)
}

// MigrateOldResumeData 迁移旧的简历数据
func (s *resumeService) MigrateOldResumeData() error {
	var profiles []model.UserProfile
	if err := global.DB.Find(&profiles).Error; err != nil {
		return err
	}

	for _, profile := range profiles {
		var oldResumes []model.Resume
		if len(profile.Resumes) > 0 {
			json.Unmarshal(profile.Resumes, &oldResumes)
		}

		for i, oldResume := range oldResumes {
			// 检查是否已经迁移过
			var existingResume model.ResumeRecord
			if err := global.DB.Where("user_id = ? AND original_filename = ?", profile.UserID, oldResume.Name).First(&existingResume).Error; err == nil {
				continue // 已存在，跳过
			}

			newResume := model.ResumeRecord{
				ID:               utils.GenerateTLID(),
				UserID:           profile.UserID,
				ResumeNumber:     fmt.Sprintf("R%s%03d", profile.UserID[len(profile.UserID)-6:], i+1),
				Version:          1,
				Name:             oldResume.Name,
				OriginalFilename: oldResume.Name,
				FileID:           nil, // 需要先创建文件记录再设置FileID
				Status:           "active",
				CreatedAt:        oldResume.CreatedAt,
				UpdatedAt:        oldResume.UpdatedAt,
			}

			global.DB.Create(&newResume)
		}
	}

	return nil
}
