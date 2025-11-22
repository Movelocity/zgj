package model

import "time"

// EventLog 用户事件日志表
type EventLog struct {
	ID        int64     `json:"id" gorm:"primaryKey;autoIncrement;comment:主键ID"`
	CreatedAt time.Time `json:"created_at" gorm:"index:idx_user_event_logs_time;not null;comment:事件发生时间"`

	UserID        string `json:"user_id" gorm:"type:varchar(20);index:idx_user_event_logs_user;not null;comment:用户ID（空字符串表示未登录）"`
	EventType     string `json:"event_type" gorm:"type:varchar(50);index:idx_user_event_logs_type;not null;comment:事件类型"`
	EventCategory string `json:"event_category" gorm:"type:varchar(20);index:idx_user_event_logs_category;not null;comment:事件分类"`

	IPAddress string `json:"ip_address" gorm:"type:varchar(45);comment:IP地址（支持IPv6）"`
	UserAgent string `json:"user_agent" gorm:"type:text;comment:User-Agent"`

	ResourceType string `json:"resource_type" gorm:"type:varchar(50);comment:资源类型（如resume、order）"`
	ResourceID   string `json:"resource_id" gorm:"type:varchar(50);comment:资源ID"`

	Status       string `json:"status" gorm:"type:varchar(20);default:'success';comment:状态：success/failed/error"`
	ErrorMessage string `json:"error_message" gorm:"type:text;comment:错误信息（如果失败）"`

	Details JSON `json:"details" gorm:"type:jsonb;comment:事件详情（JSON格式）"`
}

// TableName 指定表名
func (EventLog) TableName() string {
	return "user_event_logs"
}

