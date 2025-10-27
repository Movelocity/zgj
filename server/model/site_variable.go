package model

import (
	"time"
)

// SiteVariable 网站变量表
type SiteVariable struct {
	ID          int64     `json:"id" gorm:"primaryKey;autoIncrement;comment:主键ID"`
	CreatedAt   time.Time `json:"created_at" gorm:"comment:创建时间"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"comment:更新时间"`
	Key         string    `json:"key" gorm:"type:varchar(100);uniqueIndex:idx_key;not null;comment:变量键名"`
	Value       string    `json:"value" gorm:"type:text;comment:变量值"`
	Description string    `json:"description" gorm:"type:varchar(500);default:'';comment:变量描述"`
}

// TableName 指定表名
func (SiteVariable) TableName() string {
	return "site_variables"
}
