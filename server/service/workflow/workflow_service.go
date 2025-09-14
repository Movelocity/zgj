package workflow

import (
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"server/global"
	"server/model"
	"server/utils"

	"gorm.io/gorm"
)

type workflowService struct{}

var WorkflowService = &workflowService{}

// RecordExecution 记录工作流执行历史
func (s *workflowService) RecordExecution(workflowID, userID, resumeID string, inputs, outputs interface{}, status string, errorMessage string, executionTime int) error {
	// 序列化输入输出数据
	inputsJSON, err := json.Marshal(inputs)
	if err != nil {
		return errors.New("输入数据序列化失败")
	}

	outputsJSON, err := json.Marshal(outputs)
	if err != nil {
		return errors.New("输出数据序列化失败")
	}

	// 创建执行记录
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
		CreatedAt:     time.Now(),
	}

	if err := global.DB.Create(&execution).Error; err != nil {
		return errors.New("创建执行记录失败")
	}

	// 更新工作流使用次数
	if status == "success" {
		global.DB.Model(&model.Workflow{}).Where("id = ?", workflowID).UpdateColumn("used", gorm.Expr("used + ?", 1))
	}

	return nil
}

// GetWorkflowHistory 获取工作流执行历史
func (s *workflowService) GetWorkflowHistory(workflowID, page, pageSize string) (*WorkflowExecutionListResponse, error) {
	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	if pageInt <= 0 {
		pageInt = 1
	}
	if pageSizeInt <= 0 || pageSizeInt > 100 {
		pageSizeInt = 10
	}

	offset := (pageInt - 1) * pageSizeInt

	var executions []model.WorkflowExecution
	var total int64

	// 查询总数
	if err := global.DB.Model(&model.WorkflowExecution{}).Where("workflow_id = ?", workflowID).Count(&total).Error; err != nil {
		return nil, errors.New("查询执行历史总数失败")
	}

	// 分页查询
	if err := global.DB.Where("workflow_id = ?", workflowID).
		Preload("User").
		Preload("Workflow").
		Preload("Resume").
		Order("created_at DESC").
		Limit(pageSizeInt).
		Offset(offset).
		Find(&executions).Error; err != nil {
		return nil, errors.New("查询执行历史失败")
	}

	var executionInfos []WorkflowExecutionInfo
	for _, execution := range executions {
		// 解析输入输出数据
		var inputs, outputs interface{}
		if len(execution.Inputs) > 0 {
			json.Unmarshal(execution.Inputs, &inputs)
		}
		if len(execution.Outputs) > 0 {
			json.Unmarshal(execution.Outputs, &outputs)
		}

		workflowName := ""
		if execution.Workflow.ID != "" {
			workflowName = execution.Workflow.Name
		}

		resumeName := ""
		if execution.Resume != nil && execution.Resume.ID != "" {
			resumeName = execution.Resume.Name
		}

		executionInfo := WorkflowExecutionInfo{
			ID:            execution.ID,
			WorkflowID:    execution.WorkflowID,
			WorkflowName:  workflowName,
			ResumeID:      execution.ResumeID,
			ResumeName:    resumeName,
			Inputs:        inputs,
			Outputs:       outputs,
			Status:        execution.Status,
			ErrorMessage:  execution.ErrorMessage,
			ExecutionTime: execution.ExecutionTime,
			CreatedAt:     execution.CreatedAt,
		}
		executionInfos = append(executionInfos, executionInfo)
	}

	response := &WorkflowExecutionListResponse{
		List:     executionInfos,
		Total:    total,
		Page:     pageInt,
		PageSize: pageSizeInt,
	}

	return response, nil
}

