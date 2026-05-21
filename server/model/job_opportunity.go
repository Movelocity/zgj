package model

import "time"

const (
	JobOpportunityStatusDraft     = "draft"
	JobOpportunityStatusPublished = "published"
	JobOpportunityStatusArchived  = "archived"
)

// JobOpportunity 实习/岗位机会表
type JobOpportunity struct {
	ID        int64     `json:"id" gorm:"primaryKey;autoIncrement;comment:主键ID"`
	CreatedAt time.Time `json:"created_at" gorm:"comment:创建时间"`
	UpdatedAt time.Time `json:"updated_at" gorm:"comment:更新时间"`

	Company          string `json:"company" gorm:"type:varchar(100);index:idx_job_opportunities_company;not null;comment:企业名称"`
	Title            string `json:"title" gorm:"type:varchar(200);not null;comment:岗位标题"`
	Category         string `json:"category" gorm:"type:varchar(120);index:idx_job_opportunities_category;not null;comment:方向类别"`
	Location         string `json:"location" gorm:"type:varchar(120);default:'';comment:地点"`
	Cadence          string `json:"cadence" gorm:"type:varchar(300);default:'';comment:到岗要求/实习周期"`
	Summary          string `json:"summary" gorm:"type:text;comment:岗位简介"`
	Responsibilities JSON   `json:"responsibilities" gorm:"type:jsonb;comment:岗位职责列表"`
	Requirements     JSON   `json:"requirements" gorm:"type:jsonb;comment:任职要求列表"`
	ContactEmail     string `json:"contact_email" gorm:"type:varchar(200);index:idx_job_opportunities_contact_email;not null;comment:投递邮箱"`
	Note             string `json:"note" gorm:"type:text;comment:备注"`
	Status           string `json:"status" gorm:"type:varchar(20);index:idx_job_opportunities_status;default:'published';comment:状态：draft/published/archived"`
	SortOrder        int    `json:"sort_order" gorm:"default:0;index:idx_job_opportunities_sort;comment:排序"`
	CreatedBy        string `json:"created_by" gorm:"type:varchar(20);default:'';comment:创建人用户ID"`
}

// TableName 指定表名
func (JobOpportunity) TableName() string {
	return "job_opportunities"
}
