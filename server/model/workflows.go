package model

import (
	"time"
)

type Field struct {
	FieldName string `json:"field_name"`
	FieldType string `json:"field_type"` // string/number/boolean/file
	Required  bool   `json:"required"`
}

type Workflow struct {
	ID          string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
	ApiURL      string    `gorm:"size:500;not null" json:"api_url"`
	ApiKey      string    `gorm:"size:255;not null" json:"api_key"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"size:500" json:"description"`
	CreatorID   string    `gorm:"type:varchar(20);index" json:"creator_id"`
	Inputs      JSON      `gorm:"type:jsonb" json:"inputs"`
	Outputs     JSON      `gorm:"type:jsonb" json:"outputs"`
	Used        int64     `gorm:"default:0" json:"used"`
	IsPublic    bool      `gorm:"default:false" json:"is_public"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Creator     User      `gorm:"foreignKey:CreatorID" json:"-"`
}

// TableName 设置表名
func (Workflow) TableName() string {
	return "workflows"
}
