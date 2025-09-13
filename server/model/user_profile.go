package model

import (
	"time"
)

type Resume struct {
	Name      string    `json:"name"`
	URL       string    `json:"url"`
	Size      int64     `json:"size"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserProfile struct {
	ID        string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
	UserID    string    `gorm:"type:varchar(20);uniqueIndex" json:"user_id"`
	Data      JSON      `gorm:"type:jsonb" json:"data"` // 用户画像数据
	Resumes   JSON      `gorm:"type:jsonb" json:"resumes"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
}

// TableName 设置表名
func (UserProfile) TableName() string {
	return "user_profiles"
}
