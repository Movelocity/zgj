package initialize

import (
	"server/global"
	"server/service/eventlog"
)

// InitServices 初始化全局服务
func InitServices() {
	// 初始化事件日志服务
	global.EventLog = eventlog.EventLogService
}
