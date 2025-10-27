package sitevariable

import (
	"errors"
	"math"

	"server/global"
	"server/model"
)

type siteVariableService struct{}

var SiteVariableService = &siteVariableService{}

// CreateSiteVariable 创建网站变量
func (s *siteVariableService) CreateSiteVariable(req *CreateSiteVariableRequest) error {
	// 检查key是否已存在
	var count int64
	if err := global.DB.Model(&model.SiteVariable{}).Where("key = ?", req.Key).Count(&count).Error; err != nil {
		return errors.New("查询变量失败")
	}
	if count > 0 {
		return errors.New("变量键名已存在")
	}

	// 创建变量
	variable := &model.SiteVariable{
		Key:         req.Key,
		Value:       req.Value,
		Description: req.Description,
	}

	if err := global.DB.Create(variable).Error; err != nil {
		return errors.New("创建变量失败")
	}

	return nil
}

// UpdateSiteVariable 更新网站变量
func (s *siteVariableService) UpdateSiteVariable(id int64, req *UpdateSiteVariableRequest) error {
	var variable model.SiteVariable
	if err := global.DB.First(&variable, id).Error; err != nil {
		return errors.New("变量不存在")
	}

	// 更新字段
	updates := map[string]interface{}{
		"value":       req.Value,
		"description": req.Description,
	}

	if err := global.DB.Model(&variable).Updates(updates).Error; err != nil {
		return errors.New("更新变量失败")
	}

	return nil
}

// DeleteSiteVariable 删除网站变量
func (s *siteVariableService) DeleteSiteVariable(id int64) error {
	result := global.DB.Delete(&model.SiteVariable{}, id)
	if result.Error != nil {
		return errors.New("删除变量失败")
	}
	if result.RowsAffected == 0 {
		return errors.New("变量不存在")
	}

	return nil
}

// GetSiteVariableList 获取网站变量列表
func (s *siteVariableService) GetSiteVariableList(req *GetSiteVariableListRequest) (*SiteVariableListResponse, error) {
	var variables []model.SiteVariable
	var total int64

	// 构建查询
	query := global.DB.Model(&model.SiteVariable{})

	// 如果有key参数，进行模糊查询
	if req.Key != "" {
		query = query.Where("key LIKE ?", "%"+req.Key+"%")
	}

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.New("查询变量总数失败")
	}

	// 分页查询
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&variables).Error; err != nil {
		return nil, errors.New("查询变量列表失败")
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(total) / float64(req.PageSize)))

	response := &SiteVariableListResponse{
		List:       variables,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}

	return response, nil
}

// GetSiteVariableByKey 通过key获取网站变量
func (s *siteVariableService) GetSiteVariableByKey(key string) (*GetSiteVariableByKeyResponse, error) {
	var variable model.SiteVariable
	if err := global.DB.Where("key = ?", key).First(&variable).Error; err != nil {
		return nil, errors.New("变量不存在")
	}

	response := &GetSiteVariableByKeyResponse{
		Value:       variable.Value,
		Description: variable.Description,
	}

	return response, nil
}

// GetSiteVariableByID 通过ID获取网站变量详情
func (s *siteVariableService) GetSiteVariableByID(id int64) (*model.SiteVariable, error) {
	var variable model.SiteVariable
	if err := global.DB.First(&variable, id).Error; err != nil {
		return nil, errors.New("变量不存在")
	}

	return &variable, nil
}
