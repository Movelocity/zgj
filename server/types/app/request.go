package app

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
	IsPublic    bool        `json:"is_public"`
}

// ExecuteWorkflowRequest 执行工作流请求
type ExecuteWorkflowRequest struct {
	Inputs map[string]interface{} `json:"inputs" binding:"required"`
}
