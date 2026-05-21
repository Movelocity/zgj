package service

import (
	"server/service/app"
	"server/service/eventlog"
	"server/service/file"
	"server/service/invitation"
	"server/service/opportunity"
	"server/service/resume"
	"server/service/sitevariable"
	"server/service/system"
	"server/service/user"
)

// 服务层实例
var (
	UserService         = user.UserService
	AppService          = app.AppService
	SystemService       = system.SystemService
	ResumeService       = resume.ResumeService
	FileService         = file.FileService
	InvitationService   = invitation.InvitationService
	OpportunityService  = opportunity.OpportunityService
	SiteVariableService = sitevariable.SiteVariableService
	EventLogService     = eventlog.EventLogService
)
