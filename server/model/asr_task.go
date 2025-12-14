package model

import (
	"time"

	"gorm.io/gorm"
)

// ASRTask ASR识别任务表
type ASRTask struct {
	ID        string         `gorm:"primaryKey;type:varchar(50)" json:"id"`
	CreatedAt time.Time      `gorm:"index:idx_asr_tasks_time" json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID      string `gorm:"type:varchar(20);not null;index:idx_asr_tasks_user" json:"user_id"`
	AudioURL    string `gorm:"type:text;not null" json:"audio_url"`
	AudioFormat string `gorm:"type:varchar(20);not null" json:"audio_format"` // mp3, wav, ogg, raw

	Status       string `gorm:"type:varchar(20);default:'pending';index:idx_asr_tasks_status" json:"status"` // pending, processing, completed, failed
	Progress     int    `gorm:"default:0" json:"progress"`                                                   // 0-100
	ErrorMessage string `gorm:"type:text" json:"error_message,omitempty"`

	Result  string `gorm:"type:jsonb" json:"result,omitempty"`  // JSON recognition result
	Options string `gorm:"type:jsonb" json:"options,omitempty"` // JSON recognition options
}

// TableName 指定表名
func (ASRTask) TableName() string {
	return "asr_tasks"
}

// ASR Task Status Constants
const (
	ASRTaskStatusPending    = "pending"
	ASRTaskStatusProcessing = "processing"
	ASRTaskStatusCompleted  = "completed"
	ASRTaskStatusFailed     = "failed"
)
