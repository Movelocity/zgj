package interview

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"path/filepath"
	"strings"

	"server/global"
	"server/model"
	"server/service/app"

	"gorm.io/gorm"
)

type interviewService struct{}

var InterviewService = &interviewService{}

// CreateInterviewReview 创建面试复盘记录
// 基于TOS文件信息创建pending状态的记录，不再依赖ASR任务完成
func (s *interviewService) CreateInterviewReview(userID, tosFileKey, audioFilename string) (*model.InterviewReview, error) {
	// 构建metadata - 存储TOS文件信息，ASR后续触发
	metadata := map[string]interface{}{
		"tos_file_key":   tosFileKey,
		"audio_filename": audioFilename,
		"status":         model.InterviewReviewStatusPending,
	}
	metadataJSON, _ := json.Marshal(metadata)

	// 创建记录
	review := &model.InterviewReview{
		UserID:   userID,
		Data:     model.JSON("null"), // 初始为null，分析后填充
		Metadata: model.JSON(metadataJSON),
	}

	if err := global.DB.Create(review).Error; err != nil {
		return nil, errors.New("创建面试复盘记录失败")
	}

	return review, nil
}

// StartASR 启动ASR语音识别任务
// 从metadata读取tos_file_key，生成临时URL，提交ASR任务
func (s *interviewService) StartASR(reviewID int64, userID string) (*model.InterviewReview, error) {
	// 获取记录并验证权限
	review, err := s.GetInterviewReview(reviewID, userID)
	if err != nil {
		return nil, err
	}

	// 解析metadata
	var metadata map[string]interface{}
	if err := json.Unmarshal(review.Metadata, &metadata); err != nil {
		return nil, errors.New("解析元数据失败")
	}

	// 检查状态
	status, _ := metadata["status"].(string)
	if status == model.InterviewReviewStatusTranscribing {
		return nil, errors.New("ASR任务正在进行中")
	}
	if status == model.InterviewReviewStatusAnalyzing || status == model.InterviewReviewStatusCompleted {
		return nil, errors.New("该记录已完成语音识别")
	}

	// 获取TOS文件key
	tosFileKey, ok := metadata["tos_file_key"].(string)
	if !ok || tosFileKey == "" {
		return nil, errors.New("TOS文件信息不存在")
	}

	// 生成临时下载URL
	audioURL, err := s.generateDownloadURL(tosFileKey)
	if err != nil {
		return nil, fmt.Errorf("生成下载URL失败: %w", err)
	}

	// 获取音频格式
	audioFormat := s.getAudioFormat(tosFileKey, metadata)

	// 提交ASR任务
	if global.ASRService == nil {
		return nil, errors.New("ASR服务未启用")
	}

	asrTask, err := global.ASRService.SubmitTask(context.Background(), &global.ASRSubmitTaskRequest{
		UserID:      userID,
		AudioURL:    audioURL,
		AudioFormat: audioFormat,
		Options: map[string]interface{}{
			"enable_itn": true,
			"enable_ddc": true,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("提交ASR任务失败: %w", err)
	}

	// 更新metadata
	metadata["status"] = model.InterviewReviewStatusTranscribing
	metadata["asr_task_id"] = asrTask.ID
	metadataJSON, _ := json.Marshal(metadata)

	if err := global.DB.Model(review).Update("metadata", model.JSON(metadataJSON)).Error; err != nil {
		return nil, errors.New("更新状态失败")
	}

	// 返回更新后的记录
	return s.GetInterviewReview(reviewID, userID)
}

// RetryASR 重试ASR语音识别任务
// 在ASR失败后调用，使用存储的tos_file_key生成新URL重新提交任务
func (s *interviewService) RetryASR(reviewID int64, userID string) (*model.InterviewReview, error) {
	// 获取记录并验证权限
	review, err := s.GetInterviewReview(reviewID, userID)
	if err != nil {
		return nil, err
	}

	// 解析metadata
	var metadata map[string]interface{}
	if err := json.Unmarshal(review.Metadata, &metadata); err != nil {
		return nil, errors.New("解析元数据失败")
	}

	// 检查状态 - 只有failed状态可以重试
	status, _ := metadata["status"].(string)
	if status == model.InterviewReviewStatusTranscribing {
		return nil, errors.New("ASR任务正在进行中")
	}
	if status == model.InterviewReviewStatusAnalyzing {
		return nil, errors.New("分析任务正在进行中")
	}
	// 允许从pending（初次尝试）或failed状态重试

	// 获取TOS文件key
	tosFileKey, ok := metadata["tos_file_key"].(string)
	if !ok || tosFileKey == "" {
		return nil, errors.New("TOS文件信息不存在")
	}

	// 生成新的临时下载URL
	audioURL, err := s.generateDownloadURL(tosFileKey)
	if err != nil {
		return nil, fmt.Errorf("生成下载URL失败: %w", err)
	}

	// 获取音频格式
	audioFormat := s.getAudioFormat(tosFileKey, metadata)

	// 提交新的ASR任务
	if global.ASRService == nil {
		return nil, errors.New("ASR服务未启用")
	}

	asrTask, err := global.ASRService.SubmitTask(context.Background(), &global.ASRSubmitTaskRequest{
		UserID:      userID,
		AudioURL:    audioURL,
		AudioFormat: audioFormat,
		Options: map[string]interface{}{
			"enable_itn": true,
			"enable_ddc": true,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("提交ASR任务失败: %w", err)
	}

	// 更新metadata - 清除旧的错误信息
	metadata["status"] = model.InterviewReviewStatusTranscribing
	metadata["asr_task_id"] = asrTask.ID
	delete(metadata, "error_message")
	metadataJSON, _ := json.Marshal(metadata)

	if err := global.DB.Model(review).Update("metadata", model.JSON(metadataJSON)).Error; err != nil {
		return nil, errors.New("更新状态失败")
	}

	// 返回更新后的记录
	return s.GetInterviewReview(reviewID, userID)
}

// generateDownloadURL 生成TOS临时下载URL
func (s *interviewService) generateDownloadURL(fileKey string) (string, error) {
	if global.TOSService == nil {
		return "", errors.New("TOS服务未启用")
	}

	response, err := global.TOSService.GenerateDownloadURL(context.Background(), fileKey)
	if err != nil {
		return "", err
	}

	return response.URL, nil
}

// getAudioFormat 从文件key或metadata获取音频格式
func (s *interviewService) getAudioFormat(tosFileKey string, metadata map[string]interface{}) string {
	// 尝试从文件名获取
	audioFilename, _ := metadata["audio_filename"].(string)
	if audioFilename != "" {
		ext := strings.ToLower(filepath.Ext(audioFilename))
		switch ext {
		case ".mp3":
			return "mp3"
		case ".wav":
			return "wav"
		case ".ogg":
			return "ogg"
		}
	}

	// 尝试从TOS key获取
	ext := strings.ToLower(filepath.Ext(tosFileKey))
	switch ext {
	case ".mp3":
		return "mp3"
	case ".wav":
		return "wav"
	case ".ogg":
		return "ogg"
	}

	// 默认mp3
	return "mp3"
}

// GetInterviewReview 获取面试复盘记录详情
func (s *interviewService) GetInterviewReview(reviewID int64, userID string) (*model.InterviewReview, error) {
	var review model.InterviewReview
	if err := global.DB.Where("id = ?", reviewID).First(&review).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("面试复盘记录不存在")
		}
		return nil, errors.New("查询面试复盘记录失败")
	}

	// 权限检查：只能查看自己的记录
	if review.UserID != userID {
		return nil, errors.New("无权访问该记录")
	}

	return &review, nil
}

// ListInterviewReviews 获取用户的面试复盘记录列表（分页）
func (s *interviewService) ListInterviewReviews(userID string, page, pageSize int) (*InterviewReviewListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}

	var reviews []model.InterviewReview
	var total int64

	// 查询总数
	if err := global.DB.Model(&model.InterviewReview{}).
		Where("user_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, errors.New("查询记录总数失败")
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := global.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&reviews).Error; err != nil {
		return nil, errors.New("查询记录列表失败")
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &InterviewReviewListResponse{
		List:       reviews,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// UpdateReviewMetadata 更新面试复盘记录元数据
func (s *interviewService) UpdateReviewMetadata(reviewID int64, userID string, updates map[string]interface{}) (*model.InterviewReview, error) {
	// 获取记录并验证权限
	review, err := s.GetInterviewReview(reviewID, userID)
	if err != nil {
		return nil, err
	}

	// 解析现有metadata
	var metadata map[string]interface{}
	if err := json.Unmarshal(review.Metadata, &metadata); err != nil {
		metadata = make(map[string]interface{})
	}

	// 只允许更新指定字段（安全考虑，不允许覆盖status等关键字段）
	allowedFields := map[string]bool{
		"job_position":    true,
		"target_company":  true,
		"job_description": true,
		"audio_filename":  true,
		"speech":          true, // 编辑后的语音识别文本（字符串）
	}

	for key, value := range updates {
		if allowedFields[key] {
			metadata[key] = value
		}
	}

	// 特殊处理：当保存speech字段时，如果当前状态是transcribing，则更新状态为pending
	// 这表示ASR已完成，用户已确认/编辑了识别结果，可以进行下一步
	if _, hasSpeech := updates["speech"]; hasSpeech {
		currentStatus, _ := metadata["status"].(string)
		if currentStatus == model.InterviewReviewStatusTranscribing {
			metadata["status"] = model.InterviewReviewStatusPending
		}
	}

	// 保存更新
	metadataJSON, _ := json.Marshal(metadata)
	if err := global.DB.Model(review).Update("metadata", model.JSON(metadataJSON)).Error; err != nil {
		return nil, errors.New("更新元数据失败")
	}

	// 返回更新后的记录
	return s.GetInterviewReview(reviewID, userID)
}

// SyncASRResult 从ASR表同步识别结果到interview_review
// 直接从asr_tasks表获取数据，验证用户权限后更新到metadata
// 使用行级锁防止并发写入导致的数据覆盖问题
func (s *interviewService) SyncASRResult(reviewID int64, userID string) (*model.InterviewReview, error) {
	var result *model.InterviewReview

	// 使用事务和行级锁确保数据一致性
	err := global.DB.Transaction(func(tx *gorm.DB) error {
		// 获取记录并加行级锁（FOR UPDATE）
		var review model.InterviewReview
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("id = ?", reviewID).
			First(&review).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("面试复盘记录不存在")
			}
			return errors.New("查询面试复盘记录失败")
		}

		// 验证用户权限
		if review.UserID != userID {
			return errors.New("无权访问该记录")
		}

		// 解析metadata
		var metadata map[string]interface{}
		if err := json.Unmarshal(review.Metadata, &metadata); err != nil {
			return errors.New("解析元数据失败")
		}

		// 获取asr_task_id
		asrTaskID, ok := metadata["asr_task_id"].(string)
		if !ok || asrTaskID == "" {
			return errors.New("ASR任务ID不存在")
		}

		// 从asr_tasks表获取ASR任务
		var asrTask model.ASRTask
		if err := tx.Where("id = ?", asrTaskID).First(&asrTask).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("ASR任务不存在")
			}
			return errors.New("查询ASR任务失败")
		}

		// 验证用户权限：ASR任务的用户必须与review的用户一致
		if asrTask.UserID != userID {
			return errors.New("无权访问该ASR任务")
		}

		// 检查ASR任务状态
		switch asrTask.Status {
		case model.ASRTaskStatusPending, model.ASRTaskStatusProcessing:
			// 任务还在进行中，返回当前状态
			result = &review
			return nil
		case model.ASRTaskStatusFailed:
			// 任务失败，更新metadata
			metadata["status"] = model.InterviewReviewStatusFailed
			metadata["error_message"] = asrTask.ErrorMessage
			metadataJSON, _ := json.Marshal(metadata)
			if err := tx.Model(&review).Update("metadata", model.JSON(metadataJSON)).Error; err != nil {
				return errors.New("更新状态失败")
			}
			result = &review
			result.Metadata = model.JSON(metadataJSON)
			return nil
		case model.ASRTaskStatusCompleted:
			// 任务完成，解析result并更新metadata
			if asrTask.Result == "" {
				return errors.New("ASR结果为空")
			}

			// 解析ASR结果
			var asrResult map[string]interface{}
			if err := json.Unmarshal([]byte(asrTask.Result), &asrResult); err != nil {
				return errors.New("解析ASR结果失败")
			}

			// 更新metadata（保留已有字段，只更新ASR相关字段）
			metadata["asr_result"] = asrResult
			metadata["status"] = model.InterviewReviewStatusPending // 回到pending，准备分析
			delete(metadata, "error_message")
			metadataJSON, _ := json.Marshal(metadata)

			if err := tx.Model(&review).Update("metadata", model.JSON(metadataJSON)).Error; err != nil {
				return errors.New("保存ASR结果失败")
			}
			result = &review
			result.Metadata = model.JSON(metadataJSON)
			return nil
		default:
			return errors.New("未知的ASR任务状态")
		}
	})

	if err != nil {
		return nil, err
	}

	// 返回更新后的记录（重新查询以获取最新数据）
	return s.GetInterviewReview(reviewID, userID)
}

