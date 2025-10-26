package invitation

import "time"

// CreateInvitationRequest 创建邀请码请求
type CreateInvitationRequest struct {
	MaxUses       int    `json:"max_uses" binding:"required,min=-1"`
	ExpiresInDays *int   `json:"expires_in_days"`
	Note          string `json:"note"`
}

// InvitationCodeResponse 邀请码响应
type InvitationCodeResponse struct {
	Code      string     `json:"code"`
	ExpiresAt *time.Time `json:"expires_at"`
	MaxUses   int        `json:"max_uses"`
	UsedCount int        `json:"used_count"`
	CreatedAt time.Time  `json:"created_at"`
	IsActive  bool       `json:"is_active"`
	Note      string     `json:"note"`
	Creator   string     `json:"creator,omitempty"`
}

// ValidateInvitationRequest 验证邀请码请求
type ValidateInvitationRequest struct {
	Code string `json:"code" binding:"required"`
}

// ValidateInvitationResponse 验证邀请码响应
type ValidateInvitationResponse struct {
	IsValid   bool       `json:"is_valid"`
	MaxUses   int        `json:"max_uses"`
	UsedCount int        `json:"used_count"`
	ExpiresAt *time.Time `json:"expires_at"`
	Message   string     `json:"message,omitempty"`
}

// UseInvitationRequest 使用邀请码请求
type UseInvitationRequest struct {
	Code      string `json:"code" binding:"required"`
	UserID    string `json:"user_id" binding:"required"`
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`
}

// InvitationListResponse 邀请码列表响应
type InvitationListResponse struct {
	Data  []InvitationCodeResponse `json:"data"`
	Total int64                    `json:"total"`
	Page  int                      `json:"page"`
	Limit int                      `json:"limit"`
}
