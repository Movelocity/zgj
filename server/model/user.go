package model

import (
	"time"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	HeaderImg string    `gorm:"size:255" json:"header_img"`
	Phone     string    `gorm:"size:20;not null;index:idx_phone_active,unique,where:active=true" json:"phone"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Email     string    `gorm:"size:100" json:"email"`
	Active    bool      `gorm:"default:false" json:"active"`
	Role      int       `gorm:"default:666" json:"role"` // 888: admin, 666: user
	LastLogin time.Time `json:"last_login"`
}

// TableName 设置表名
func (User) TableName() string {
	return "users"
}
