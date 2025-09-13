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
