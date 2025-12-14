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

// TOSServiceInterface TOS文件存储服务接口
type TOSServiceInterface interface {
	GetSTSCredentials(ctx context.Context) (*TOSSTSCredentials, error)
	GeneratePresignedURL(ctx context.Context, req *TOSPresignRequest) (*TOSPresignResponse, error)
	GenerateDownloadURL(ctx context.Context, key string) (*TOSDownloadResponse, error)
	RecordUpload(ctx context.Context, upload *model.TOSUpload) error
	ListUploads(ctx context.Context, userID string, page, pageSize int) (*TOSUploadListResponse, error)
}

// TOS service types (to avoid import cycles)
type TOSSTSCredentials struct {
	AccessKeyID     string `json:"access_key_id"`
	SecretAccessKey string `json:"secret_access_key"`
	SessionToken    string `json:"session_token"`
	Expiration      string `json:"expiration"`
	Region          string `json:"region"`
	Endpoint        string `json:"endpoint"`
	Bucket          string `json:"bucket"`
}

type TOSPresignRequest struct {
	Key         string            `json:"key"`
	ContentType string            `json:"content_type,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

type TOSPresignResponse struct {
	URL       string `json:"url"`
	Key       string `json:"key"`
	ExpiresIn int    `json:"expires_in"`
}

type TOSDownloadResponse struct {
	URL       string `json:"url"`
	ExpiresIn int    `json:"expires_in"`
}

type TOSUploadListResponse struct {
	Total   int64             `json:"total"`
	Page    int               `json:"page"`
	PerPage int               `json:"per_page"`
	Items   []model.TOSUpload `json:"items"`
}

// ASRServiceInterface ASR语音识别服务接口
type ASRServiceInterface interface {
	SubmitTask(ctx context.Context, req *ASRSubmitTaskRequest) (*model.ASRTask, error)
	GetTask(ctx context.Context, taskID string) (*model.ASRTask, error)
	PollTask(ctx context.Context, taskID string) (*model.ASRTask, error)
	ListTasks(ctx context.Context, userID string, page, pageSize int) (*ASRTaskListResponse, error)
	DeleteTask(ctx context.Context, taskID string) error
	RetryTask(ctx context.Context, taskID string) (*model.ASRTask, error)
}

// ASR service types
type ASRSubmitTaskRequest struct {
	UserID      string                 `json:"user_id"`
	AudioURL    string                 `json:"audio_url"`
	AudioFormat string                 `json:"audio_format"`
	Options     map[string]interface{} `json:"options,omitempty"`
}

type ASRTaskListResponse struct {
	Total   int64           `json:"total"`
	Page    int             `json:"page"`
	PerPage int             `json:"per_page"`
	Items   []model.ASRTask `json:"items"`
}

var (
	CONFIG     *config.Config
	DB         *gorm.DB
	Cache      *MemoryCache
	LOG        *zap.Logger
	EventLog   EventLogServiceType
	TOSService TOSServiceInterface
	ASRService ASRServiceInterface
)
