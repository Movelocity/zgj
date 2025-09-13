package user

// RegisterRequest 用户注册请求
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	SmsCode  string `json:"sms_code" binding:"required"`
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
