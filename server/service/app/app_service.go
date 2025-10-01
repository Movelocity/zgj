package app

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"server/global"
	"server/model"
	"server/utils"

	"github.com/gin-gonic/gin"
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
	apiResponse, err := s.callWorkflowAPI(workflow.ApiURL, workflow.ApiKey, userID, inputs)
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
			if apiResponse.Data.Error != "" {
				errorMsg = apiResponse.Data.Error
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

	// 记录工作流执行日志
	s.LogWorkflowExecution(workflowID, userID, inputs, response, status, errorMessage, executionTime)

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

// LogWorkflowExecution 记录工作流执行日志
func (s *appService) LogWorkflowExecution(workflowID, userID string, inputs map[string]interface{}, response *ExecuteWorkflowResponse, status string, errorMessage string, executionTime int) {
	go func() {
		// 获取工作流信息用于更新使用次数
		var workflow model.Workflow
		global.DB.Where("id = ?", workflowID).First(&workflow)

		inputsJSON, _ := json.Marshal(inputs)
		outputsJSON, _ := json.Marshal(response.Data)

		execution := model.WorkflowExecution{
			ID:            utils.GenerateTLID(),
			WorkflowID:    workflowID,
			UserID:        userID,
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
}

// ExecuteWorkflowAPI 执行工作流API并自动记录日志 (公开方法)
func (s *appService) ExecuteWorkflowAPI(workflowID, userID string, inputs map[string]interface{}) (*ExecuteWorkflowResponse, error) {
	startTime := time.Now()

	// 获取工作流信息
	var workflow model.Workflow
	if err := global.DB.Where("id = ?", workflowID).First(&workflow).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("工作流不存在")
		}
		return nil, errors.New("查询工作流失败")
	}

	// 调用私有的工作流API方法
	var response *ExecuteWorkflowResponse
	var status string
	var errorMessage string

	apiResponse, err := s.callWorkflowAPI(workflow.ApiURL, workflow.ApiKey, userID, inputs)
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
			if apiResponse.Data.Error != "" {
				errorMsg = apiResponse.Data.Error
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

	// 计算执行时间并记录日志
	executionTime := int(time.Since(startTime).Milliseconds())
	s.LogWorkflowExecution(workflowID, userID, inputs, response, status, errorMessage, executionTime)

	return response, nil
}

// callWorkflowAPI 调用远程工作流API (私有方法)
func (s *appService) callWorkflowAPI(apiURL, apiKey, userID string, inputs map[string]interface{}) (*WorkflowAPIResponse, error) {
	// 构建请求体
	requestBody := WorkflowAPIRequest{
		Inputs:       inputs,
		ResponseMode: "blocking", // 只支持blocking模式
		User:         userID,
	}

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
	client := &http.Client{Timeout: 90 * time.Second} // 设置60秒超时
	fmt.Println("[request workflow]", req)

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
	fmt.Println("[response workflow] ", string(body))

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

// 流式执行管理器
var (
	streamContexts = make(map[string]*StreamContext)
	streamMutex    = sync.RWMutex{}
)

// ExecuteWorkflowStream 流式执行工作流
func (s *appService) ExecuteWorkflowStream(c *gin.Context, workflowID, userID string, inputs map[string]interface{}) error {
	// 获取工作流信息
	var workflow model.Workflow
	if err := global.DB.Where("id = ?", workflowID).First(&workflow).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("工作流不存在")
		}
		return errors.New("查询工作流失败")
	}

	// 设置SSE响应头
	s.setSSEHeaders(c)

	// 创建流式执行上下文
	ctx, cancel := context.WithCancel(c.Request.Context())
	streamCtx := &StreamContext{
		WorkflowID: workflowID,
		UserID:     userID,
		Inputs:     inputs,
		CancelFunc: cancel,
		Done:       make(chan struct{}),
		Error:      make(chan error, 1),
		StartTime:  time.Now(),
	}

	// 注册流式上下文
	streamID := fmt.Sprintf("%s_%s_%d", workflowID, userID, time.Now().UnixNano())
	streamMutex.Lock()
	streamContexts[streamID] = streamCtx
	streamMutex.Unlock()

	// 清理函数
	defer func() {
		streamMutex.Lock()
		delete(streamContexts, streamID)
		streamMutex.Unlock()
		close(streamCtx.Done)
		close(streamCtx.Error)
	}()

	// 直接在当前goroutine中处理流式请求
	return s.handleWorkflowStreamDirect(ctx, c, streamCtx, workflow)
}

// handleWorkflowStreamDirect 直接处理工作流流式执行
func (s *appService) handleWorkflowStreamDirect(ctx context.Context, c *gin.Context, streamCtx *StreamContext, workflow model.Workflow) error {
	defer func() {
		streamCtx.ExecutionTime = int(time.Since(streamCtx.StartTime).Milliseconds())
	}()

	// 调用远程工作流流式API
	return s.callWorkflowStreamAPIDirect(ctx, c, streamCtx, workflow.ApiURL, workflow.ApiKey)
}

// callWorkflowStreamAPIDirect 直接调用远程工作流流式API
func (s *appService) callWorkflowStreamAPIDirect(ctx context.Context, c *gin.Context, streamCtx *StreamContext, apiURL, apiKey string) error {
	// 构建请求体
	requestBody := WorkflowAPIRequest{
		Inputs:       streamCtx.Inputs,
		ResponseMode: "streaming",
		User:         streamCtx.UserID,
	}

	// inputs 中的 __query pop 出来，赋给 requestBody.Query
	// __xx 为特殊变量，单独处理
	query, ok := streamCtx.Inputs["__query"]
	if ok {
		requestBody.Query = query.(string)
		delete(streamCtx.Inputs, "__query")
	}

	// 序列化请求体
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("序列化请求数据失败: %w", err)
	}

	fmt.Println("apiURL", apiURL)
	fmt.Println("apiKey", apiKey)
	fmt.Println("[request workflow stream]", string(jsonData))

	// 创建HTTP请求
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("创建HTTP请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Accept", "text/event-stream")

	// 创建HTTP客户端并发送请求
	client := &http.Client{Timeout: 300 * time.Second} // 5分钟超时
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("发送HTTP请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API请求失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	// 处理SSE流
	return s.processSSEStreamDirect(ctx, c, streamCtx, resp.Body)
}

// processSSEStreamDirect 直接处理SSE流并转发到gin.Context
func (s *appService) processSSEStreamDirect(ctx context.Context, c *gin.Context, streamCtx *StreamContext, body io.ReadCloser) error {
	scanner := bufio.NewScanner(body)
	scanner.Split(bufio.ScanLines)

	var finalOutputs map[string]interface{}
	var finalStatus string
	var errorMessage string

	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		line := scanner.Text()
		if len(line) == 0 {
			continue
		}

		// 处理SSE数据行
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			data = strings.TrimSuffix(data, "\r")

			if data == "[DONE]" {
				break
			}

			// 转发给客户端
			fmt.Fprintf(c.Writer, "data: %s\n\n", data)
			c.Writer.Flush()

			// 检查是否为workflow_finished事件
			if strings.HasPrefix(data, `{"event": "workflow_finished"`) {
				outputs, status, err := s.parseWorkflowFinishedEvent(data)
				if err == nil {
					finalOutputs = outputs
					finalStatus = status
				}
			}
		} else if strings.HasPrefix(line, "event: ") {
			// 转发事件行
			fmt.Fprintf(c.Writer, "%s\n", line)
			c.Writer.Flush()
		}
	}

	if err := scanner.Err(); err != nil {
		errorMessage = err.Error()
		finalStatus = "failed"
	}

	// 记录执行日志
	response := &ExecuteWorkflowResponse{
		Success: finalStatus == "succeeded",
		Data:    map[string]interface{}{"outputs": finalOutputs},
		Message: "工作流执行完成",
	}

	if finalStatus == "failed" {
		response.Success = false
		response.Message = fmt.Sprintf("工作流执行失败: %s", errorMessage)
	}

	s.LogWorkflowExecution(streamCtx.WorkflowID, streamCtx.UserID, streamCtx.Inputs, response, finalStatus, errorMessage, streamCtx.ExecutionTime)

	return nil
}

