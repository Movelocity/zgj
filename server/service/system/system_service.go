package system

import (
	"errors"
	"math"
	"time"

	"server/global"
	"server/model"
)

type systemService struct{}

var SystemService = &systemService{}

// GetSystemStats 获取系统统计
func (s *systemService) GetSystemStats() (*SystemStatsResponse, error) {
	var stats SystemStatsResponse

	// 统计总用户数
	if err := global.DB.Model(&model.User{}).Count(&stats.TotalUsers).Error; err != nil {
		return nil, errors.New("查询用户统计失败")
	}

	// 统计活跃用户数
	if err := global.DB.Model(&model.User{}).Where("active = ?", true).Count(&stats.ActiveUsers).Error; err != nil {
		return nil, errors.New("查询活跃用户统计失败")
	}

	// 统计总对话数
	if err := global.DB.Model(&model.Conversation{}).Count(&stats.TotalConversations).Error; err != nil {
		return nil, errors.New("查询对话统计失败")
	}

	// 统计总工作流数
	if err := global.DB.Model(&model.Workflow{}).Count(&stats.TotalWorkflows).Error; err != nil {
		return nil, errors.New("查询工作流统计失败")
	}

	// 统计公开工作流数
	if err := global.DB.Model(&model.Workflow{}).Where("is_public = ?", true).Count(&stats.PublicWorkflows).Error; err != nil {
		return nil, errors.New("查询公开工作流统计失败")
	}

	return &stats, nil
}

// GetDailyUserGrowth 获取每日用户增长统计
func (s *systemService) GetDailyUserGrowth(req DailyUserGrowthRequest) (*DailyUserGrowthResponse, error) {
	var startDate, endDate time.Time
	var err error

	// 解析日期参数
	if req.Days > 0 {
		// 使用最近N天
		endDate = time.Now()
		startDate = endDate.AddDate(0, 0, -req.Days)
	} else if req.StartDate != "" && req.EndDate != "" {
		// 使用指定日期范围
		startDate, err = time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			return nil, errors.New("开始日期格式错误")
		}
		endDate, err = time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return nil, errors.New("结束日期格式错误")
		}
		// 设置为当天的结束时间
		endDate = endDate.Add(24*time.Hour - time.Second)
	} else {
		// 默认最近30天
		endDate = time.Now()
		startDate = endDate.AddDate(0, 0, -30)
	}

	// 查询每日用户增长
	var dailyStats []DailyStatItem
	err = global.DB.Model(&model.User{}).
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&dailyStats).Error

	if err != nil {
		return nil, errors.New("查询每日用户增长失败")
	}

	// 查询总用户数
	var totalUsers int64
	if err := global.DB.Model(&model.User{}).Count(&totalUsers).Error; err != nil {
		return nil, errors.New("查询总用户数失败")
	}

	return &DailyUserGrowthResponse{
		Stats:      dailyStats,
		TotalUsers: totalUsers,
	}, nil
}

// GetDailyWorkflowUsage 获取每日工作流使用统计
func (s *systemService) GetDailyWorkflowUsage(req DailyWorkflowUsageRequest) (*DailyWorkflowUsageResponse, error) {
	var startDate, endDate time.Time
	var err error

	// 解析日期参数
	if req.Days > 0 {
		// 使用最近N天
		endDate = time.Now()
		startDate = endDate.AddDate(0, 0, -req.Days)
	} else if req.StartDate != "" && req.EndDate != "" {
		// 使用指定日期范围
		startDate, err = time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			return nil, errors.New("开始日期格式错误")
		}
		endDate, err = time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return nil, errors.New("结束日期格式错误")
		}
		// 设置为当天的结束时间
		endDate = endDate.Add(24*time.Hour - time.Second)
	} else {
		// 默认最近30天
		endDate = time.Now()
		startDate = endDate.AddDate(0, 0, -30)
	}

	// 构建查询
	query := global.DB.Model(&model.WorkflowExecution{}).
		Where("created_at >= ? AND created_at <= ?", startDate, endDate)

	// 如果指定了工作流ID，添加过滤条件
	if req.WorkflowID != "" {
		query = query.Where("workflow_id = ?", req.WorkflowID)
	}

	// 查询每日执行次数
	var dailyStats []DailyStatItem
	err = query.Select("DATE(created_at) as date, COUNT(*) as count").
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&dailyStats).Error

	if err != nil {
		return nil, errors.New("查询每日工作流使用失败")
	}

	// 统计总执行次数
	var totalExecutions int64
	statQuery := global.DB.Model(&model.WorkflowExecution{}).Where("created_at >= ? AND created_at <= ?", startDate, endDate)
	if req.WorkflowID != "" {
		statQuery = statQuery.Where("workflow_id = ?", req.WorkflowID)
	}
	if err := statQuery.Count(&totalExecutions).Error; err != nil {
		return nil, errors.New("查询总执行次数失败")
	}

	// 统计成功次数
	var successCount int64
	successQuery := global.DB.Model(&model.WorkflowExecution{}).
		Where("created_at >= ? AND created_at <= ? AND status = ?", startDate, endDate, "success")
	if req.WorkflowID != "" {
		successQuery = successQuery.Where("workflow_id = ?", req.WorkflowID)
	}
	if err := successQuery.Count(&successCount).Error; err != nil {
		return nil, errors.New("查询成功次数失败")
	}

	// 统计失败次数
	var failedCount int64
	failedQuery := global.DB.Model(&model.WorkflowExecution{}).
		Where("created_at >= ? AND created_at <= ? AND status = ?", startDate, endDate, "failed")
	if req.WorkflowID != "" {
		failedQuery = failedQuery.Where("workflow_id = ?", req.WorkflowID)
	}
	if err := failedQuery.Count(&failedCount).Error; err != nil {
		return nil, errors.New("查询失败次数失败")
	}

	// 计算成功率
	var successRate float64
	if totalExecutions > 0 {
		successRate = float64(successCount) / float64(totalExecutions) * 100
		successRate = math.Round(successRate*100) / 100 // 保留99.99格式
	}

	return &DailyWorkflowUsageResponse{
		Stats:           dailyStats,
		TotalExecutions: totalExecutions,
		SuccessCount:    successCount,
		FailedCount:     failedCount,
		SuccessRate:     successRate,
	}, nil
}

// GetSystemLogs 获取系统日志
func (s *systemService) GetSystemLogs(page, pageSize int, level string) (*SystemLogsResponse, error) {
	// 这里应该实现实际的日志查询逻辑
	// 目前返回模拟数据

	// 计算偏移量（暂未使用，为日志查询预留）
	_ = (page - 1) * pageSize

	// 模拟日志数据
	logs := []LogEntry{
		{
			Time:    time.Now(),
			Level:   "INFO",
			Message: "系统启动成功",
			Data:    "{}",
		},
		{
			Time:    time.Now().Add(-time.Hour),
			Level:   "WARN",
			Message: "数据库连接缓慢",
			Data:    "{\"duration\": \"5s\"}",
		},
	}

	// 模拟总数
	total := int64(100)
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	response := &SystemLogsResponse{
		Logs:       logs,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}

	return response, nil
}
