package eventlog

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.uber.org/zap"

	"server/global"
	"server/model"
)

type eventLogService struct{}

var EventLogService = &eventLogService{}

// Log 记录事件日志
func (s *eventLogService) Log(ctx context.Context, event *model.EventLog) error {
	// 设置默认时间
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now()
	}

	// 设置默认状态
	if event.Status == "" {
		event.Status = StatusSuccess
	}

	// 记录到数据库
	if err := global.DB.WithContext(ctx).Create(event).Error; err != nil {
		// 记录失败不应该影响主业务，记录到系统日志
		if global.LOG != nil {
			global.LOG.Error("Failed to log event", zap.Error(err))
		}
		return err
	}

	return nil
}

// Query 查询事件日志
func (s *eventLogService) Query(ctx context.Context, req *QueryRequest) (*QueryResponse, error) {
	// 设置默认值
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 50
	}
	if req.PageSize > 100 {
		req.PageSize = 100
	}

	// 构建查询
	query := global.DB.WithContext(ctx).Model(&model.EventLog{})

	// 应用筛选条件
	if req.UserID != "" {
		query = query.Where("user_id = ?", req.UserID)
	}
	if req.EventType != "" {
		query = query.Where("event_type = ?", req.EventType)
	}
	if req.EventCategory != "" {
		query = query.Where("event_category = ?", req.EventCategory)
	}
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if !req.StartTime.IsZero() {
		query = query.Where("created_at >= ?", req.StartTime)
	}
	if !req.EndTime.IsZero() {
		query = query.Where("created_at <= ?", req.EndTime)
	}

	// 统计总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.New("统计日志总数失败: " + err.Error())
	}

	// 查询列表（按时间倒序）
	var logs []model.EventLog
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("created_at DESC").
		Limit(req.PageSize).
		Offset(offset).
		Find(&logs).Error; err != nil {
		return nil, errors.New("查询日志列表失败: " + err.Error())
	}

	return &QueryResponse{
		List:     logs,
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}, nil
}

// LogUserLogin 快捷记录用户登录
func (s *eventLogService) LogUserLogin(userID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventUserLogin,
		EventCategory: CategoryAuth,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        StatusSuccess,
	})
}

// LogLoginFailed 快捷记录登录失败
func (s *eventLogService) LogLoginFailed(phone, ip, userAgent, reason string) {
	details := model.JSON(`{"phone":"` + phone + `","reason":"` + reason + `"}`)
	s.Log(context.Background(), &model.EventLog{
		UserID:        "", // 登录失败时可能还没有userID
		EventType:     EventLoginFailed,
		EventCategory: CategoryAuth,
		IPAddress:     ip,
		UserAgent:     userAgent,
		ErrorMessage:  reason,
		Status:        StatusFailed,
		Details:       details,
	})
}

// LogUserRegister 快捷记录用户注册
func (s *eventLogService) LogUserRegister(userID, phone, ip, userAgent string) {
	details := model.JSON(`{"phone":"` + phone + `"}`)
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventUserRegister,
		EventCategory: CategoryAuth,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        StatusSuccess,
		Details:       details,
	})
}

// LogSMSSent 快捷记录发送验证码
func (s *eventLogService) LogSMSSent(phone, code, ip, userAgent string, success bool, retryCount int) {
	status := StatusSuccess
	if !success {
		status = StatusFailed
	}
	// 构建详细信息，包含验证码和重试次数
	details := model.JSON(fmt.Sprintf(`{"phone":"%s","code":"%s","retry_count":%d}`, phone, code, retryCount))
	s.Log(context.Background(), &model.EventLog{
		UserID:        "", // 发送验证码时可能还没有userID
		EventType:     EventSMSSent,
		EventCategory: CategoryAuth,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        status,
		Details:       details,
	})
}

// LogPasswordReset 快捷记录密码重置
func (s *eventLogService) LogPasswordReset(userID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventPasswordReset,
		EventCategory: CategoryAuth,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        StatusSuccess,
	})
}

// LogPasswordChange 快捷记录密码修改
func (s *eventLogService) LogPasswordChange(userID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventPasswordChange,
		EventCategory: CategoryAuth,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        StatusSuccess,
	})
}

// LogUserLogout 快捷记录退出登录
func (s *eventLogService) LogUserLogout(userID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventUserLogout,
		EventCategory: CategoryAuth,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        StatusSuccess,
	})
}

// LogProfileUpdate 快捷记录资料更新
func (s *eventLogService) LogProfileUpdate(userID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventProfileUpdate,
		EventCategory: CategoryUser,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        StatusSuccess,
	})
}

// LogAvatarUpload 快捷记录头像上传
func (s *eventLogService) LogAvatarUpload(userID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventAvatarUpload,
		EventCategory: CategoryUser,
		IPAddress:     ip,
		UserAgent:     userAgent,
		Status:        StatusSuccess,
	})
}

// LogResumeUpload 快捷记录简历上传
func (s *eventLogService) LogResumeUpload(userID, resumeID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventResumeUpload,
		EventCategory: CategoryResume,
		IPAddress:     ip,
		UserAgent:     userAgent,
		ResourceType:  "resume",
		ResourceID:    resumeID,
		Status:        StatusSuccess,
	})
}

// LogResumeOptimize 快捷记录简历优化
func (s *eventLogService) LogResumeOptimize(userID, resumeID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventResumeOptimize,
		EventCategory: CategoryResume,
		IPAddress:     ip,
		UserAgent:     userAgent,
		ResourceType:  "resume",
		ResourceID:    resumeID,
		Status:        StatusSuccess,
	})
}

// LogResumeExport 快捷记录简历导出
func (s *eventLogService) LogResumeExport(userID, resumeID, ip, userAgent string) {
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventResumeExport,
		EventCategory: CategoryResume,
		IPAddress:     ip,
		UserAgent:     userAgent,
		ResourceType:  "resume",
		ResourceID:    resumeID,
		Status:        StatusSuccess,
	})
}

// LogInvitationReward 快捷记录邀请奖励
func (s *eventLogService) LogInvitationReward(userID, packageName, rewardType string) {
	details := model.JSON(fmt.Sprintf(`{"package_name":"%s","reward_type":"%s"}`, packageName, rewardType))
	s.Log(context.Background(), &model.EventLog{
		UserID:        userID,
		EventType:     EventInvitationReward,
		EventCategory: CategorySystem,
		Status:        StatusSuccess,
		Details:       details,
	})
}