// TriggerAnalysis 触发面试分析工作流
// 需要先完成ASR识别（metadata中存在asr_result）才能触发分析
func (s *interviewService) TriggerAnalysis(reviewID int64, userID string) (*model.InterviewReview, error) {
	// 获取记录并验证权限
	review, err := s.GetInterviewReview(reviewID, userID)
	if err != nil {
		return nil, err
	}

	// 解析metadata
	var metadata map[string]interface{}
	if err := json.Unmarshal(review.Metadata, &metadata); err != nil {
		return nil, errors.New("解析元数据失败")
	}

	// 检查状态
	status, _ := metadata["status"].(string)
	// if status == model.InterviewReviewStatusCompleted {
	// 	return nil, errors.New("该记录已完成分析")
	// }
	if status == model.InterviewReviewStatusAnalyzing {
		return nil, errors.New("该记录正在分析中")
	}
	if status == model.InterviewReviewStatusTranscribing {
		return nil, errors.New("语音识别正在进行中，请等待完成后再分析")
	}

	// 检查ASR结果是否存在
	speech, ok := metadata["speech"].(string)
	if !ok || speech == "" {
		return nil, errors.New("请先完成语音识别")
	}
	company, ok := metadata["target_company"].(string)
	if !ok || company == "" {
		company = "未填写"
	}
	jobPosition, ok := metadata["job_position"].(string)
	if !ok || jobPosition == "" {
		jobPosition = "未填写"
	}
	jobDescription, ok := metadata["job_description"].(string)
	if !ok || jobDescription == "" {
		jobDescription = "未填写"
	}

	// 从workflows表查找名为 interview-analysis-workflow 的工作流
	workflow, err := s.getWorkflowByName("interview-analysis-workflow")
	if err != nil {
		return nil, err
	}

	// 更新状态为analyzing
	metadata["status"] = model.InterviewReviewStatusAnalyzing
	metadata["workflow_id"] = workflow.ID
	delete(metadata, "error_message") // 清除之前的错误信息
	metadataJSON, _ := json.Marshal(metadata)
	if err := global.DB.Model(review).Update("metadata", metadataJSON).Error; err != nil {
		return nil, errors.New("更新状态失败")
	}

	// 调用工作流服务执行分析
	// analysisResult, err := s.executeAnalysisWorkflow(workflow.ID, userID, asrResult)
	// 构建输入参数
	inputs := map[string]interface{}{
		"interview_text":  speech,
		"company_name":    company,
		"job_title":       jobPosition,
		"job_description": jobDescription,
	}

	// 使用标准工作流服务执行
	response, err := app.AppService.ExecuteWorkflow(workflow.ID, userID, inputs)
	if err != nil {
		s.updateAnalysisError(reviewID, err.Error())
		return nil, fmt.Errorf("执行工作流失败: %w", err)
	}

	if !response.Success {
		s.updateAnalysisError(reviewID, response.Message)
		return nil, fmt.Errorf("工作流执行失败: %s", response.Message)
	}

	// 从outputs中提取结果
	outputs, ok := response.Data["outputs"].(map[string]interface{})
	if !ok {
		s.updateAnalysisError(reviewID, "工作流输出格式错误")
		return nil, errors.New("工作流输出格式错误")
	}

	// 获取分析结果（假设输出字段名为 result 或 answer）

	// 序列化结果
	resultJSON, err := json.Marshal(outputs)
	if err != nil {
		s.updateAnalysisError(reviewID, err.Error())
		return nil, errors.New("序列化分析结果失败")
	}
	fmt.Println("analysisResult", string(resultJSON))

	// 更新记录：保存分析结果到data字段，更新状态为completed
	metadata["status"] = model.InterviewReviewStatusCompleted
	metadataJSON, _ = json.Marshal(metadata)

	// 直接存储分析结果字符串到data字段
	updates := map[string]interface{}{
		"data":     model.JSON(resultJSON),
		"metadata": model.JSON(metadataJSON),
	}

	if err := global.DB.Model(review).Updates(updates).Error; err != nil {
		return nil, errors.New("保存分析结果失败")
	}

	// 重新获取更新后的记录
	return s.GetInterviewReview(reviewID, userID)
}

