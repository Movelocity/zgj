package app

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"server/global"
	"server/model"
	"server/utils"

	"gorm.io/gorm"
)

type appService struct{}

var AppService = &appService{}

// GetConversations 获取对话列表
func (s *appService) GetConversations(userID string) ([]ConversationResponse, error) {
	var conversations []model.Conversation
	if err := global.DB.Where("user_id = ?", userID).Order("updated_at desc").Find(&conversations).Error; err != nil {
		return nil, errors.New("查询对话失败")
	}

	var responses []ConversationResponse
	for _, conv := range conversations {
		var messages interface{}
		if len(conv.Messages) > 0 {
			json.Unmarshal(conv.Messages, &messages)
		}

		response := ConversationResponse{
			ID:         conv.ID,
			Title:      conv.Title,
			Messages:   messages,
			CreatedAt:  conv.CreatedAt,
			UpdatedAt:  conv.UpdatedAt,
			IsArchived: conv.IsArchived,
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// GetConversation 获取特定对话
func (s *appService) GetConversation(conversationID, userID string) (*ConversationResponse, error) {
	var conversation model.Conversation
	if err := global.DB.Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("对话不存在")
		}
		return nil, errors.New("查询对话失败")
	}

	var messages interface{}
	if len(conversation.Messages) > 0 {
		json.Unmarshal(conversation.Messages, &messages)
	}

	response := &ConversationResponse{
		ID:         conversation.ID,
		Title:      conversation.Title,
		Messages:   messages,
		CreatedAt:  conversation.CreatedAt,
		UpdatedAt:  conversation.UpdatedAt,
		IsArchived: conversation.IsArchived,
	}

	return response, nil
}

// CreateConversation 创建对话
func (s *appService) CreateConversation(userID, title string) (*ConversationResponse, error) {
	conversation := model.Conversation{
		ID:       utils.GenerateTLID(),
		UserID:   userID,
		Title:    title,
		Messages: model.JSON("[]"),
	}

	if err := global.DB.Create(&conversation).Error; err != nil {
		return nil, errors.New("创建对话失败")
	}

	response := &ConversationResponse{
		ID:         conversation.ID,
		Title:      conversation.Title,
		Messages:   []interface{}{},
		CreatedAt:  conversation.CreatedAt,
		UpdatedAt:  conversation.UpdatedAt,
		IsArchived: conversation.IsArchived,
	}

	return response, nil
}

// UpdateConversation 更新对话
func (s *appService) UpdateConversation(conversationID, userID string, req UpdateConversationRequest) error {
	// 检查对话是否存在且属于当前用户
	var conversation model.Conversation
	if err := global.DB.Where("id = ? AND user_id = ?", conversationID, userID).First(&conversation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("对话不存在")
		}
		return errors.New("查询对话失败")
	}

	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Messages != nil {
		messagesJSON, err := json.Marshal(req.Messages)
		if err != nil {
			return errors.New("消息格式错误")
		}
		updates["messages"] = model.JSON(messagesJSON)
	}
	updates["is_archived"] = req.IsArchived

	if err := global.DB.Model(&conversation).Updates(updates).Error; err != nil {
		return errors.New("更新对话失败")
	}

	return nil
}

// DeleteConversation 删除对话
func (s *appService) DeleteConversation(conversationID, userID string) error {
	result := global.DB.Where("id = ? AND user_id = ?", conversationID, userID).Delete(&model.Conversation{})
	if result.Error != nil {
		return errors.New("删除对话失败")
	}
	if result.RowsAffected == 0 {
		return errors.New("对话不存在")
	}

	return nil
}

