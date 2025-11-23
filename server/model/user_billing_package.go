package model

import (
	"time"
)

// UserBillingPackage 用户套餐表
type UserBillingPackage struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	UserID           string `gorm:"size:20;not null;index:idx_user_billing_packages_user" json:"user_id"`
	BillingPackageID int64  `gorm:"not null;index:idx_user_billing_packages_package" json:"billing_package_id"`
	
	PackageName string `gorm:"size:100;not null" json:"package_name"`
	PackageType string `gorm:"size:20;not null" json:"package_type"`
	
	TotalCredits     int `gorm:"not null" json:"total_credits"`
	UsedCredits      int `gorm:"default:0" json:"used_credits"`
	RemainingCredits int `gorm:"not null" json:"remaining_credits"`
	
	ActivatedAt *time.Time `json:"activated_at"`
	ExpiresAt   *time.Time `gorm:"index:idx_user_billing_packages_expires" json:"expires_at"`
	
	Status   string `gorm:"size:20;default:'pending';index:idx_user_billing_packages_user" json:"status"` // pending/active/expired/depleted
	Priority int    `gorm:"default:0;index:idx_user_billing_packages_user" json:"priority"`
	
	Source  string  `gorm:"size:50;default:'purchase'" json:"source"` // purchase/gift/promotion/system
	OrderID *string `gorm:"size:50" json:"order_id,omitempty"`
	
	Notes string `gorm:"type:text" json:"notes,omitempty"`
}

// TableName 设置表名
func (UserBillingPackage) TableName() string {
	return "user_billing_packages"
}

// IsValid 检查套餐是否有效
func (ubp *UserBillingPackage) IsValid() bool {
	if ubp.Status != "active" {
		return false
	}
	if ubp.RemainingCredits <= 0 {
		return false
	}
	if ubp.ExpiresAt != nil && ubp.ExpiresAt.Before(time.Now()) {
		return false
	}
	return true
}

// IsExpired 检查套餐是否过期
func (ubp *UserBillingPackage) IsExpired() bool {
	if ubp.ExpiresAt == nil {
		return false // 永久套餐不过期
	}
	return ubp.ExpiresAt.Before(time.Now())
}

