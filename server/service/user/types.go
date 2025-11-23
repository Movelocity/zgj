package user

import "time"

// RegisterRequest 用户注册请求
type RegisterRequest struct {
	Phone           string `json:"phone" binding:"required"`
	SmsCode         string `json:"sms_code" binding:"required"`
	InvitationCode  string `json:"invitation_code"`  // 邀请码选填
	Name            string `json:"name"`             // 可选，用户名
	Password        string `json:"password"`         // 可选，密码
	ConfirmPassword string `json:"confirm_password"` // 可选，确认密码
}

// LoginRequest 用户登录请求
type LoginRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// SendSMSRequest 发送短信验证码请求
type SendSMSRequest struct {
	Phone string `json:"phone" binding:"required"`
}

// VerifySMSRequest 验证短信验证码请求
type VerifySMSRequest struct {
	Phone   string `json:"phone" binding:"required"`
	SmsCode string `json:"sms_code" binding:"required"`
}

// ResetPasswordRequest 重置密码请求
type ResetPasswordRequest struct {
	Phone       string `json:"phone" binding:"required"`
	SmsCode     string `json:"sms_code" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// UpdateUserProfileRequest 更新用户信息请求
type UpdateUserProfileRequest struct {
	Name      string      `json:"name"`
	Email     string      `json:"email"`
	HeaderImg string      `json:"header_img"`
	Data      interface{} `json:"data"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	User      UserInfo  `json:"user"`
	Message   string    `json:"message,omitempty"` // 可选，用于特殊提示信息
}

// UserInfo 用户信息
type UserInfo struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	HeaderImg string    `json:"header_img"`
	Role      int       `json:"role"`
	Active    bool      `json:"active"`
	LastLogin time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
}

// UserProfileResponse 用户档案响应
type UserProfileResponse struct {
	User    UserInfo    `json:"user"`
	Data    interface{} `json:"data"`
	Resumes interface{} `json:"resumes"`
}

// UploadResponse 上传响应
type UploadResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
}

// UnifiedAuthRequest 统一认证请求
type UnifiedAuthRequest struct {
	Phone   string `json:"phone" binding:"required"`
	SmsCode string `json:"sms_code" binding:"required"`
	Name    string `json:"name"` // 可选，首次注册时使用
}

// UnifiedAuthResponse 统一认证响应
type UnifiedAuthResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	User      UserInfo  `json:"user"`
	IsNewUser bool      `json:"is_new_user"` // 标识是否为新注册用户
}

// UserListResponse 用户列表响应
type UserListResponse struct {
	List     []UserInfo `json:"list"`
	Total    int64      `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
}

// UpdateUserRoleRequest 更新用户角色请求
type UpdateUserRoleRequest struct {
	Role int `json:"role" binding:"required,oneof=666 888"`
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// AdminChangePasswordRequest 管理员修改用户密码请求
type AdminChangePasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6"`
}
