package billing

// ServiceGroup 计费服务组
type ServiceGroup struct {
	ActionPriceService  ActionPriceService
	PackageService      PackageService
	UserPackageService  UserPackageService
}

var ServiceGroupApp = new(ServiceGroup)

