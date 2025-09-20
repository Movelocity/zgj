package model

import (
	"time"
)

// File 统一文件表
type File struct {
	ID           string    `json:"id" gorm:"primaryKey;type:varchar(20);comment:文件ID(TLID)"`
	DifyID       string    `json:"dify_id" gorm:"type:varchar(20);comment:Dify文件ID"`
	OriginalName string    `json:"original_name" gorm:"type:varchar(255);not null;comment:原始文件名"`
	Extension    string    `json:"extension" gorm:"type:varchar(10);not null;comment:文件扩展名"`
	MimeType     string    `json:"mime_type" gorm:"type:varchar(100);not null;comment:MIME类型"`
	Size         int64     `json:"size" gorm:"not null;comment:文件大小(字节)"`
	CreatedBy    string    `json:"created_by" gorm:"type:varchar(20);not null;comment:上传用户ID"`
	CreatedAt    time.Time `json:"created_at" gorm:"comment:创建时间"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"comment:更新时间"`

	// 关联用户
	User User `json:"user,omitempty" gorm:"foreignKey:CreatedBy"`
}

// TableName 指定表名
func (File) TableName() string {
	return "files"
}

// GetStoragePath 根据文件ID获取存储路径
func (f *File) GetStoragePath() string {
	if len(f.ID) < 6 {
		return f.ID
	}
	// 使用ID前3位作为文件夹
	return f.ID[:6] + "/" + f.ID + "." + f.Extension
}

// GetFileName 获取完整文件名
func (f *File) GetFileName() string {
	return f.ID + "." + f.Extension
}
