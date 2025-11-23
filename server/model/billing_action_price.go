package model

import (
	"time"
)

// BillingActionPrice 动作计价表
type BillingActionPrice struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	ActionKey   string `gorm:"size:50;not null;uniqueIndex" json:"action_key"`
	ActionName  string `gorm:"size:100;not null" json:"action_name"`
	Description string `gorm:"type:text" json:"description"`

	CreditsCost int `gorm:"not null;default:1" json:"credits_cost"`

	IsActive  bool `gorm:"default:true" json:"is_active"`
	SortOrder int  `gorm:"default:0" json:"sort_order"`

	Metadata JSON `gorm:"type:jsonb" json:"metadata,omitempty"`
}

// TableName 设置表名
func (BillingActionPrice) TableName() string {
	return "billing_action_prices"
}