// GetWorkflows 获取工作流列表
func (s *appService) GetWorkflows(userID string) ([]WorkflowResponse, error) {
	var workflows []model.Workflow
	// 获取用户创建的工作流和公开的工作流
	if err := global.DB.Where("creator_id = ? OR is_public = ?", userID, true).Order("updated_at desc").Find(&workflows).Error; err != nil {
		return nil, errors.New("查询工作流失败")
	}

	var responses []WorkflowResponse
	for _, workflow := range workflows {
		var inputs, outputs interface{}
		if len(workflow.Inputs) > 0 {
			json.Unmarshal(workflow.Inputs, &inputs)
		}
		if len(workflow.Outputs) > 0 {
			json.Unmarshal(workflow.Outputs, &outputs)
		}

		response := WorkflowResponse{
			ID:          workflow.ID,
			Name:        workflow.Name,
			Description: workflow.Description,
			Inputs:      inputs,
			Outputs:     outputs,
			Used:        workflow.Used,
			IsPublic:    workflow.IsPublic,
			CreatedAt:   workflow.CreatedAt,
			UpdatedAt:   workflow.UpdatedAt,
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// GetWorkflow 获取特定工作流
func (s *appService) GetWorkflow(workflowID, userID string) (*WorkflowResponse, error) {
	var workflow model.Workflow
	// 用户只能访问自己创建的或公开的工作流
	if err := global.DB.Where("id = ? AND (creator_id = ? OR is_public = ?)", workflowID, userID, true).First(&workflow).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("工作流不存在")
		}
		return nil, errors.New("查询工作流失败")
	}

	var inputs, outputs interface{}
	if len(workflow.Inputs) > 0 {
		json.Unmarshal(workflow.Inputs, &inputs)
	}
	if len(workflow.Outputs) > 0 {
		json.Unmarshal(workflow.Outputs, &outputs)
	}

	response := &WorkflowResponse{
		ID:          workflow.ID,
		Name:        workflow.Name,
		Description: workflow.Description,
		Inputs:      inputs,
		Outputs:     outputs,
		Used:        workflow.Used,
		IsPublic:    workflow.IsPublic,
		CreatedAt:   workflow.CreatedAt,
		UpdatedAt:   workflow.UpdatedAt,
	}

	return response, nil
}

// CreateWorkflow 创建工作流
func (s *appService) CreateWorkflow(userID string, req CreateWorkflowRequest) (*WorkflowResponse, error) {
	inputsJSON, err := json.Marshal(req.Inputs)
	if err != nil {
		return nil, errors.New("输入参数格式错误")
	}

	outputsJSON, err := json.Marshal(req.Outputs)
	if err != nil {
		return nil, errors.New("输出参数格式错误")
	}

	workflow := model.Workflow{
		ID:          utils.GenerateTLID(),
		ApiURL:      req.ApiURL,
		ApiKey:      req.ApiKey,
		Name:        req.Name,
		Description: req.Description,
		CreatorID:   userID,
		Inputs:      model.JSON(inputsJSON),
		Outputs:     model.JSON(outputsJSON),
		IsPublic:    req.IsPublic,
		Used:        0,
	}

	if err := global.DB.Create(&workflow).Error; err != nil {
		return nil, errors.New("创建工作流失败")
	}

	response := &WorkflowResponse{
		ID:          workflow.ID,
		Name:        workflow.Name,
		Description: workflow.Description,
		Inputs:      req.Inputs,
		Outputs:     req.Outputs,
		Used:        workflow.Used,
		IsPublic:    workflow.IsPublic,
		CreatedAt:   workflow.CreatedAt,
		UpdatedAt:   workflow.UpdatedAt,
	}

	return response, nil
}

// DeleteWorkflow 删除工作流
func (s *appService) DeleteWorkflow(workflowID, userID string) error {
	result := global.DB.Where("id = ? AND creator_id = ?", workflowID, userID).Delete(&model.Workflow{})
	if result.Error != nil {
		return errors.New("删除工作流失败")
	}
	if result.RowsAffected == 0 {
		return errors.New("工作流不存在")
	}

	return nil
}

// ExecuteWorkflow 执行工作流
func (s *appService) ExecuteWorkflow(workflowID, userID string, inputs map[string]interface{}) (*ExecuteWorkflowResponse, error) {
	startTime := time.Now()

	// 获取工作流信息
	var workflow model.Workflow
	if err := global.DB.Where("id = ? AND (creator_id = ? OR is_public = ?)", workflowID, userID, true).First(&workflow).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("工作流不存在")
		}
		return nil, errors.New("查询工作流失败")
	}

	// 实现实际的工作流执行逻辑
	var response *ExecuteWorkflowResponse
	var status string
	var errorMessage string

	// 调用远程工作流API
	apiResponse, err := s.CallWorkflowAPI(workflow.ApiURL, workflow.ApiKey, userID, inputs)
	if err != nil {
		errorMessage = err.Error()
		status = "failed"
		response = &ExecuteWorkflowResponse{
			Success: false,
			Data:    map[string]interface{}{},
			Message: fmt.Sprintf("工作流执行失败: %s", err.Error()),
		}
	} else {
		// 根据API响应状态判断结果
		if apiResponse.Data.Status == "succeeded" {
			status = "success"
			response = &ExecuteWorkflowResponse{
				Success: true,
				Data: map[string]interface{}{
					"workflow_run_id": apiResponse.WorkflowRunID,
					"task_id":         apiResponse.TaskID,
					"outputs":         apiResponse.Data.Outputs,
					"elapsed_time":    apiResponse.Data.ElapsedTime,
					"total_tokens":    apiResponse.Data.TotalTokens,
					"total_steps":     apiResponse.Data.TotalSteps,
				},
				Message: "工作流执行成功",
			}
		} else {
			status = "failed"
			errorMsg := "未知错误"
			if apiResponse.Data.Error != nil {
				errorMsg = *apiResponse.Data.Error
			}
			errorMessage = errorMsg
			response = &ExecuteWorkflowResponse{
				Success: false,
				Data: map[string]interface{}{
					"workflow_run_id": apiResponse.WorkflowRunID,
					"task_id":         apiResponse.TaskID,
					"status":          apiResponse.Data.Status,
				},
				Message: fmt.Sprintf("工作流执行失败: %s", errorMsg),
			}
		}
	}

	// 计算执行时间
	executionTime := int(time.Since(startTime).Milliseconds())

	// 记录日志，异步执行，不影响主流程
	go func() {
		// 这里需要导入workflow服务，但为了避免循环依赖，我们直接在这里实现
		inputsJSON, _ := json.Marshal(inputs)
		outputsJSON, _ := json.Marshal(response.Data)

		execution := model.WorkflowExecution{
			ID:         utils.GenerateTLID(),
			WorkflowID: workflowID,
			UserID:     userID,
			// ResumeID:      "",
			Inputs:        model.JSON(inputsJSON),
			Outputs:       model.JSON(outputsJSON),
			Status:        status,
			ErrorMessage:  errorMessage,
			ExecutionTime: executionTime,
		}

		global.DB.Create(&execution)

		// 只有成功时才增加使用次数
		if status == "success" {
			global.DB.Model(&workflow).UpdateColumn("used", gorm.Expr("used + ?", 1))
		}
	}()

	return response, nil
}

