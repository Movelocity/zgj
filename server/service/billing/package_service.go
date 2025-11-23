package billing

import (
	"server/global"
	"server/model"
)

type PackageService struct{}

// CreateBillingPackage 创建套餐
func (s *PackageService) CreateBillingPackage(pkg *model.BillingPackage) error {
	return global.DB.Create(pkg).Error
}

// GetBillingPackage 根据ID获取套餐
func (s *PackageService) GetBillingPackage(id int64) (*model.BillingPackage, error) {
	var pkg model.BillingPackage
	err := global.DB.First(&pkg, id).Error
	if err != nil {
		return nil, err
	}
	return &pkg, nil
}

// ListBillingPackages 查询套餐列表
func (s *PackageService) ListBillingPackages(activeOnly bool, visibleOnly bool) ([]model.BillingPackage, error) {
	var packages []model.BillingPackage
	query := global.DB.Order("sort_order ASC, id ASC")

	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if visibleOnly {
		query = query.Where("is_visible = ?", true)
	}

	err := query.Find(&packages).Error
	return packages, err
}

// UpdateBillingPackage 更新套餐
func (s *PackageService) UpdateBillingPackage(pkg *model.BillingPackage) error {
	return global.DB.Save(pkg).Error
}
