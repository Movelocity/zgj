package service

import (
	"server/service/app"
	"server/service/system"
	"server/service/user"
)

// 服务层实例
var (
	UserService   = user.UserService
	AppService    = app.AppService
	SystemService = system.SystemService
)
