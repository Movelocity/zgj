package file

import (
	"time"
)

// UploadFileRequest 上传文件请求
type UploadFileRequest struct {
	UserID string `json:"user" binding:"required"`
}

// UploadFileResponse 上传文件响应
type UploadFileResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Size      int64     `json:"size"`
	Extension string    `json:"extension"`
	MimeType  string    `json:"mime_type"`
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

// FileStatsResponse 文件统计响应
type FileStatsResponse struct {
	TotalFiles   int64  `json:"total_files"`
	TotalResumes int64  `json:"total_resumes"`
	TotalAvatars int64  `json:"total_avatars"`
	TotalSize    int64  `json:"total_size"`
	StoragePath  string `json:"storage_path"`
	StorageUsed  int64  `json:"storage_used"`
}

// FileListResponse 文件列表响应
type FileListResponse struct {
	List     []FileInfo `json:"list"`
	Total    int64      `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
}

// FileInfo 文件信息
type FileInfo struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	OriginalName string    `json:"original_name"`
	Path         string    `json:"path"`
	Size         int64     `json:"size"`
	Type         string    `json:"type"`
	MimeType     string    `json:"mime_type"`
	UserID       string    `json:"user_id"`
	UserName     string    `json:"user_name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// BatchDeleteRequest 批量删除请求
type BatchDeleteRequest struct {
	FileIDs []string `json:"file_ids" binding:"required"`
}
