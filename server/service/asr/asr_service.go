package asr

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"server/global"
	"server/model"

	"github.com/google/uuid"
)

// ASRServiceInterface ASR语音识别服务接口
type ASRServiceInterface interface {
	// SubmitTask 提交识别任务
	SubmitTask(ctx context.Context, req *global.ASRSubmitTaskRequest) (*model.ASRTask, error)

	// GetTask 获取任务详情
	GetTask(ctx context.Context, taskID string) (*model.ASRTask, error)

	// PollTask 轮询任务结果(主动查询云端)
	PollTask(ctx context.Context, taskID string) (*model.ASRTask, error)

	// ListTasks 查询任务列表
	ListTasks(ctx context.Context, userID string, page, pageSize int) (*global.ASRTaskListResponse, error)

	// DeleteTask 删除任务
	DeleteTask(ctx context.Context, taskID string) error

	// RetryTask 重试失败的任务
	RetryTask(ctx context.Context, taskID string) (*model.ASRTask, error)
}

// asrService ASR服务实现
type asrService struct {
	client  *http.Client
	baseURL string
	appKey  string
	token   string
}

// NewASRService 创建ASR服务实例
func NewASRService() (ASRServiceInterface, error) {
	config := global.CONFIG.ASR

	// 创建HTTP客户端
	timeout := config.Timeout
	if timeout <= 0 {
		timeout = 60 // 默认60秒
	}

	return &asrService{
		client: &http.Client{
			Timeout: time.Duration(timeout) * time.Second,
		},
		baseURL: config.BaseURL,
		appKey:  config.AppKey,
		token:   config.AccessKey,
	}, nil
}

// SubmitTask 提交识别任务
func (s *asrService) SubmitTask(ctx context.Context, req *global.ASRSubmitTaskRequest) (*model.ASRTask, error) {
	// 生成任务ID
	taskID := uuid.New().String()

	// 准备识别选项
	options := req.Options
	if options == nil {
		options = make(map[string]interface{})
	}

	// 设置默认选项
	if _, ok := options["enable_itn"]; !ok {
		options["enable_itn"] = true // 默认开启ITN（逆文本规范化）
	}
	if _, ok := options["enable_ddc"]; !ok {
		options["enable_ddc"] = true // 默认开启DDC（语气词删除）
	}

	optionsJSON, _ := json.Marshal(options)

	// 创建任务记录
	task := &model.ASRTask{
		ID:          taskID,
		UserID:      req.UserID,
		AudioURL:    req.AudioURL,
		AudioFormat: req.AudioFormat,
		Status:      model.ASRTaskStatusPending,
		Progress:    0,
		Options:     string(optionsJSON),
	}

	// 保存到数据库
	if err := global.DB.Create(task).Error; err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	// 异步提交到ASR API
	go s.submitToASRAPI(taskID, req.AudioURL, req.AudioFormat, options)

	return task, nil
}

// submitToASRAPI 提交到ASR API（异步）
func (s *asrService) submitToASRAPI(taskID, audioURL, audioFormat string, options map[string]interface{}) {
	// 构造请求体
	requestBody := map[string]interface{}{
		"app_id":       s.appKey,
		"audio_url":    audioURL,
		"audio_format": audioFormat,
		"task_id":      taskID,
	}

	// 合并选项
	for k, v := range options {
		requestBody[k] = v
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		s.updateTaskError(taskID, fmt.Sprintf("failed to marshal request: %v", err))
		return
	}

	// 发送HTTP请求
	req, err := http.NewRequest("POST", s.baseURL+"/api/v1/asr/submit", bytes.NewBuffer(jsonData))
	if err != nil {
		s.updateTaskError(taskID, fmt.Sprintf("failed to create request: %v", err))
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.token)

	resp, err := s.client.Do(req)
	if err != nil {
		s.updateTaskError(taskID, fmt.Sprintf("failed to submit task: %v", err))
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		s.updateTaskError(taskID, fmt.Sprintf("ASR API error: %s", string(body)))
		return
	}

	// 解析响应
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		s.updateTaskError(taskID, fmt.Sprintf("failed to parse response: %v", err))
		return
	}

	// 更新任务状态为processing
	global.DB.Model(&model.ASRTask{}).
		Where("id = ?", taskID).
		Updates(map[string]interface{}{
			"status":   model.ASRTaskStatusProcessing,
			"progress": 10,
		})
}

