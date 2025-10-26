package invitation

import "time"

// CreateInvitationRequest 创建邀请码请求
type CreateInvitationRequest struct {
	MaxUses       int    `json:"max_uses" binding:"required,min=-1"`
	ExpiresInDays *int   `json:"expires_in_days"`
	Note          string `json:"note"`
}

// AdminCreateInvitationRequest 管理员创建邀请码请求（可指定创建者）
type AdminCreateInvitationRequest struct {
	CreatorID     string `json:"creator_id" binding:"required"` // 指定创建者用户ID
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
	CreatorID string     `json:"creator_id,omitempty"` // 创建者ID
	Creator   string     `json:"creator,omitempty"`    // 创建者名称
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

// BatchUpdateInvitationRequest 批量更新邀请码请求
type BatchUpdateInvitationRequest struct {
	Codes         []string `json:"codes" binding:"required,min=1"` // 要更新的邀请码列表
	MaxUses       *int     `json:"max_uses"`                       // 使用次数上限（-1表示无限次，null表示不更新）
	ExpiresInDays *int     `json:"expires_in_days"`                // 有效期（天数，null表示不更新，0表示设为永不过期）
}

// UpdateInvitationRequest 更新单个邀请码请求
type UpdateInvitationRequest struct {
	MaxUses       *int    `json:"max_uses"`        // 使用次数上限（-1表示无限次，null表示不更新）
	ExpiresInDays *int    `json:"expires_in_days"` // 有效期（天数，null表示不更新，0表示设为永不过期）
	Note          *string `json:"note"`            // 备注（null表示不更新）
}

// UserInvitationUseResponse 用户邀请码使用记录响应
type UserInvitationUseResponse struct {
	HasUsed        bool       `json:"has_used"`                  // 是否已使用过邀请码
	InvitationCode string     `json:"invitation_code,omitempty"` // 使用的邀请码
	UsedAt         *time.Time `json:"used_at,omitempty"`         // 使用时间
}
