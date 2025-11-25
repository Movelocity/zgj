package eventlog

import "time"

// 事件分类
const (
	CategoryAuth    = "auth"    // 认证相关
	CategoryUser    = "user"    // 用户操作
	CategoryResume  = "resume"  // 简历操作
	CategoryPayment = "payment" // 付费相关
	CategorySystem  = "system"  // 系统事件
)

// 事件类型
const (
	// 认证相关 (auth)
	EventSMSSent        = "sms_sent"        // 发送验证码
	EventUserRegister   = "user_register"   // 用户注册
	EventUserLogin      = "user_login"      // 用户登录
	EventLoginFailed    = "login_failed"    // 登录失败
	EventPasswordReset  = "password_reset"  // 密码重置
	EventPasswordChange = "password_change" // 密码修改
	EventUserLogout     = "user_logout"     // 退出登录

	// 用户操作 (user)
	EventProfileUpdate = "profile_update" // 修改资料
	EventAvatarUpload  = "avatar_upload"  // 上传头像

	// 简历操作 (resume)
	EventResumeUpload   = "resume_upload"   // 上传简历
	EventResumeOptimize = "resume_optimize" // 简历优化
	EventResumeExport   = "resume_export"   // 导出简历

	// 系统事件 (system)
	EventBusinessError    = "business_error"    // 业务错误
	EventSystemError      = "system_error"      // 系统错误
	EventInvitationReward = "invitation_reward" // 邀请奖励

	// 付费相关 (payment) - 预留
	EventOrderCreate    = "order_create"    // 创建订单
	EventPaymentSuccess = "payment_success" // 支付成功
	EventPaymentFailed  = "payment_failed"  // 支付失败
	EventBalanceChange  = "balance_change"  // 余额变动
)

// 事件状态
const (
	StatusSuccess = "success" // 成功
	StatusFailed  = "failed"  // 失败
	StatusError   = "error"   // 错误
)

// QueryRequest 查询请求
type QueryRequest struct {
	Page          int       `form:"page" binding:"omitempty,min=1"`               // 页码（默认1）
	PageSize      int       `form:"page_size" binding:"omitempty,min=1,max=100"`  // 每页条数（默认50，最大100）
	UserID        string    `form:"user_id"`                                      // 用户ID（可选）
	EventType     string    `form:"event_type"`                                   // 事件类型（可选）
	EventCategory string    `form:"event_category"`                               // 事件分类（可选）
	Status        string    `form:"status"`                                       // 状态筛选（可选）
	StartTime     time.Time `form:"start_time" time_format:"2006-01-02T15:04:05"` // 开始时间（可选）
	EndTime       time.Time `form:"end_time" time_format:"2006-01-02T15:04:05"`   // 结束时间（可选）
}

// QueryResponse 查询响应
type QueryResponse struct {
	List     interface{} `json:"list"`      // 日志列表
	Total    int64       `json:"total"`     // 总记录数
	Page     int         `json:"page"`      // 当前页码
	PageSize int         `json:"page_size"` // 每页条数
}