// GetTask 获取任务详情
func (s *asrService) GetTask(ctx context.Context, taskID string) (*model.ASRTask, error) {
	var task model.ASRTask
	if err := global.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		return nil, fmt.Errorf("task not found: %w", err)
	}
	return &task, nil
}

// PollTask 轮询任务结果
func (s *asrService) PollTask(ctx context.Context, taskID string) (*model.ASRTask, error) {
	// 先从数据库获取任务
	task, err := s.GetTask(ctx, taskID)
	if err != nil {
		return nil, err
	}

	// 如果任务已经完成或失败，直接返回
	if task.Status == model.ASRTaskStatusCompleted || task.Status == model.ASRTaskStatusFailed {
		return task, nil
	}

	// 查询ASR API获取最新状态
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/v1/asr/query?task_id=%s", s.baseURL, taskID), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.token)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to query task: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ASR API error: %s", string(body))
	}

	// 解析响应
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// 更新任务状态
	status := result["status"].(string)
	progress := 50 // 默认进度

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}

	switch status {
	case "processing":
		updates["status"] = model.ASRTaskStatusProcessing
		if p, ok := result["progress"].(float64); ok {
			progress = int(p)
		}
		updates["progress"] = progress
	case "completed":
		updates["status"] = model.ASRTaskStatusCompleted
		updates["progress"] = 100
		// 保存识别结果
		if resultData, ok := result["result"]; ok {
			resultJSON, _ := json.Marshal(resultData)
			updates["result"] = string(resultJSON)
		}
	case "failed":
		updates["status"] = model.ASRTaskStatusFailed
		if errMsg, ok := result["error"].(string); ok {
			updates["error_message"] = errMsg
		}
	}

	// 更新数据库
	if err := global.DB.Model(&model.ASRTask{}).Where("id = ?", taskID).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	// 重新获取任务
	return s.GetTask(ctx, taskID)
}

// ListTasks 查询任务列表
func (s *asrService) ListTasks(ctx context.Context, userID string, page, pageSize int) (*global.ASRTaskListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	var total int64
	var items []model.ASRTask

	// 查询总数
	if err := global.DB.Model(&model.ASRTask{}).
		Where("user_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count tasks: %w", err)
	}

	// 查询记录
	if err := global.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to list tasks: %w", err)
	}

	return &global.ASRTaskListResponse{
		Total:   total,
		Page:    page,
		PerPage: pageSize,
		Items:   items,
	}, nil
}

// DeleteTask 删除任务
func (s *asrService) DeleteTask(ctx context.Context, taskID string) error {
	if err := global.DB.Where("id = ?", taskID).Delete(&model.ASRTask{}).Error; err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}
	return nil
}

// RetryTask 重试失败的任务
func (s *asrService) RetryTask(ctx context.Context, taskID string) (*model.ASRTask, error) {
	// 获取任务
	task, err := s.GetTask(ctx, taskID)
	if err != nil {
		return nil, err
	}

	// 只能重试失败的任务
	if task.Status != model.ASRTaskStatusFailed {
		return nil, fmt.Errorf("only failed tasks can be retried")
	}

	// 重置任务状态
	updates := map[string]interface{}{
		"status":        model.ASRTaskStatusPending,
		"progress":      0,
		"error_message": "",
		"updated_at":    time.Now(),
	}

	if err := global.DB.Model(&model.ASRTask{}).Where("id = ?", taskID).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	// 解析选项
	var options map[string]interface{}
	if task.Options != "" {
		json.Unmarshal([]byte(task.Options), &options)
	}

	// 重新提交
	go s.submitToASRAPI(taskID, task.AudioURL, task.AudioFormat, options)

	return s.GetTask(ctx, taskID)
}

// updateTaskError 更新任务错误状态
func (s *asrService) updateTaskError(taskID, errorMsg string) {
	global.DB.Model(&model.ASRTask{}).
		Where("id = ?", taskID).
		Updates(map[string]interface{}{
			"status":        model.ASRTaskStatusFailed,
			"error_message": errorMsg,
		})
}
