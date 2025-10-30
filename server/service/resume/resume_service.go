package resume

import (
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
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

// get all resumes without specifying user
func (s *resumeService) GetResumes(page, pageSize string) ([]ResumeInfo, int64, error) {
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

	if err := global.DB.Where("status = ?", "active").
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
// 返回新简历ID（如果创建了新版本）和错误信息
func (s *resumeService) UpdateResume(userID, resumeID string, req UpdateResumeRequest) (*string, error) {
	// 检查简历是否存在且属于用户
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ? AND status = ?", resumeID, userID, "active").First(&resume).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("简历不存在")
		}
		return nil, errors.New("查询简历失败")
	}

	// 如果启用 new_version，创建新版本而不是覆盖原简历
	if req.NewVersion {
		newResumeID, err := s.createNewResumeVersion(userID, &resume, req)
		if err != nil {
			return nil, err
		}
		return &newResumeID, nil
	}

	// 常规更新逻辑：更新现有简历
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
			return nil, errors.New("结构化数据格式错误")
		}
		updates["structured_data"] = model.JSON(dataJSON)
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := global.DB.Model(&resume).Updates(updates).Error; err != nil {
			return nil, errors.New("更新简历失败")
		}
	}

	return nil, nil
}

// createNewResumeVersion 创建简历的新版本
// 参考 ReorganizeResumeVersions 逻辑，按 resume_number 管理版本号
// 返回新创建的简历ID
func (s *resumeService) createNewResumeVersion(userID string, originalResume *model.ResumeRecord, req UpdateResumeRequest) (string, error) {
	// 查询该 resume_number 下的最大版本号
	var maxVersion int
	if err := global.DB.Model(&model.ResumeRecord{}).
		Where("user_id = ? AND resume_number = ? AND status = ?", userID, originalResume.ResumeNumber, "active").
		Select("COALESCE(MAX(version), 0)").
		Scan(&maxVersion).Error; err != nil {
		return "", errors.New("查询最大版本号失败")
	}

	// 创建新版本简历记录，复制原简历的所有字段
	newResume := model.ResumeRecord{
		ID:               utils.GenerateTLID(),
		UserID:           userID,
		ResumeNumber:     originalResume.ResumeNumber, // 复用相同的简历编号
		Version:          maxVersion + 1,              // 版本号递增
		Name:             originalResume.Name,
		OriginalFilename: originalResume.OriginalFilename,
		FileID:           originalResume.FileID,
		TextContent:      originalResume.TextContent,
		StructuredData:   originalResume.StructuredData,
		PortraitImg:      originalResume.PortraitImg,
		Status:           "active",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// 应用请求中的更新内容
	if req.Name != "" {
		newResume.Name = req.Name
	}
	if req.TextContent != "" {
		newResume.TextContent = req.TextContent
	}
	if req.StructuredData != nil {
		dataJSON, err := json.Marshal(req.StructuredData)
		if err != nil {
			return "", errors.New("结构化数据格式错误")
		}
		newResume.StructuredData = model.JSON(dataJSON)
	}

	// 保存新版本简历
	if err := global.DB.Create(&newResume).Error; err != nil {
		return "", errors.New("创建新版本简历失败")
	}

	return newResume.ID, nil
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
	// 使用统一文件服务上传文件（支持哈希去重）
	uploadedFile, err := fileService.FileService.UploadFile(userID, file, true)
	if err != nil {
		return nil, err
	}

	// 检查是否存在相同文件ID的简历记录（同一个用户上传相同文件）
	var existingResume model.ResumeRecord
	var resumeNumber string
	var version int

	err = global.DB.Where("user_id = ? AND file_id = ? AND status = ?", userID, uploadedFile.ID, "active").
		Order("version DESC").
		First(&existingResume).Error

	if err == nil {
		// 找到相同文件的简历记录，复用简历号，版本号+1
		resumeNumber = existingResume.ResumeNumber
		version = existingResume.Version + 1
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		// 没有找到相同文件的简历，生成新的简历编号
		resumeNumber = s.generateResumeNumber(userID)
		version = 1
	} else {
		// 数据库查询错误
		return nil, errors.New("查询简历记录失败")
	}

	// 创建新的简历记录
	// 注意：text_content 和 structured_data 不进行复用，保持为空或默认值
	resume := model.ResumeRecord{
		ID:               utils.GenerateTLID(),
		UserID:           userID,
		ResumeNumber:     resumeNumber,
		Version:          version,
		Name:             file.Filename,
		OriginalFilename: file.Filename,
		FileID:           &uploadedFile.ID, // 使用文件ID
		TextContent:      "",               // 不复用旧的text_content
		StructuredData:   nil,              // 不复用旧的structured_data
		Status:           "active",
	}

	if err := global.DB.Create(&resume).Error; err != nil {
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
	if userID == "" {
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
	} else {
		return s.GetResumes(page, pageSize)
	}
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

// ReorganizeResumeVersions 重新整理简历版本
// 按文件哈希识别相同简历，按时间重新分配版本号
func (s *resumeService) ReorganizeResumeVersions() (*ReorganizeResult, error) {
	// 统计信息
	result := &ReorganizeResult{
		ProcessedUsers:   0,
		ProcessedResumes: 0,
		UpdatedVersions:  0,
		Errors:           []string{},
	}

	// 获取所有活跃用户
	var users []model.User
	if err := global.DB.Find(&users).Error; err != nil {
		return nil, errors.New("查询用户列表失败: " + err.Error())
	}

	// 遍历每个用户
	for _, user := range users {
		if err := s.reorganizeUserResumes(user.ID, result); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("用户 %s: %s", user.ID, err.Error()))
			continue
		}
		result.ProcessedUsers++
	}

	return result, nil
}

// reorganizeUserResumes 重新整理单个用户的简历版本
func (s *resumeService) reorganizeUserResumes(userID string, result *ReorganizeResult) error {
	// 查询用户的所有活跃简历记录
	var resumes []model.ResumeRecord
	if err := global.DB.Preload("File").
		Where("user_id = ? AND status = ?", userID, "active").
		Order("created_at ASC").
		Find(&resumes).Error; err != nil {
		return errors.New("查询简历记录失败")
	}

	if len(resumes) == 0 {
		return nil // 用户没有简历，跳过
	}

	// 按文件哈希分组
	// key: file hash, value: []ResumeRecord
	hashGroups := make(map[string][]model.ResumeRecord)

	// 处理有文件的简历
	for _, resume := range resumes {
		if resume.FileID == nil {
			// 纯文本简历，单独处理
			hashGroups["text_"+resume.ID] = []model.ResumeRecord{resume}
			continue
		}

		// 获取文件的哈希值
		var file model.File
		if err := global.DB.Where("id = ?", *resume.FileID).First(&file).Error; err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("简历 %s: 无法查询文件 %s", resume.ID, *resume.FileID))
			continue
		}

		// 如果文件没有哈希值，自动计算并保存
		if file.Hash == "" {
			// 获取文件物理路径
			filePath := file.GetStoragePath()
			fullPath := global.CONFIG.Local.StorePath + "/" + filePath

			// 检查文件是否存在
			if _, err := os.Stat(fullPath); os.IsNotExist(err) {
				result.Errors = append(result.Errors, fmt.Sprintf("简历 %s: 文件 %s 不存在于路径 %s", resume.ID, file.ID, fullPath))
				continue
			}

			// 计算哈希值
			hash, err := utils.CalculateFileHashFromPath(fullPath)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("简历 %s: 计算文件 %s 哈希失败: %v", resume.ID, file.ID, err))
				continue
			}

			// 更新数据库
			if err := global.DB.Model(&model.File{}).Where("id = ?", file.ID).Update("hash", hash).Error; err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("简历 %s: 更新文件 %s 哈希值失败: %v", resume.ID, file.ID, err))
				continue
			}

			// 更新内存中的file对象
			file.Hash = hash
		}

		// 按哈希分组
		hashGroups[file.Hash] = append(hashGroups[file.Hash], resume)
	}

	// 对每个哈希组，按时间重新分配版本号
	for _, group := range hashGroups {
		if len(group) == 0 {
			continue
		}

		// 按创建时间排序（应该已经排序了，但再确保一次）
		// 这里可以用sort包排序，但因为我们已经按created_at查询，所以应该是有序的

		// 检查是否需要更新版本号
		needUpdate := false
		for i, resume := range group {
			expectedVersion := i + 1
			if resume.Version != expectedVersion {
				needUpdate = true
				break
			}
		}

		if !needUpdate {
			result.ProcessedResumes += len(group)
			continue // 版本号已经正确，跳过
		}

		// 更新版本号
		for i, resume := range group {
			newVersion := i + 1
			if resume.Version != newVersion {
				if err := global.DB.Model(&model.ResumeRecord{}).
					Where("id = ?", resume.ID).
					Update("version", newVersion).Error; err != nil {
					result.Errors = append(result.Errors, fmt.Sprintf("更新简历 %s 版本号失败: %s", resume.ID, err.Error()))
					continue
				}
				result.UpdatedVersions++
			}
			result.ProcessedResumes++
		}

		// 对于有多个版本的简历，确保它们共享相同的resume_number
		if len(group) > 1 {
			// 使用第一个（最早的）简历的resume_number
			baseResumeNumber := group[0].ResumeNumber

			for i := 1; i < len(group); i++ {
				if group[i].ResumeNumber != baseResumeNumber {
					if err := global.DB.Model(&model.ResumeRecord{}).
						Where("id = ?", group[i].ID).
						Update("resume_number", baseResumeNumber).Error; err != nil {
						result.Errors = append(result.Errors, fmt.Sprintf("更新简历 %s 编号失败: %s", group[i].ID, err.Error()))
					}
				}
			}
		}
	}

	return nil
}
