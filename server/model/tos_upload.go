package model

import (
	"time"

	"gorm.io/gorm"
)

// TOSUpload TOS上传记录表
type TOSUpload struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time      `gorm:"index:idx_tos_uploads_time" json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID      string `gorm:"type:varchar(20);not null;index:idx_tos_uploads_user" json:"user_id"`
	Key         string `gorm:"type:varchar(500);not null;index:idx_tos_uploads_key" json:"key"`
	Filename    string `gorm:"type:varchar(255);not null" json:"filename"`
	ContentType string `gorm:"type:varchar(100)" json:"content_type"`
	Size        int64  `gorm:"default:0" json:"size"`

	Status       string `gorm:"type:varchar(20);default:'success'" json:"status"`
	ErrorMessage string `gorm:"type:text" json:"error_message,omitempty"`

	Metadata string `gorm:"type:jsonb" json:"metadata,omitempty"` // JSON metadata
}

// TableName 指定表名
func (TOSUpload) TableName() string {
	return "tos_uploads"
}
