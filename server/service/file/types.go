package file

import "time"

// FileStatsResponse 文件统计响应
type FileStatsResponse struct {
	TotalResumes int64  `json:"total_resumes"` // 简历文件总数
	TotalAvatars int64  `json:"total_avatars"` // 头像文件总数
	TotalSize    int64  `json:"total_size"`    // 文件总大小（字节）
	StoragePath  string `json:"storage_path"`  // 存储路径
	StorageUsed  int64  `json:"storage_used"`  // 已使用存储空间（字节）
}

// FileInfo 文件信息
type FileInfo struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	OriginalName string    `json:"original_name"`
	Path         string    `json:"path"`
	Size         int64     `json:"size"`
	Type         string    `json:"type"` // resume, avatar, etc.
	MimeType     string    `json:"mime_type"`
	UserID       string    `json:"user_id"`
	UserName     string    `json:"user_name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// FileListResponse 文件列表响应
type FileListResponse struct {
	List     []FileInfo `json:"list"`
	Total    int64      `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
}

// BatchDeleteRequest 批量删除请求
type BatchDeleteRequest struct {
	FileIDs  []string `json:"file_ids" binding:"required"`
	FileType string   `json:"file_type" binding:"required"`
}
