package service

import (
	"server/service/app"
	"server/service/file"
	"server/service/resume"
	"server/service/system"
	"server/service/user"
	"server/service/workflow"
)

// 服务层实例
var (
	UserService     = user.UserService
	AppService      = app.AppService
	SystemService   = system.SystemService
	ResumeService   = resume.ResumeService
	FileService     = file.FileService
	WorkflowService = workflow.WorkflowService
)
