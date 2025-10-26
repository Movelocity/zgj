package service

import (
	"server/service/app"
	"server/service/file"
	"server/service/invitation"
	"server/service/resume"
	"server/service/system"
	"server/service/user"
)

// 服务层实例
var (
	UserService       = user.UserService
	AppService        = app.AppService
	SystemService     = system.SystemService
	ResumeService     = resume.ResumeService
	FileService       = file.FileService
	InvitationService = invitation.InvitationService
)
