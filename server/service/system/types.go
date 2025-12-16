package system

import "time"

// GetSystemLogsRequest 获取系统日志请求
type GetSystemLogsRequest struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"page_size" binding:"min=1,max=100"`
	Level    string `form:"level"`
}

// SystemStatsResponse 系统统计响应
type SystemStatsResponse struct {
	TotalUsers         int64 `json:"total_users"`
	ActiveUsers        int64 `json:"active_users"`
	TotalConversations int64 `json:"total_conversations"`
	TotalWorkflows     int64 `json:"total_workflows"`
	PublicWorkflows    int64 `json:"public_workflows"`
}

// LogEntry 日志条目
type LogEntry struct {
	Time    time.Time `json:"time"`
	Level   string    `json:"level"`
	Message string    `json:"message"`
	Data    string    `json:"data"`
}

// SystemLogsResponse 系统日志响应
type SystemLogsResponse struct {
	Logs       []LogEntry `json:"logs"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"page_size"`
	TotalPages int        `json:"total_pages"`
}

// DailyStatItem 每日统计数据项
type DailyStatItem struct {
	Date  string `json:"date"`  // 日期 (YYYY-MM-DD)
	Count int64  `json:"count"` // 数量
}

// DailyUserGrowthRequest 每日用户增长请求
type DailyUserGrowthRequest struct {
	StartDate string `form:"start_date"` // 开始日期 (YYYY-MM-DD)
	EndDate   string `form:"end_date"`   // 结束日期 (YYYY-MM-DD)
	Days      int    `form:"days"`       // 最近N天，与start_date/end_date二选一
}

// DailyUserGrowthResponse 每日用户增长响应
type DailyUserGrowthResponse struct {
	Stats      []DailyStatItem `json:"stats"`       // 每日统计数据
	TotalUsers int64           `json:"total_users"` // 当前总用户数
}

// DailyWorkflowUsageRequest 每日工作流使用请求
type DailyWorkflowUsageRequest struct {
	StartDate  string `form:"start_date"`  // 开始日期 (YYYY-MM-DD)
	EndDate    string `form:"end_date"`    // 结束日期 (YYYY-MM-DD)
	Days       int    `form:"days"`        // 最近N天，与start_date/end_date二选一
	WorkflowID string `form:"workflow_id"` // 指定工作流ID，空表示所有工作流
}

// DailyWorkflowUsageResponse 每日工作流使用响应
type DailyWorkflowUsageResponse struct {
	Stats           []DailyStatItem `json:"stats"`            // 每日统计数据
	TotalExecutions int64           `json:"total_executions"` // 总执行次数
	SuccessCount    int64           `json:"success_count"`    // 成功次数
	FailedCount     int64           `json:"failed_count"`     // 失败次数
	SuccessRate     float64         `json:"success_rate"`     // 成功率（%）
}
