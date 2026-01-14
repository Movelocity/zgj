package interview

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"

	"server/global"
	"server/model"
	"server/service/app"
	"server/service/sitevariable"

	"gorm.io/gorm"
)

type interviewService struct{}

var InterviewService = &interviewService{}

// CreateInterviewReview 创建面试复盘记录
func (s *interviewService) CreateInterviewReview(userID, mainAudioID string, asrResult map[string]interface{}) (*model.InterviewReview, error) {
	// 验证ASR任务是否存在
	var asrTask model.ASRTask
	if err := global.DB.Where("id = ?", mainAudioID).First(&asrTask).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ASR任务不存在")
		}
		return nil, errors.New("查询ASR任务失败")
	}

	// 验证ASR任务是否属于当前用户
	if asrTask.UserID != userID {
		return nil, errors.New("无权访问该ASR任务")
	}

	// 验证ASR任务是否已完成
	if asrTask.Status != model.ASRTaskStatusCompleted {
		return nil, fmt.Errorf("ASR任务未完成，当前状态: %s", asrTask.Status)
	}

	// 构建metadata
	metadata := map[string]interface{}{
		"main_audio_id": mainAudioID,
		"status":        model.InterviewReviewStatusPending,
		"asr_result":    asrResult,
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

// TriggerAnalysis 触发面试分析工作流
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
	if status == model.InterviewReviewStatusCompleted {
		return nil, errors.New("该记录已完成分析")
	}
	if status == model.InterviewReviewStatusAnalyzing {
		return nil, errors.New("该记录正在分析中")
	}

	// 从site_variables获取workflow配置
	workflowConfig, err := s.getWorkflowConfig()
	if err != nil {
		return nil, err
	}

	// 更新状态为analyzing
	metadata["status"] = model.InterviewReviewStatusAnalyzing
	metadata["workflow_id"] = workflowConfig
	metadataJSON, _ := json.Marshal(metadata)
	if err := global.DB.Model(review).Update("metadata", metadataJSON).Error; err != nil {
		return nil, errors.New("更新状态失败")
	}

	// 提取ASR文本
	asrResult, ok := metadata["asr_result"].(map[string]interface{})
	if !ok {
		s.updateAnalysisError(reviewID, "ASR结果格式错误")
		return nil, errors.New("ASR结果格式错误")
	}

	// 调用Dify工作流
	analysisResult, err := s.callDifyWorkflow(workflowConfig, userID, asrResult)
	if err != nil {
		s.updateAnalysisError(reviewID, err.Error())
		return nil, err
	}

	// 更新记录：保存分析结果到data字段，更新状态为completed
	metadata["status"] = model.InterviewReviewStatusCompleted
	metadataJSON, _ = json.Marshal(metadata)
	
	analysisResultJSON, _ := json.Marshal(analysisResult)
	
	updates := map[string]interface{}{
		"data":     model.JSON(analysisResultJSON),
		"metadata": model.JSON(metadataJSON),
	}

	if err := global.DB.Model(review).Updates(updates).Error; err != nil {
		return nil, errors.New("保存分析结果失败")
	}

	// 重新获取更新后的记录
	return s.GetInterviewReview(reviewID, userID)
}

// getWorkflowConfig 从site_variables获取工作流配置
func (s *interviewService) getWorkflowConfig() (string, error) {
	config, err := sitevariable.SiteVariableService.GetSiteVariableByKey("interview-analysis-workflow")
	if err != nil {
		return "", errors.New("工作流配置不存在，请在后台配置 interview-analysis-workflow")
	}

	if config.Value == "" {
		return "", errors.New("工作流配置为空")
	}

	return config.Value, nil
}

// callDifyWorkflow 调用Dify工作流API（非流式）
func (s *interviewService) callDifyWorkflow(workflowID, userID string, asrResult map[string]interface{}) (map[string]interface{}, error) {
	// 构建输入参数
	inputs := map[string]interface{}{
		"asr_result": asrResult,
	}

	// 调用工作流
	response, err := app.AppService.ExecuteWorkflowAPI(workflowID, userID, inputs)
	if err != nil {
		return nil, fmt.Errorf("调用Dify工作流失败: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("工作流执行失败: %s", response.Message)
	}

	return response.Data, nil
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
