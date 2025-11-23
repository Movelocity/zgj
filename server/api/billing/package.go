package billing

import (
	"strconv"

	"server/model"
	billingService "server/service/billing"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// CreateBillingPackageRequest 创建套餐请求
type CreateBillingPackageRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	PackageType   string  `json:"package_type" binding:"required"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"original_price"`
	CreditsAmount int     `json:"credits_amount" binding:"required,min=1"`
	ValidityDays  int     `json:"validity_days" binding:"min=0"`
	IsActive      bool    `json:"is_active"`
	IsVisible     bool    `json:"is_visible"`
	SortOrder     int     `json:"sort_order"`
}

// CreateBillingPackage 创建套餐（管理员）
// POST /api/admin/billing/packages
func CreateBillingPackage(c *gin.Context) {
	var req CreateBillingPackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	pkg := &model.BillingPackage{
		Name:          req.Name,
		Description:   req.Description,
		PackageType:   req.PackageType,
		Price:         req.Price,
		OriginalPrice: req.OriginalPrice,
		CreditsAmount: req.CreditsAmount,
		ValidityDays:  req.ValidityDays,
		IsActive:      req.IsActive,
		IsVisible:     req.IsVisible,
		SortOrder:     req.SortOrder,
	}

	service := &billingService.PackageService{}
	if err := service.CreateBillingPackage(pkg); err != nil {
		utils.FailWithMessage("创建套餐失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(pkg, c)
}

// GetBillingPackage 获取单个套餐
// GET /api/admin/billing/packages/:id
func GetBillingPackage(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的套餐ID", c)
		return
	}

	service := &billingService.PackageService{}
	pkg, err := service.GetBillingPackage(id)
	if err != nil {
		utils.FailWithMessage("套餐不存在", c)
		return
	}

	utils.OkWithData(pkg, c)
}

// ListBillingPackages 查询套餐列表（管理员）
// GET /api/admin/billing/packages
func ListBillingPackages(c *gin.Context) {
	activeOnly := c.Query("active_only") == "true"
	visibleOnly := c.Query("visible_only") == "true"

	service := &billingService.PackageService{}
	packages, err := service.ListBillingPackages(activeOnly, visibleOnly)
	if err != nil {
		utils.FailWithMessage("查询失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(packages, c)
}

// UpdateBillingPackage 更新套餐
// PUT /api/admin/billing/packages/:id
func UpdateBillingPackage(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的套餐ID", c)
		return
	}

	var req CreateBillingPackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	service := &billingService.PackageService{}
	pkg, err := service.GetBillingPackage(id)
	if err != nil {
		utils.FailWithMessage("套餐不存在", c)
		return
	}

	// 更新字段
	pkg.Name = req.Name
	pkg.Description = req.Description
	pkg.PackageType = req.PackageType
	pkg.Price = req.Price
	pkg.OriginalPrice = req.OriginalPrice
	pkg.CreditsAmount = req.CreditsAmount
	pkg.ValidityDays = req.ValidityDays
	pkg.IsActive = req.IsActive
	pkg.IsVisible = req.IsVisible
	pkg.SortOrder = req.SortOrder

	if err := service.UpdateBillingPackage(pkg); err != nil {
		utils.FailWithMessage("更新套餐失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(pkg, c)
}
