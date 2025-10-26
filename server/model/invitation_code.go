package model

import (
	"time"
)

// InvitationCode 邀请码表
type InvitationCode struct {
	ID        int64      `json:"id" gorm:"primaryKey;autoIncrement;comment:主键ID"`
	Code      string     `json:"code" gorm:"type:varchar(32);uniqueIndex:idx_code;not null;comment:邀请码"`
	CreatorID string     `json:"creator_id" gorm:"type:varchar(20);index:idx_creator;not null;comment:创建者用户ID"`
	MaxUses   int        `json:"max_uses" gorm:"default:1;comment:最大使用次数，-1表示无限次"`
	UsedCount int        `json:"used_count" gorm:"default:0;comment:已使用次数"`
	ExpiresAt *time.Time `json:"expires_at" gorm:"index:idx_expires;comment:过期时间（NULL表示永不过期）"`
	CreatedAt time.Time  `json:"created_at" gorm:"comment:创建时间"`
	IsActive  bool       `json:"is_active" gorm:"default:true;comment:是否激活"`
	Note      string     `json:"note" gorm:"type:varchar(200);default:'';comment:备注"`

	// 关联创建者
	Creator User `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
}

// TableName 指定表名
func (InvitationCode) TableName() string {
	return "invitation_codes"
}

// IsValid 检查邀请码是否有效
func (ic *InvitationCode) IsValid() bool {
	// 检查是否激活
	if !ic.IsActive {
		return false
	}

	// 检查是否过期
	if ic.ExpiresAt != nil && time.Now().After(*ic.ExpiresAt) {
		return false
	}

	// 检查使用次数（-1表示无限次）
	if ic.MaxUses != -1 && ic.UsedCount >= ic.MaxUses {
		return false
	}

	return true
}
