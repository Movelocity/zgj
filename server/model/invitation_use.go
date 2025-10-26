package model

import (
	"time"
)

// InvitationUse 邀请码使用记录表
type InvitationUse struct {
	ID             int64     `json:"id" gorm:"primaryKey;autoIncrement;comment:主键ID"`
	InvitationCode string    `json:"invitation_code" gorm:"type:varchar(32);index:idx_invitation_code;not null;comment:使用的邀请码"`
	UsedBy         string    `json:"used_by" gorm:"type:varchar(20);index:idx_used_by;uniqueIndex:uk_user_invitation,composite:invitation_code;not null;comment:使用者用户ID"`
	UsedAt         time.Time `json:"used_at" gorm:"comment:使用时间"`
	IPAddress      string    `json:"ip_address" gorm:"type:varchar(45);default:'';comment:使用时的IP"`
	UserAgent      string    `json:"user_agent" gorm:"type:text;comment:用户代理信息"`

	// 关联用户
	User User `json:"user,omitempty" gorm:"foreignKey:UsedBy"`
}

// TableName 指定表名
func (InvitationUse) TableName() string {
	return "invitation_uses"
}
