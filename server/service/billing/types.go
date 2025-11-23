package billing

// PackageType 套餐类型枚举
type PackageType string

const (
	PackageTypeDuration  PackageType = "duration"  // 时长型
	PackageTypeCredits   PackageType = "credits"   // 积分包
	PackageTypeHybrid    PackageType = "hybrid"    // 混合型
	PackageTypePermanent PackageType = "permanent" // 永久型
)

// PackageStatus 套餐状态枚举
type PackageStatus string

const (
	PackageStatusPending  PackageStatus = "pending"  // 待激活，正在充值，没充值完，不能使用
	PackageStatusActive   PackageStatus = "active"   // 使用中，可以正常使用
	PackageStatusExpired  PackageStatus = "expired"  // 已过期
	PackageStatusDepleted PackageStatus = "depleted" // 已耗尽
)

// PackageSource 套餐来源枚举
type PackageSource string

const (
	PackageSourcePurchase  PackageSource = "purchase"  // 购买
	PackageSourceGift      PackageSource = "gift"      // 赠送
	PackageSourcePromotion PackageSource = "promotion" // 促销
	PackageSourceSystem    PackageSource = "system"    // 系统
)

// ActionKey 动作key枚举
type ActionKey string

const (
	ActionResumeOptimize   ActionKey = "resume_optimize"   // 简历优化
	ActionAIChat           ActionKey = "ai_chat"           // AI对话
	ActionPDFExport        ActionKey = "pdf_export"        // PDF导出
	ActionAdvancedAnalysis ActionKey = "advanced_analysis" // 高级分析
)

// String 返回动作key的字符串表示
func (a ActionKey) String() string {
	return string(a)
}

// DeductCreditsRequest 扣减积分请求
type DeductCreditsRequest struct {
	UserID       string    `json:"user_id" binding:"required"`
	ActionKey    ActionKey `json:"action_key" binding:"required"`
	ResourceType string    `json:"resource_type,omitempty"`
	ResourceID   string    `json:"resource_id,omitempty"`
}

// DeductCreditsResponse 扣减积分响应
type DeductCreditsResponse struct {
	Success          bool   `json:"success"`
	DeductedCredits  int    `json:"deducted_credits"`
	RemainingCredits int    `json:"remaining_credits"`
	Message          string `json:"message,omitempty"`
}

// CheckCreditsResponse 检查积分响应
type CheckCreditsResponse struct {
	HasEnough       bool `json:"has_enough"`
	TotalCredits    int  `json:"total_credits"`
	RequiredCredits int  `json:"required_credits"`
}
