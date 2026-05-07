package opportunity

import (
	"encoding/json"
	"errors"
	"math"
	"strconv"
	"strings"

	"server/global"
	"server/model"

	"gorm.io/gorm"
)

type opportunityService struct{}

var OpportunityService = &opportunityService{}

func normalizeStatus(status string) string {
	switch status {
	case model.JobOpportunityStatusDraft, model.JobOpportunityStatusPublished, model.JobOpportunityStatusArchived:
		return status
	case "":
		return model.JobOpportunityStatusPublished
	default:
		return ""
	}
}

func normalizeLines(lines []string) []string {
	result := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func jsonList(lines []string) (model.JSON, error) {
	raw, err := json.Marshal(normalizeLines(lines))
	if err != nil {
		return nil, err
	}
	return model.JSON(raw), nil
}

func buildOpportunity(req *OpportunityUpsertRequest, createdBy string) (*model.JobOpportunity, error) {
	status := normalizeStatus(req.Status)
	if status == "" {
		return nil, errors.New("状态只能是 draft、published 或 archived")
	}

	company := strings.TrimSpace(req.Company)
	title := strings.TrimSpace(req.Title)
	category := strings.TrimSpace(req.Category)
	contactEmail := strings.TrimSpace(req.ContactEmail)
	if company == "" || title == "" || category == "" || contactEmail == "" {
		return nil, errors.New("企业、岗位、方向类别和联系方式不能为空")
	}

	responsibilities, err := jsonList(req.Responsibilities)
	if err != nil {
		return nil, errors.New("岗位职责格式错误")
	}
	requirements, err := jsonList(req.Requirements)
	if err != nil {
		return nil, errors.New("任职要求格式错误")
	}

	return &model.JobOpportunity{
		Company:          company,
		Title:            title,
		Category:         category,
		Location:         strings.TrimSpace(req.Location),
		Cadence:          strings.TrimSpace(req.Cadence),
		Summary:          strings.TrimSpace(req.Summary),
		Responsibilities: responsibilities,
		Requirements:     requirements,
		ContactEmail:     contactEmail,
		Note:             strings.TrimSpace(req.Note),
		Status:           status,
		SortOrder:        req.SortOrder,
		CreatedBy:        createdBy,
	}, nil
}

func (s *opportunityService) ListPublic(req *OpportunityListRequest) (*OpportunityListResponse, error) {
	req.Status = model.JobOpportunityStatusPublished
	return s.List(req)
}

func (s *opportunityService) List(req *OpportunityListRequest) (*OpportunityListResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	if req.PageSize > 100 {
		req.PageSize = 100
	}

	query := global.DB.Model(&model.JobOpportunity{})
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if req.Company != "" {
		query = query.Where("company ILIKE ?", "%"+strings.TrimSpace(req.Company)+"%")
	}
	if req.Category != "" {
		query = query.Where("category ILIKE ?", "%"+strings.TrimSpace(req.Category)+"%")
	}
	if req.Keyword != "" {
		keyword := "%" + strings.TrimSpace(req.Keyword) + "%"
		query = query.Where("company ILIKE ? OR title ILIKE ? OR category ILIKE ? OR summary ILIKE ?", keyword, keyword, keyword, keyword)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.New("查询岗位总数失败")
	}

	var list []model.JobOpportunity
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("sort_order ASC, created_at DESC").Offset(offset).Limit(req.PageSize).Find(&list).Error; err != nil {
		return nil, errors.New("查询岗位列表失败")
	}

	return &OpportunityListResponse{
		List:       list,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: int(math.Ceil(float64(total) / float64(req.PageSize))),
	}, nil
}

func (s *opportunityService) Create(req *OpportunityUpsertRequest, createdBy string) (*model.JobOpportunity, error) {
	opportunity, err := buildOpportunity(req, createdBy)
	if err != nil {
		return nil, err
	}
	if err := global.DB.Create(opportunity).Error; err != nil {
		return nil, errors.New("创建岗位失败")
	}
	return opportunity, nil
}

func (s *opportunityService) BatchCreate(req *OpportunityBatchCreateRequest, createdBy string) ([]model.JobOpportunity, error) {
	if len(req.Items) == 0 {
		return nil, errors.New("岗位列表不能为空")
	}
	if len(req.Items) > 100 {
		return nil, errors.New("单次最多上传100条岗位")
	}

	opportunities := make([]model.JobOpportunity, 0, len(req.Items))
	for i := range req.Items {
		item, err := buildOpportunity(&req.Items[i], createdBy)
		if err != nil {
			return nil, errors.New("第" + strconv.Itoa(i+1) + "条岗位：" + err.Error())
		}
		opportunities = append(opportunities, *item)
	}

	if err := global.DB.Transaction(func(tx *gorm.DB) error {
		return tx.Create(&opportunities).Error
	}); err != nil {
		return nil, errors.New("批量创建岗位失败")
	}

	return opportunities, nil
}

func (s *opportunityService) Update(id int64, req *OpportunityUpsertRequest) (*model.JobOpportunity, error) {
	var existing model.JobOpportunity
	if err := global.DB.First(&existing, id).Error; err != nil {
		return nil, errors.New("岗位不存在")
	}

	opportunity, err := buildOpportunity(req, existing.CreatedBy)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"company":          opportunity.Company,
		"title":            opportunity.Title,
		"category":         opportunity.Category,
		"location":         opportunity.Location,
		"cadence":          opportunity.Cadence,
		"summary":          opportunity.Summary,
		"responsibilities": opportunity.Responsibilities,
		"requirements":     opportunity.Requirements,
		"contact_email":    opportunity.ContactEmail,
		"note":             opportunity.Note,
		"status":           opportunity.Status,
		"sort_order":       opportunity.SortOrder,
	}

	if err := global.DB.Model(&existing).Updates(updates).Error; err != nil {
		return nil, errors.New("更新岗位失败")
	}
	if err := global.DB.First(&existing, id).Error; err != nil {
		return nil, errors.New("查询岗位失败")
	}

	return &existing, nil
}

func (s *opportunityService) Archive(id int64) error {
	result := global.DB.Model(&model.JobOpportunity{}).Where("id = ?", id).Update("status", model.JobOpportunityStatusArchived)
	if result.Error != nil {
		return errors.New("下架岗位失败")
	}
	if result.RowsAffected == 0 {
		return errors.New("岗位不存在")
	}
	return nil
}
