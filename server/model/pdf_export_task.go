package model

import "time"

// PdfExportTask 状态常量
const (
	PdfExportStatusPending    = "pending"
	PdfExportStatusProcessing = "processing"
	PdfExportStatusCompleted  = "completed"
	PdfExportStatusFailed     = "failed"
)

// PdfExportTask PDF导出任务模型
type PdfExportTask struct {
	ID           string     `gorm:"primaryKey;type:varchar(20)" json:"id"`
	UserID       string     `gorm:"type:varchar(20);not null" json:"user_id"`
	ResumeID     string     `gorm:"type:varchar(20);not null" json:"resume_id"`
	Status       string     `gorm:"size:20;default:'pending'" json:"status"` // pending/processing/completed/failed
	Token        string     `gorm:"type:varchar(64);index" json:"token"`      // 一次性验证token
	TokenUsed    bool       `gorm:"default:false" json:"token_used"`          // token是否已使用
	PdfFilePath  string     `gorm:"size:512" json:"pdf_file_path"`
	ErrorMessage string     `gorm:"type:text" json:"error_message"`
	CreatedAt    time.Time  `json:"created_at"`
	CompletedAt  *time.Time `json:"completed_at"`
}

// TableName 指定表名
func (PdfExportTask) TableName() string {
	return "pdf_export_tasks"
}

