package resume

import "time"

// ResumeInfo 简历基本信息
type ResumeInfo struct {
	ID               string    `json:"id"`
	ResumeNumber     string    `json:"resume_number"`
	Version          int       `json:"version"`
	Name             string    `json:"name"`
	OriginalFilename string    `json:"original_filename"`
	FileID           *string   `json:"file_id"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// ResumeDetailInfo 简历详细信息
type ResumeDetailInfo struct {
	ID               string      `json:"id"`
	ResumeNumber     string      `json:"resume_number"`
	Version          int         `json:"version"`
	Name             string      `json:"name"`
	OriginalFilename string      `json:"original_filename"`
	FileID           *string     `json:"file_id"`
	TextContent      string      `json:"text_content"`
	StructuredData   interface{} `json:"structured_data"`
	PendingContent   interface{} `json:"pending_content"` // 待保存的AI生成内容
	Status           string      `json:"status"`
	CreatedAt        time.Time   `json:"created_at"`
	UpdatedAt        time.Time   `json:"updated_at"`
}

// UpdateResumeRequest 更新简历请求
type UpdateResumeRequest struct {
	Name           string      `json:"name"`
	TextContent    string      `json:"text_content"`
	StructuredData interface{} `json:"structured_data"`
	PendingContent interface{} `json:"pending_content"` // 待保存的AI生成内容
	NewVersion     bool        `json:"new_version"`     // 是否创建新版本而不是覆盖原简历
}

// UploadResumeResponse 上传简历响应
type UploadResumeResponse struct {
	ID           string `json:"id"`
	ResumeNumber string `json:"resume_number"`
	URL          string `json:"url"`
	Filename     string `json:"filename"`
	Size         int64  `json:"size"`
}

// ResumeListResponse 简历列表响应
type ResumeListResponse struct {
	List     []ResumeInfo `json:"list"`
	Total    int64        `json:"total"`
	Page     int          `json:"page"`
	PageSize int          `json:"page_size"`
}

// WorkflowExecutionInfo 工作流执行信息
type WorkflowExecutionInfo struct {
	ID            string      `json:"id"`
	WorkflowID    string      `json:"workflow_id"`
	WorkflowName  string      `json:"workflow_name"`
	ResumeID      string      `json:"resume_id"`
	ResumeName    string      `json:"resume_name"`
	Inputs        interface{} `json:"inputs"`
	Outputs       interface{} `json:"outputs"`
	Status        string      `json:"status"`
	ErrorMessage  string      `json:"error_message"`
	ExecutionTime int         `json:"execution_time"`
	CreatedAt     time.Time   `json:"created_at"`
}

// WorkflowExecutionListResponse 工作流执行历史列表响应
type WorkflowExecutionListResponse struct {
	List     []WorkflowExecutionInfo `json:"list"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"page_size"`
}

// ReorganizeResult 简历版本重整理结果
type ReorganizeResult struct {
	ProcessedUsers   int      `json:"processed_users"`   // 处理的用户数
	ProcessedResumes int      `json:"processed_resumes"` // 处理的简历数
	UpdatedVersions  int      `json:"updated_versions"`  // 更新的版本号数量
	Errors           []string `json:"errors"`            // 错误信息列表
}

// SavePendingContentRequest 保存待处理内容请求
type SavePendingContentRequest struct {
	PendingContent interface{} `json:"pending_content" binding:"required"` // 待保存的AI生成内容
}