// GetAllWorkflows 获取所有工作流（管理员）
func (s *appService) GetAllWorkflows() ([]AdminWorkflowResponse, error) {
	var workflows []model.Workflow
	if err := global.DB.Order("updated_at desc").Find(&workflows).Error; err != nil {
		return nil, errors.New("查询工作流失败")
	}

	var responses []AdminWorkflowResponse
	for _, workflow := range workflows {
		var inputs, outputs interface{}
		if len(workflow.Inputs) > 0 {
			json.Unmarshal(workflow.Inputs, &inputs)
		}
		if len(workflow.Outputs) > 0 {
			json.Unmarshal(workflow.Outputs, &outputs)
		}

		response := AdminWorkflowResponse{
			ID:          workflow.ID,
			ApiURL:      workflow.ApiURL,
			ApiKey:      workflow.ApiKey,
			Name:        workflow.Name,
			Description: workflow.Description,
			CreatorID:   workflow.CreatorID,
			Inputs:      inputs,
			Outputs:     outputs,
			Used:        workflow.Used,
			Enabled:     workflow.Enabled,
			IsPublic:    workflow.IsPublic,
			CreatedAt:   workflow.CreatedAt,
			UpdatedAt:   workflow.UpdatedAt,
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// AdminUpdateWorkflow 管理员更新工作流
func (s *appService) AdminUpdateWorkflow(workflowID string, req UpdateWorkflowRequest) error {
	// 检查工作流是否存在
	var workflow model.Workflow
	if err := global.DB.Where("id = ?", workflowID).First(&workflow).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("工作流不存在")
		}
		return errors.New("查询工作流失败")
	}

	updates := make(map[string]interface{})
	if req.ApiURL != "" {
		updates["api_url"] = req.ApiURL
	}
	if req.ApiKey != "" {
		updates["api_key"] = req.ApiKey
	}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Inputs != nil {
		inputsJSON, err := json.Marshal(req.Inputs)
		if err != nil {
			return errors.New("输入参数格式错误")
		}
		updates["inputs"] = model.JSON(inputsJSON)
	}
	if req.Outputs != nil {
		outputsJSON, err := json.Marshal(req.Outputs)
		if err != nil {
			return errors.New("输出参数格式错误")
		}
		updates["outputs"] = model.JSON(outputsJSON)
	}
	updates["enabled"] = req.Enabled
	updates["is_public"] = req.IsPublic

	if err := global.DB.Model(&workflow).Updates(updates).Error; err != nil {
		return errors.New("更新工作流失败")
	}

	return nil
}

// callWorkflowAPI 调用远程工作流API
func (s *appService) CallWorkflowAPI(apiURL, apiKey, userID string, inputs map[string]interface{}) (*WorkflowAPIResponse, error) {
	// 构建请求体
	requestBody := WorkflowAPIRequest{
		Inputs:       inputs,
		ResponseMode: "blocking", // 只支持blocking模式
		User:         userID,
	}
	fmt.Println("callWorkflowAPI", requestBody)

	// 序列化请求体
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("序列化请求数据失败: %w", err)
	}

	// 创建HTTP请求
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("创建HTTP请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	// 创建HTTP客户端并发送请求
	client := &http.Client{
		Timeout: 60 * time.Second, // 设置60秒超时
	}

	fmt.Println("request workflow", req)

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送HTTP请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应体失败: %w", err)
	}

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API请求失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var apiResponse WorkflowAPIResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return nil, fmt.Errorf("解析响应数据失败: %w, 响应内容: %s", err, string(body))
	}

	return &apiResponse, nil
}
