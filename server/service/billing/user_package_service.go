package billing

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm/clause"

	"server/global"
	"server/model"
)

type UserPackageService struct{}

// AssignBillingPackageToUser 为用户分配套餐
func (s *UserPackageService) AssignBillingPackageToUser(
	userID string,
	packageID int64,
	source PackageSource,
	notes string,
	autoActivate bool,
) (*model.UserBillingPackage, error) {
	// 获取套餐信息
	var pkg model.BillingPackage
	if err := global.DB.First(&pkg, packageID).Error; err != nil {
		return nil, fmt.Errorf("套餐不存在: %w", err)
	}

	// 创建用户套餐实例
	userPackage := &model.UserBillingPackage{
		UserID:           userID,
		BillingPackageID: packageID,
		PackageName:      pkg.Name,
		PackageType:      pkg.PackageType,
		TotalCredits:     pkg.CreditsAmount,
		UsedCredits:      0,
		RemainingCredits: pkg.CreditsAmount,
		Status:           string(PackageStatusPending),
		Priority:         0,
		Source:           string(source),
		Notes:            notes,
	}

	// 如果自动激活
	if autoActivate {
		now := time.Now()
		userPackage.ActivatedAt = &now
		userPackage.Status = string(PackageStatusActive)

		// 计算过期时间
		if pkg.ValidityDays > 0 {
			expiresAt := now.AddDate(0, 0, pkg.ValidityDays)
			userPackage.ExpiresAt = &expiresAt
		}
	}

	if err := global.DB.Create(userPackage).Error; err != nil {
		return nil, fmt.Errorf("创建用户套餐失败: %w", err)
	}

	return userPackage, nil
}

// GetUserTotalCredits 查询用户总剩余积分
func (s *UserPackageService) GetUserTotalCredits(userID string) (int, error) {
	var total int64
	err := global.DB.Model(&model.UserBillingPackage{}).
		Where("user_id = ? AND status = ? AND (expires_at IS NULL OR expires_at > ?)",
			userID, PackageStatusActive, time.Now()).
		Select("COALESCE(SUM(remaining_credits), 0)").
		Scan(&total).Error

	return int(total), err
}

// GetUserActiveBillingPackages 查询用户有效套餐列表
func (s *UserPackageService) GetUserActiveBillingPackages(userID string) ([]model.UserBillingPackage, error) {
	var packages []model.UserBillingPackage
	err := global.DB.
		Where("user_id = ? AND status = ? AND remaining_credits > 0 AND (expires_at IS NULL OR expires_at > ?)",
			userID, PackageStatusActive, time.Now()).
		Order("priority ASC, expires_at ASC").
		Find(&packages).Error

	return packages, err
}

// GetUserBillingPackages 查询用户所有套餐
func (s *UserPackageService) GetUserBillingPackages(userID string) ([]model.UserBillingPackage, error) {
	var packages []model.UserBillingPackage
	err := global.DB.
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&packages).Error

	return packages, err
}

// CheckCredits 检查用户是否有足够积分
func (s *UserPackageService) CheckCredits(userID string, actionKey ActionKey) (*CheckCreditsResponse, error) {
	// 获取动作价格
	actionPriceService := &ActionPriceService{}
	actionPrice, err := actionPriceService.GetActionPrice(actionKey.String())
	if err != nil {
		return nil, fmt.Errorf("获取动作价格失败: %w", err)
	}

	// 获取用户总积分
	totalCredits, err := s.GetUserTotalCredits(userID)
	if err != nil {
		return nil, fmt.Errorf("获取用户积分失败: %w", err)
	}

	return &CheckCreditsResponse{
		HasEnough:       totalCredits >= actionPrice.CreditsCost,
		TotalCredits:    totalCredits,
		RequiredCredits: actionPrice.CreditsCost,
	}, nil
}

// DeductCredits 扣减积分（原子操作）
func (s *UserPackageService) DeductCredits(req *DeductCreditsRequest) (*DeductCreditsResponse, error) {
	// 获取动作价格
	actionPriceService := &ActionPriceService{}
	actionPrice, err := actionPriceService.GetActionPrice(req.ActionKey.String())
	if err != nil {
		return nil, fmt.Errorf("获取动作价格失败: %w", err)
	}

	requiredCredits := actionPrice.CreditsCost

	// 开始事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 锁定用户有效套餐（悲观锁）
	var userPackages []model.UserBillingPackage
	err = tx.Where("user_id = ? AND status = ? AND remaining_credits > 0 AND (expires_at IS NULL OR expires_at > ?)",
		req.UserID, PackageStatusActive, time.Now()).
		Order("priority ASC, expires_at ASC").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Find(&userPackages).Error

	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("查询用户套餐失败: %w", err)
	}

	// 检查总积分是否足够
	totalCredits := 0
	for _, pkg := range userPackages {
		totalCredits += pkg.RemainingCredits
	}

	if totalCredits < requiredCredits {
		tx.Rollback()
		return &DeductCreditsResponse{
			Success: false,
			Message: fmt.Sprintf("积分不足，需要 %d 积分，当前仅有 %d 积分", requiredCredits, totalCredits),
		}, nil
	}

	// 按优先级扣减积分
	remainingCost := requiredCredits
	for i := range userPackages {
		if remainingCost <= 0 {
			break
		}

		pkg := &userPackages[i]
		deduct := remainingCost
		if pkg.RemainingCredits < deduct {
			deduct = pkg.RemainingCredits
		}

		// 更新套餐积分
		pkg.UsedCredits += deduct
		pkg.RemainingCredits -= deduct

		if pkg.RemainingCredits == 0 {
			pkg.Status = string(PackageStatusDepleted)
		}

		if err := tx.Save(pkg).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("更新套餐积分失败: %w", err)
		}

		remainingCost -= deduct
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("提交事务失败: %w", err)
	}

	// 重新计算剩余积分
	remainingTotal, _ := s.GetUserTotalCredits(req.UserID)

	return &DeductCreditsResponse{
		Success:          true,
		DeductedCredits:  requiredCredits,
		RemainingCredits: remainingTotal,
	}, nil
}

// CleanExpiredBillingPackages 清理过期套餐
func (s *UserPackageService) CleanExpiredBillingPackages() (int64, error) {
	result := global.DB.Model(&model.UserBillingPackage{}).
		Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?",
			PackageStatusActive, time.Now()).
		Update("status", PackageStatusExpired)

	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
}

// ActivateBillingPackage 激活套餐
func (s *UserPackageService) ActivateBillingPackage(packageID int64) error {
	var userPackage model.UserBillingPackage
	if err := global.DB.First(&userPackage, packageID).Error; err != nil {
		return errors.New("套餐不存在")
	}

	if userPackage.Status != string(PackageStatusPending) {
		return errors.New("套餐状态不是待激活")
	}

	now := time.Now()
	userPackage.ActivatedAt = &now
	userPackage.Status = string(PackageStatusActive)

	// 获取原始套餐信息计算过期时间
	var pkg model.BillingPackage
	if err := global.DB.First(&pkg, userPackage.BillingPackageID).Error; err == nil {
		if pkg.ValidityDays > 0 {
			expiresAt := now.AddDate(0, 0, pkg.ValidityDays)
			userPackage.ExpiresAt = &expiresAt
		}
	}

	return global.DB.Save(&userPackage).Error
}
