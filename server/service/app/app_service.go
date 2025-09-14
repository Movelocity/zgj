package app

import (
	"encoding/json"
	"errors"
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

// UpdateWorkflow 更新工作流
func (s *appService) UpdateWorkflow(workflowID, userID string, req UpdateWorkflowRequest) error {
	// 检查工作流是否存在且属于当前用户
	var workflow model.Workflow
	if err := global.DB.Where("id = ? AND creator_id = ?", workflowID, userID).First(&workflow).Error; err != nil {
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
	updates["is_public"] = req.IsPublic

	if err := global.DB.Model(&workflow).Updates(updates).Error; err != nil {
		return errors.New("更新工作流失败")
	}

	return nil
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

	// 获取关联的简历ID（如果有）
	resumeID := ""
	if resumeIDValue, exists := inputs["resume_id"]; exists {
		if resumeIDStr, ok := resumeIDValue.(string); ok {
			resumeID = resumeIDStr
		}
	}

	// 这里应该实现实际的工作流执行逻辑
	// 目前返回模拟结果
	var response *ExecuteWorkflowResponse
	var status string
	var errorMessage string

	// 模拟执行过程
	time.Sleep(100 * time.Millisecond) // 模拟执行时间

	response = &ExecuteWorkflowResponse{
		Success: true,
		Data:    map[string]interface{}{"result": "工作流执行成功", "processed_content": "优化后的简历内容"},
		Message: "执行成功",
	}
	status = "success"

	// 计算执行时间
	executionTime := int(time.Since(startTime).Milliseconds())

	// 记录执行历史（异步执行，不影响主流程）
	go func() {
		// 这里需要导入workflow服务，但为了避免循环依赖，我们直接在这里实现
		inputsJSON, _ := json.Marshal(inputs)
		outputsJSON, _ := json.Marshal(response.Data)

		execution := model.WorkflowExecution{
			ID:            utils.GenerateTLID(),
			WorkflowID:    workflowID,
			UserID:        userID,
			ResumeID:      resumeID,
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
func (s *appService) GetAllWorkflows() ([]WorkflowResponse, error) {
	var workflows []model.Workflow
	if err := global.DB.Order("updated_at desc").Find(&workflows).Error; err != nil {
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
	updates["is_public"] = req.IsPublic

	if err := global.DB.Model(&workflow).Updates(updates).Error; err != nil {
		return errors.New("更新工作流失败")
	}

	return nil
}
