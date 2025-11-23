package billing

import (
	"strconv"

	billingService "server/service/billing"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// AssignBillingPackageRequest 分配套餐请求
type AssignBillingPackageRequest struct {
	UserID       string `json:"user_id" binding:"required"`
	PackageID    int64  `json:"package_id" binding:"required"`
	Source       string `json:"source"`
	Notes        string `json:"notes"`
	AutoActivate bool   `json:"auto_activate"`
}

// AssignBillingPackage 为用户分配套餐（管理员）
// POST /api/admin/billing/user-packages
func AssignBillingPackage(c *gin.Context) {
	var req AssignBillingPackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	if req.Source == "" {
		req.Source = string(billingService.PackageSourceSystem)
	}

	service := &billingService.UserPackageService{}
	userPackage, err := service.AssignBillingPackageToUser(
		req.UserID,
		req.PackageID,
		billingService.PackageSource(req.Source),
		req.Notes,
		req.AutoActivate,
	)

	if err != nil {
		utils.FailWithMessage("分配套餐失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(userPackage, c)
}

// GetUserBillingPackages 查询用户套餐列表（管理员）
// GET /api/admin/users/:userId/billing-packages
func GetUserBillingPackages(c *gin.Context) {
	userID := c.Param("userId")

	service := &billingService.UserPackageService{}
	packages, err := service.GetUserBillingPackages(userID)
	if err != nil {
		utils.FailWithMessage("查询失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(packages, c)
}

// GetMyBillingPackages 查询我的套餐（用户）
// GET /api/user/billing/packages
func GetMyBillingPackages(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("未登录", c)
		return
	}

	service := &billingService.UserPackageService{}
	packages, err := service.GetUserBillingPackages(userID)
	if err != nil {
		utils.FailWithMessage("查询失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(packages, c)
}

// GetMyCredits 查询我的积分（用户）
// GET /api/user/billing/credits
func GetMyCredits(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("未登录", c)
		return
	}

	service := &billingService.UserPackageService{}
	totalCredits, err := service.GetUserTotalCredits(userID)
	if err != nil {
		utils.FailWithMessage("查询失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(gin.H{
		"total_credits": totalCredits,
		"user_id":       userID,
	}, c)
}

// ActivateBillingPackage 激活套餐
// POST /api/admin/billing/user-packages/:id/activate
func ActivateBillingPackage(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的套餐ID", c)
		return
	}

	service := &billingService.UserPackageService{}
	if err := service.ActivateBillingPackage(id); err != nil {
		utils.FailWithMessage("激活失败: "+err.Error(), c)
		return
	}

	utils.OkWithMessage("激活成功", c)
}
