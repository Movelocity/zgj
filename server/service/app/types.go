package app

import "time"

// CreateConversationRequest 创建对话请求
type CreateConversationRequest struct {
	Title string `json:"title" binding:"required"`
}

// UpdateConversationRequest 更新对话请求
type UpdateConversationRequest struct {
	Title      string      `json:"title"`
	Messages   interface{} `json:"messages"`
	IsArchived bool        `json:"is_archived"`
}

// CreateWorkflowRequest 创建工作流请求
type CreateWorkflowRequest struct {
	ApiURL      string      `json:"api_url" binding:"required"`
	ApiKey      string      `json:"api_key" binding:"required"`
	Name        string      `json:"name" binding:"required"`
	Description string      `json:"description"`
	Inputs      interface{} `json:"inputs"`
	Outputs     interface{} `json:"outputs"`
	IsPublic    bool        `json:"is_public"`
}

// UpdateWorkflowRequest 更新工作流请求
type UpdateWorkflowRequest struct {
	ApiURL      string      `json:"api_url"`
	ApiKey      string      `json:"api_key"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Inputs      interface{} `json:"inputs"`
	Outputs     interface{} `json:"outputs"`
	Enabled     bool        `json:"enabled"`
	IsPublic    bool        `json:"is_public"`
}

// ExecuteWorkflowRequest 执行工作流请求
type ExecuteWorkflowRequest struct {
	Inputs map[string]interface{} `json:"inputs" binding:"required"`
}

// ConversationResponse 对话响应
type ConversationResponse struct {
	ID         string      `json:"id"`
	Title      string      `json:"title"`
	Messages   interface{} `json:"messages"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
	IsArchived bool        `json:"is_archived"`
}

// WorkflowResponse 工作流响应
type WorkflowResponse struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Inputs      interface{} `json:"inputs"`
	Outputs     interface{} `json:"outputs"`
	Used        int64       `json:"used"`
	IsPublic    bool        `json:"is_public"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// AdminWorkflowResponse 管理员工作流响应（包含所有字段）
type AdminWorkflowResponse struct {
	ID          string      `json:"id"`
	ApiURL      string      `json:"api_url"`
	ApiKey      string      `json:"api_key"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	CreatorID   string      `json:"creator_id"`
	Inputs      interface{} `json:"inputs"`
	Outputs     interface{} `json:"outputs"`
	Used        int64       `json:"used"`
	Enabled     bool        `json:"enabled"`
	IsPublic    bool        `json:"is_public"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// ExecuteWorkflowResponse 执行工作流响应
type ExecuteWorkflowResponse struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data"`
	Message string                 `json:"message"`
}

// WorkflowAPIRequest 工作流API请求结构体
type WorkflowAPIRequest struct {
	Inputs       map[string]interface{} `json:"inputs"`
	ResponseMode string                 `json:"response_mode"`
	User         string                 `json:"user"`
}

// WorkflowAPIResponse 工作流API响应结构体
type WorkflowAPIResponse struct {
	WorkflowRunID string          `json:"workflow_run_id"`
	TaskID        string          `json:"task_id"`
	Data          WorkflowAPIData `json:"data"`
}

// WorkflowAPIData 工作流API响应数据部分
type WorkflowAPIData struct {
	ID          string                 `json:"id"`
	WorkflowID  string                 `json:"workflow_id"`
	Status      string                 `json:"status"`
	Outputs     map[string]interface{} `json:"outputs"`
	Error       string                 `json:"error"`
	ElapsedTime float64                `json:"elapsed_time"`
	TotalTokens int                    `json:"total_tokens"`
	TotalSteps  int                    `json:"total_steps"`
	CreatedAt   int64                  `json:"created_at"`
	FinishedAt  int64                  `json:"finished_at"`
}
