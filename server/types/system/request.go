package system

// GetSystemLogsRequest 获取系统日志请求
type GetSystemLogsRequest struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"page_size" binding:"min=1,max=100"`
	Level    string `form:"level"`
}
