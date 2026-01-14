package model

import (
	"time"
)

// InterviewReview 面试复盘分析记录表
type InterviewReview struct {
	ID        int64     `gorm:"primaryKey;autoIncrement;comment:主键ID" json:"id"`
	CreatedAt time.Time `gorm:"index:idx_interview_reviews_time;not null;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time `gorm:"comment:更新时间" json:"updated_at"`

	UserID string `gorm:"type:varchar(20);index:idx_interview_reviews_user;not null;comment:用户ID" json:"user_id"`
	Data   JSON   `gorm:"type:jsonb;comment:AI分析结果（来自Dify workflow）" json:"data"`
	// Metadata 元数据结构:
	// {
	//   "main_audio_id": "asr_task_id",      // ASR任务ID，关联asr_tasks表
	//   "workflow_id": "workflow_xxx",        // 工作流ID，从site_variables获取
	//   "status": "pending|transcribing|analyzing|completed|failed", // 处理状态
	//   "asr_result": {...},                  // 缓存的ASR识别结果
	//   "error_message": "错误信息"            // 失败时的错误详情（可选）
	// }
	Metadata JSON `gorm:"type:jsonb;not null;comment:工作流状态和引用信息" json:"metadata"`
}

// TableName 指定表名
func (InterviewReview) TableName() string {
	return "interview_reviews"
}

// InterviewReview 状态常量
const (
	InterviewReviewStatusPending      = "pending"      // 待处理
	InterviewReviewStatusTranscribing = "transcribing" // 转录中
	InterviewReviewStatusAnalyzing    = "analyzing"    // 分析中
	InterviewReviewStatusCompleted    = "completed"    // 已完成
	InterviewReviewStatusFailed       = "failed"       // 失败
)
