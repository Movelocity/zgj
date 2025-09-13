package app

import "time"

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

// ExecuteWorkflowResponse 执行工作流响应
type ExecuteWorkflowResponse struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data"`
	Message string                 `json:"message"`
}
