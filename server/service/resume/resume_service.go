package resume

import (
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strconv"
	"time"

	"server/global"
	"server/model"
	"server/utils"

	"gorm.io/gorm"
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
			FilePath:         resume.FilePath,
			FileSize:         resume.FileSize,
			FileType:         resume.FileType,
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
		FilePath:         resume.FilePath,
		FileSize:         resume.FileSize,
		FileType:         resume.FileType,
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
	// 生成文件名和路径
	filename := utils.GenerateFileName(file.Filename)
	dst := filepath.Join(global.CONFIG.Local.StorePath, "resumes", filename)

	// 保存文件
	if err := utils.UploadFile(file, dst); err != nil {
		return nil, errors.New("文件保存失败")
	}

	// 生成简历编号
	resumeNumber := s.generateResumeNumber(userID)

	// 获取文件类型
	fileType := filepath.Ext(file.Filename)
	if fileType != "" {
		fileType = fileType[1:] // 去掉点号
	}

	// 创建简历记录
	resume := model.ResumeRecord{
		ID:               utils.GenerateTLID(),
		UserID:           userID,
		ResumeNumber:     resumeNumber,
		Version:          1,
		Name:             file.Filename,
		OriginalFilename: file.Filename,
		FilePath:         fmt.Sprintf("/uploads/file/resumes/%s", filename),
		FileSize:         file.Size,
		FileType:         fileType,
		Status:           "active",
	}

	if err := global.DB.Create(&resume).Error; err != nil {
		return nil, errors.New("简历记录创建失败")
	}

	response := &UploadResumeResponse{
		ID:           resume.ID,
		ResumeNumber: resume.ResumeNumber,
		URL:          resume.FilePath,
		Filename:     filename,
		Size:         file.Size,
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
				FilePath:         oldResume.URL,
				FileSize:         oldResume.Size,
				Status:           "active",
				CreatedAt:        oldResume.CreatedAt,
				UpdatedAt:        oldResume.UpdatedAt,
			}

			global.DB.Create(&newResume)
		}
	}

	return nil
}
