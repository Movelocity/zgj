package model

import (
	"time"
)

// BillingPackage 套餐定义表
type BillingPackage struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Name        string `gorm:"size:100;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	PackageType string `gorm:"size:20;not null" json:"package_type"` // duration/credits/hybrid/permanent

	Price         float64 `gorm:"type:decimal(10,2);not null;default:0" json:"price"`
	OriginalPrice float64 `gorm:"type:decimal(10,2)" json:"original_price"`

	CreditsAmount int `gorm:"not null" json:"credits_amount"`
	ValidityDays  int `gorm:"default:0" json:"validity_days"` // 0=permanent

	IsActive  bool `gorm:"default:true" json:"is_active"`
	IsVisible bool `gorm:"default:true" json:"is_visible"`
	SortOrder int  `gorm:"default:0" json:"sort_order"`

	Metadata JSON `gorm:"type:jsonb" json:"metadata,omitempty"`
}

// TableName 设置表名
func (BillingPackage) TableName() string {
	return "billing_packages"
}
