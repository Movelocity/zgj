package model

import (
	"time"
)

// ResumeRecord 独立的简历记录表
type ResumeRecord struct {
	ID               string    `gorm:"primaryKey;type:varchar(20)" json:"id"`          // TLID
	UserID           string    `gorm:"type:varchar(20);index;not null" json:"user_id"` // 所属用户
	ResumeNumber     string    `gorm:"size:50;not null;index" json:"resume_number"`    // 简历编号
	Version          int       `gorm:"default:1" json:"version"`                       // 版本号
	Name             string    `gorm:"size:255;not null" json:"name"`                  // 简历名称
	OriginalFilename string    `gorm:"size:255" json:"original_filename"`              // 原始文件名
	FileID           *string   `gorm:"type:varchar(20);index" json:"file_id"`          // 关联文件ID，引用files表，可为空（纯文本简历）
	TextContent      string    `gorm:"type:text" json:"text_content"`                  // 纯文本内容
	StructuredData   JSON      `gorm:"type:jsonb" json:"structured_data"`              // 结构化数据
	PendingContent   JSON      `gorm:"type:jsonb" json:"pending_content"`              // 待保存的AI生成内容（未接收时临时存储）
	Metadata         JSON      `gorm:"type:jsonb" json:"metadata"`                     //（新增）元数据，记录各种页面状态信息，如修改频次，当前核心任务类型，归档任务等
	PortraitImg      string    `gorm:"size:512" json:"portrait_img"`                   // 证件照URL
	Status           string    `gorm:"size:20;default:'active'" json:"status"`         // 状态 (active/deleted)
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	User             User      `gorm:"foreignKey:UserID" json:"-"`
	File             *File     `gorm:"foreignKey:FileID" json:"-"` // 关联文件表
}

// TableName 设置表名
func (ResumeRecord) TableName() string {
	return "resume_records"
}

// WorkflowExecution 工作流执行历史表
type WorkflowExecution struct {
	ID            string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
	WorkflowID    string    `gorm:"type:varchar(20);index;not null" json:"workflow_id"`
	UserID        string    `gorm:"type:varchar(20);index;not null" json:"user_id"`
	Inputs        JSON      `gorm:"type:jsonb" json:"inputs"`       // 输入参数
	Outputs       JSON      `gorm:"type:jsonb" json:"outputs"`      // 输出结果
	Status        string    `gorm:"size:20" json:"status"`          // 执行状态 (running/success/failed)
	ErrorMessage  string    `gorm:"type:text" json:"error_message"` // 错误信息
	ExecutionTime int       `json:"execution_time"`                 // 执行时间(ms)
	CreatedAt     time.Time `json:"created_at"`
	User          User      `gorm:"foreignKey:UserID" json:"-"`
	Workflow      Workflow  `gorm:"foreignKey:WorkflowID" json:"-"`
	// Resume        *ResumeRecord `gorm:"foreignKey:ResumeID" json:"-"` // 移除外键约束，避免空字符串违反约束
}

// TableName 设置表名
func (WorkflowExecution) TableName() string {
	return "workflow_executions"
}