// parseWorkflowFinishedEvent 解析workflow_finished事件
func (s *appService) parseWorkflowFinishedEvent(data string) (map[string]interface{}, string, error) {
	var event WorkflowStreamEvent
	if err := json.Unmarshal([]byte(data), &event); err != nil {
		return nil, "", err
	}

	if event.Event != "workflow_finished" {
		return nil, "", errors.New("不是workflow_finished事件")
	}

	// 解析事件数据
	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return nil, "", err
	}

	var finishedData WorkflowFinishedEventData
	if err := json.Unmarshal(dataBytes, &finishedData); err != nil {
		return nil, "", err
	}

	return finishedData.Outputs, finishedData.Status, nil
}

// setSSEHeaders 设置SSE响应头
func (s *appService) setSSEHeaders(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "Cache-Control")
}

// writeSSEError 写入SSE错误
// func (s *appService) writeSSEError(c *gin.Context, message string) {
// 	errorData := map[string]interface{}{
// 		"event": "error",
// 		"data":  map[string]string{"message": message},
// 	}
// 	jsonData, _ := json.Marshal(errorData)
// 	fmt.Fprintf(c.Writer, "data: %s\n\n", jsonData)
// 	c.Writer.Flush()
// }

// CancelWorkflowStream 取消流式执行
func (s *appService) CancelWorkflowStream(streamID string) error {
	streamMutex.RLock()
	streamCtx, exists := streamContexts[streamID]
	streamMutex.RUnlock()

	if !exists {
		return errors.New("流式执行不存在")
	}

	streamCtx.CancelFunc()
	return nil
}

func (s *appService) ExecuteWorkflowByName(c *gin.Context, workflowName, userID string, inputs map[string]interface{}, responseMode string) (*ExecuteWorkflowResponse, error) {

	// 获取工作流信息
	var workflow model.Workflow
	if err := global.DB.Where("name = ?", workflowName).First(&workflow).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("工作流不存在")
		}
		return nil, errors.New("查询工作流失败")
	}

	if responseMode == "blocking" {
		return s.ExecuteWorkflow(workflow.ID, userID, inputs)
	} else {
		s.ExecuteWorkflowStream(c, workflow.ID, userID, inputs)
		return nil, nil
	}
}
