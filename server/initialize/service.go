package initialize

import (
	"fmt"
	"server/global"
	"server/service/asr"
	"server/service/eventlog"
	"server/service/tos"
)

// InitServices 初始化全局服务
func InitServices() {
	// 初始化事件日志服务
	global.EventLog = eventlog.EventLogService

	// 初始化TOS服务
	tosService, err := tos.NewTOSService()
	if err != nil {
		fmt.Printf("Warning: Failed to initialize TOS service: %v\n", err)
		// TOS服务初始化失败不应该阻止程序启动，设置为nil即可
		global.TOSService = nil
	} else {
		global.TOSService = tosService
		fmt.Println("TOS服务初始化成功")
	}

	// 初始化ASR服务
	asrService, err := asr.NewASRService()
	if err != nil {
		fmt.Printf("Warning: Failed to initialize ASR service: %v\n", err)
		// ASR服务初始化失败不应该阻止程序启动，设置为nil即可
		global.ASRService = nil
	} else {
		global.ASRService = asrService
		fmt.Println("ASR服务初始化成功")
	}
}
