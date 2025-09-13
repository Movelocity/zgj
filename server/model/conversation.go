package model

import (
	"time"
)

type Message struct {
	Role    string    `json:"role"` // user/assistant
	Content string    `json:"content"`
	Time    time.Time `json:"time"`
}

type Conversation struct {
	ID         string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
	UserID     string    `gorm:"type:varchar(20);index" json:"user_id"`
	Title      string    `gorm:"size:255" json:"title"` // 对话标题
	Messages   JSON      `gorm:"type:jsonb" json:"messages"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	IsArchived bool      `gorm:"default:false" json:"is_archived"`
	User       User      `gorm:"foreignKey:UserID" json:"-"`
}

// TableName 设置表名
func (Conversation) TableName() string {
	return "conversations"
}
