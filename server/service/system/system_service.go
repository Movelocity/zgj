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
