package model

import (
	"time"
)

// MessageContent 消息内容结构
type MessageContent struct {
	Content string `json:"content"` // 文本消息内容
	// 未来可扩展：
	// FileID  string `json:"file_id,omitempty"`  // 文件消息ID
	// ImageID string `json:"image_id,omitempty"` // 图片消息ID
}

// ChatMessage 聊天消息模型
type ChatMessage struct {
	ID         string       `gorm:"primaryKey;type:varchar(20)" json:"id"`
	ResumeID   string       `gorm:"type:varchar(20);index" json:"resume_id"` // 简历ID
	UserID     string       `gorm:"type:varchar(20);index" json:"user_id"`   // 用户ID
	SenderName string       `gorm:"size:100" json:"sender_name"`             // 发送者名称
	Message    JSON         `gorm:"type:jsonb" json:"message"`               // 消息内容（JSON格式）
	CreatedAt  time.Time    `gorm:"index" json:"created_at"`                 // 创建时间，用于排序和分页
	Resume     ResumeRecord `gorm:"foreignKey:ResumeID" json:"-"`            // 关联简历
	User       User         `gorm:"foreignKey:UserID" json:"-"`              // 关联用户
}

// TableName 设置表名
func (ChatMessage) TableName() string {
	return "chat_messages"
}
