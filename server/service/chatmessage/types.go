package chatmessage

import "time"

// CreateChatMessageRequest 创建聊天消息请求
type CreateChatMessageRequest struct {
	ResumeID   string      `json:"resume_id" binding:"required"`
	SenderName string      `json:"sender_name" binding:"required"`
	Message    interface{} `json:"message" binding:"required"` // {content: string} 或未来扩展的其他格式
}

// GetChatMessagesRequest 获取聊天消息列表请求
type GetChatMessagesRequest struct {
	ResumeID   string `form:"resume_id" binding:"required"`
	Page       int    `form:"page" binding:"omitempty,min=1"`
	PageSize   int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	BeforeTime string `form:"before_time"` // 获取此时间之前的消息，用于上滑加载
}

// ChatMessageResponse 聊天消息响应
type ChatMessageResponse struct {
	ID         string      `json:"id"`
	ResumeID   string      `json:"resume_id"`
	UserID     string      `json:"user_id"`
	SenderName string      `json:"sender_name"`
	Message    interface{} `json:"message"`
	CreatedAt  time.Time   `json:"created_at"`
}

// ChatMessagesListResponse 聊天消息列表响应
type ChatMessagesListResponse struct {
	Messages []ChatMessageResponse `json:"messages"`
	Total    int64                 `json:"total"`
	Page     int                   `json:"page"`
	PageSize int                   `json:"page_size"`
	HasMore  bool                  `json:"has_more"` // 是否还有更多消息
}