// getWorkflowByName 从workflows表按名称查找工作流
func (s *interviewService) getWorkflowByName(name string) (*model.Workflow, error) {
	var workflow model.Workflow
	if err := global.DB.Where("name = ? AND enabled = ?", name, true).First(&workflow).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("工作流 '%s' 不存在，请在后台创建", name)
		}
		return nil, errors.New("查询工作流失败")
	}
	return &workflow, nil
}

// extractInterviewText 从ASR结果中提取utterances并组合为带行号的文本
// ASR结果格式: {"text": "...", "additions": {...}, "utterances": [{"text": "..."}, ...]}
func (s *interviewService) extractInterviewText(asrResult map[string]interface{}) (string, error) {
	// jsonText, _ := json.Marshal(asrResult)
	// fmt.Println("asrResult", string(jsonText))
	resultData, ok := asrResult["result"].(map[string]interface{})
	if !ok {
		return "", errors.New("ASR结果中没有有效的文本内容")
	}
	// 获取utterances数组
	utterances, ok := resultData["utterances"].([]interface{})
	if !ok || len(utterances) == 0 {
		// 如果没有utterances，尝试使用整体text
		if text, ok := resultData["text"].(string); ok && text != "" {
			return text, nil
		}
		return "", errors.New("ASR结果中没有有效的文本内容")
	}

	// 提取每个utterance的text并添加行号
	var lines []string
	for i, u := range utterances {
		utterance, ok := u.(map[string]interface{})
		if !ok {
			continue
		}
		text, ok := utterance["text"].(string)
		if !ok || text == "" {
			continue
		}
		// 添加行号（从1开始）
		line := fmt.Sprintf("%d. %s", i+1, text)
		lines = append(lines, line)
	}

	if len(lines) == 0 {
		return "", errors.New("无法从utterances中提取文本")
	}

	// 用换行符连接所有行
	return strings.Join(lines, "\n"), nil
}

// updateAnalysisError 更新分析错误状态
func (s *interviewService) updateAnalysisError(reviewID int64, errorMsg string) {
	var review model.InterviewReview
	if err := global.DB.Where("id = ?", reviewID).First(&review).Error; err != nil {
		return
	}

	var metadata map[string]interface{}
	json.Unmarshal(review.Metadata, &metadata)

	metadata["status"] = model.InterviewReviewStatusFailed
	metadata["error_message"] = errorMsg

	metadataJSON, _ := json.Marshal(metadata)
	global.DB.Model(&review).Update("metadata", metadataJSON)
}
