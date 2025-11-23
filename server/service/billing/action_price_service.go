package billing

import (
	"server/global"
	"server/model"
)

type ActionPriceService struct{}

// GetActionPrice 根据action_key获取动作价格
func (s *ActionPriceService) GetActionPrice(actionKey string) (*model.BillingActionPrice, error) {
	var actionPrice model.BillingActionPrice
	err := global.DB.Where("action_key = ? AND is_active = ?", actionKey, true).First(&actionPrice).Error
	if err != nil {
		return nil, err
	}
	return &actionPrice, nil
}

// ListActionPrices 查询动作价格列表
func (s *ActionPriceService) ListActionPrices(activeOnly bool) ([]model.BillingActionPrice, error) {
	var actionPrices []model.BillingActionPrice
	query := global.DB.Order("sort_order ASC, id ASC")

	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	err := query.Find(&actionPrices).Error
	return actionPrices, err
}

// CreateActionPrice 创建动作价格
func (s *ActionPriceService) CreateActionPrice(actionPrice *model.BillingActionPrice) error {
	return global.DB.Create(actionPrice).Error
}

// UpdateActionPrice 更新动作价格
func (s *ActionPriceService) UpdateActionPrice(actionPrice *model.BillingActionPrice) error {
	return global.DB.Save(actionPrice).Error
}
