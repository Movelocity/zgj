package global

import (
	"context"
	"server/config"
	"server/model"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// EventLogServiceInterface 事件日志服务接口
// 使用统一的 Log 方法记录事件，通过预定义的事件类型常量和 JSON 字段实现灵活扩展
type EventLogServiceInterface interface {
	// Log 记录事件日志（核心方法）
	// 通过构造 EventLog 对象传入事件类型、分类、详情等信息
	// Details 字段支持存储任意 JSON 结构的自定义数据
	Log(ctx context.Context, event *model.EventLog) error
}

// EventLogServiceType 事件日志服务类型（包含核心接口和辅助方法）
type EventLogServiceType interface {
	EventLogServiceInterface
	// 以下为便捷辅助方法，封装常见的事件记录操作
	LogUserLogin(userID, ip, userAgent string)
	LogLoginFailed(phone, ip, userAgent, reason string)
	LogUserRegister(userID, phone, ip, userAgent string)
	LogSMSSent(phone, code, ip, userAgent string, success bool, retryCount int)
	LogPasswordReset(userID, ip, userAgent string)
	LogPasswordChange(userID, ip, userAgent string)
	LogUserLogout(userID, ip, userAgent string)
	LogProfileUpdate(userID, ip, userAgent string)
	LogAvatarUpload(userID, ip, userAgent string)
	LogResumeUpload(userID, resumeID, ip, userAgent string)
	LogResumeOptimize(userID, resumeID, ip, userAgent string)
	LogResumeExport(userID, resumeID, ip, userAgent string)
}

var (
	CONFIG          *config.Config
	DB              *gorm.DB
	Cache           *MemoryCache
	LOG             *zap.Logger
	EventLogService EventLogServiceType
)