// GetUserWorkflowHistory 获取用户工作流使用历史
func (s *workflowService) GetUserWorkflowHistory(userID, page, pageSize string) (*WorkflowExecutionListResponse, error) {
	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	if pageInt <= 0 {
		pageInt = 1
	}
	if pageSizeInt <= 0 || pageSizeInt > 100 {
		pageSizeInt = 10
	}

	offset := (pageInt - 1) * pageSizeInt

	var executions []model.WorkflowExecution
	var total int64

	// 查询总数
	if err := global.DB.Model(&model.WorkflowExecution{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, errors.New("查询用户执行历史总数失败")
	}

	// 分页查询
	if err := global.DB.Where("user_id = ?", userID).
		Preload("User").
		Preload("Workflow").
		Preload("Resume").
		Order("created_at DESC").
		Limit(pageSizeInt).
		Offset(offset).
		Find(&executions).Error; err != nil {
		return nil, errors.New("查询用户执行历史失败")
	}

	var executionInfos []WorkflowExecutionInfo
	for _, execution := range executions {
		// 解析输入输出数据
		var inputs, outputs interface{}
		if len(execution.Inputs) > 0 {
			json.Unmarshal(execution.Inputs, &inputs)
		}
		if len(execution.Outputs) > 0 {
			json.Unmarshal(execution.Outputs, &outputs)
		}

		workflowName := ""
		if execution.Workflow.ID != "" {
			workflowName = execution.Workflow.Name
		}

		resumeName := ""
		if execution.Resume != nil && execution.Resume.ID != "" {
			resumeName = execution.Resume.Name
		}

		executionInfo := WorkflowExecutionInfo{
			ID:            execution.ID,
			WorkflowID:    execution.WorkflowID,
			WorkflowName:  workflowName,
			ResumeID:      execution.ResumeID,
			ResumeName:    resumeName,
			Inputs:        inputs,
			Outputs:       outputs,
			Status:        execution.Status,
			ErrorMessage:  execution.ErrorMessage,
			ExecutionTime: execution.ExecutionTime,
			CreatedAt:     execution.CreatedAt,
		}
		executionInfos = append(executionInfos, executionInfo)
	}

	response := &WorkflowExecutionListResponse{
		List:     executionInfos,
		Total:    total,
		Page:     pageInt,
		PageSize: pageSizeInt,
	}

	return response, nil
}

// GetExecutionDetail 获取执行详情
func (s *workflowService) GetExecutionDetail(executionID string) (*WorkflowExecutionDetail, error) {
	var execution model.WorkflowExecution
	if err := global.DB.Where("id = ?", executionID).
		Preload("User").
		Preload("Workflow").
		Preload("Resume").
		First(&execution).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("执行记录不存在")
		}
		return nil, errors.New("查询执行记录失败")
	}

	// 解析输入输出数据
	var inputs, outputs interface{}
	if len(execution.Inputs) > 0 {
		json.Unmarshal(execution.Inputs, &inputs)
	}
	if len(execution.Outputs) > 0 {
		json.Unmarshal(execution.Outputs, &outputs)
	}

	workflowName := ""
	if execution.Workflow.ID != "" {
		workflowName = execution.Workflow.Name
	}

	resumeName := ""
	if execution.Resume != nil && execution.Resume.ID != "" {
		resumeName = execution.Resume.Name
	}

	userName := ""
	if execution.User.ID != "" {
		userName = execution.User.Name
	}

	detail := &WorkflowExecutionDetail{
		ID:            execution.ID,
		WorkflowID:    execution.WorkflowID,
		WorkflowName:  workflowName,
		UserID:        execution.UserID,
		UserName:      userName,
		ResumeID:      execution.ResumeID,
		ResumeName:    resumeName,
		Inputs:        inputs,
		Outputs:       outputs,
		Status:        execution.Status,
		ErrorMessage:  execution.ErrorMessage,
		ExecutionTime: execution.ExecutionTime,
		CreatedAt:     execution.CreatedAt,
	}

	return detail, nil
}

// GetWorkflowStats 获取工作流统计信息
func (s *workflowService) GetWorkflowStats(workflowID string) (*WorkflowStatsResponse, error) {
	var stats WorkflowStatsResponse

	// 统计总执行次数
	if err := global.DB.Model(&model.WorkflowExecution{}).Where("workflow_id = ?", workflowID).Count(&stats.TotalExecutions).Error; err != nil {
		return nil, errors.New("查询总执行次数失败")
	}

	// 统计成功执行次数
	if err := global.DB.Model(&model.WorkflowExecution{}).Where("workflow_id = ? AND status = ?", workflowID, "success").Count(&stats.SuccessExecutions).Error; err != nil {
		return nil, errors.New("查询成功执行次数失败")
	}

	// 统计失败执行次数
	if err := global.DB.Model(&model.WorkflowExecution{}).Where("workflow_id = ? AND status = ?", workflowID, "failed").Count(&stats.FailedExecutions).Error; err != nil {
		return nil, errors.New("查询失败执行次数失败")
	}

	// 计算成功率
	if stats.TotalExecutions > 0 {
		stats.SuccessRate = float64(stats.SuccessExecutions) / float64(stats.TotalExecutions) * 100
	}

	// 计算平均执行时间
	var avgTime float64
	global.DB.Model(&model.WorkflowExecution{}).Where("workflow_id = ? AND status = ?", workflowID, "success").Select("AVG(execution_time)").Scan(&avgTime)
	stats.AvgExecutionTime = int(avgTime)

	// 获取最近执行时间
	var lastExecution model.WorkflowExecution
	if err := global.DB.Where("workflow_id = ?", workflowID).Order("created_at DESC").First(&lastExecution).Error; err == nil {
		stats.LastExecutionAt = &lastExecution.CreatedAt
	}

	return &stats, nil
}
