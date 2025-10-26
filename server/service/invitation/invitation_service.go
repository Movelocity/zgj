package invitation

import (
	"crypto/rand"
	"encoding/base32"
	"errors"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"server/global"
	"server/model"
)

type invitationService struct{}

var InvitationService = &invitationService{}

// GenerateInvitationCode 生成邀请码（格式：ABCD-EFGH-IJKL）
func (s *invitationService) GenerateInvitationCode() string {
	b := make([]byte, 9) // 9字节可以生成15个字符（base32编码）
	rand.Read(b)
	code := base32.StdEncoding.EncodeToString(b)
	code = strings.TrimRight(code, "=") // 移除填充字符

	// 格式化为 XXXX-XXXX-XXXX
	if len(code) >= 12 {
		return code[:4] + "-" + code[4:8] + "-" + code[8:12]
	}
	return code
}

// CreateInvitation 创建邀请码
func (s *invitationService) CreateInvitation(creatorID string, req CreateInvitationRequest) (*InvitationCodeResponse, error) {
	// 验证创建者是否存在
	var user model.User
	if err := global.DB.Where("id = ?", creatorID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.New("查询用户失败")
	}

	// 生成唯一邀请码
	var code string
	for {
		code = s.GenerateInvitationCode()
		// 检查是否已存在
		var existingCode model.InvitationCode
		if err := global.DB.Where("code = ?", code).First(&existingCode).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				break // 邀请码不存在，可以使用
			}
		}
	}

	// 计算过期时间
	var expiresAt *time.Time
	if req.ExpiresInDays != nil && *req.ExpiresInDays > 0 {
		expires := time.Now().AddDate(0, 0, *req.ExpiresInDays)
		expiresAt = &expires
	}

	// 创建邀请码记录
	invitation := model.InvitationCode{
		Code:      code,
		CreatorID: creatorID,
		MaxUses:   req.MaxUses,
		UsedCount: 0,
		ExpiresAt: expiresAt,
		IsActive:  true,
		Note:      req.Note,
	}

	if err := global.DB.Create(&invitation).Error; err != nil {
		return nil, errors.New("创建邀请码失败")
	}

	response := &InvitationCodeResponse{
		Code:      invitation.Code,
		ExpiresAt: invitation.ExpiresAt,
		MaxUses:   invitation.MaxUses,
		UsedCount: invitation.UsedCount,
		CreatedAt: invitation.CreatedAt,
		IsActive:  invitation.IsActive,
		Note:      invitation.Note,
		CreatorID: user.ID,
		Creator:   user.Name,
	}

	return response, nil
}

// AdminCreateInvitation 管理员为指定用户创建邀请码
func (s *invitationService) AdminCreateInvitation(req AdminCreateInvitationRequest) (*InvitationCodeResponse, error) {
	// 验证创建者是否存在
	var user model.User
	if err := global.DB.Where("id = ?", req.CreatorID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("指定的用户不存在")
		}
		return nil, errors.New("查询用户失败")
	}

	// 生成唯一邀请码
	var code string
	for {
		code = s.GenerateInvitationCode()
		// 检查是否已存在
		var existingCode model.InvitationCode
		if err := global.DB.Where("code = ?", code).First(&existingCode).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				break // 邀请码不存在，可以使用
			}
		}
	}

	// 计算过期时间
	var expiresAt *time.Time
	if req.ExpiresInDays != nil && *req.ExpiresInDays > 0 {
		expires := time.Now().AddDate(0, 0, *req.ExpiresInDays)
		expiresAt = &expires
	}

	// 创建邀请码记录
	invitation := model.InvitationCode{
		Code:      code,
		CreatorID: req.CreatorID,
		MaxUses:   req.MaxUses,
		UsedCount: 0,
		ExpiresAt: expiresAt,
		IsActive:  true,
		Note:      req.Note,
	}

	if err := global.DB.Create(&invitation).Error; err != nil {
		return nil, errors.New("创建邀请码失败")
	}

	response := &InvitationCodeResponse{
		Code:      invitation.Code,
		ExpiresAt: invitation.ExpiresAt,
		MaxUses:   invitation.MaxUses,
		UsedCount: invitation.UsedCount,
		CreatedAt: invitation.CreatedAt,
		IsActive:  invitation.IsActive,
		Note:      invitation.Note,
		CreatorID: user.ID,
		Creator:   user.Name,
	}

	return response, nil
}

// ValidateInvitation 验证邀请码
func (s *invitationService) ValidateInvitation(code string) (*ValidateInvitationResponse, error) {
	var invitation model.InvitationCode
	if err := global.DB.Where("code = ?", code).First(&invitation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &ValidateInvitationResponse{
				IsValid: false,
				Message: "邀请码不存在",
			}, nil
		}
		return nil, errors.New("查询邀请码失败")
	}

	// 检查邀请码是否有效
	isValid := invitation.IsValid()
	message := ""

	if !isValid {
		if !invitation.IsActive {
			message = "邀请码已被禁用"
		} else if invitation.ExpiresAt != nil && time.Now().After(*invitation.ExpiresAt) {
			message = "邀请码已过期"
		} else if invitation.MaxUses != -1 && invitation.UsedCount >= invitation.MaxUses {
			message = "邀请码使用次数已达上限"
		}
	}

	response := &ValidateInvitationResponse{
		IsValid:   isValid,
		MaxUses:   invitation.MaxUses,
		UsedCount: invitation.UsedCount,
		ExpiresAt: invitation.ExpiresAt,
		Message:   message,
	}

	return response, nil
}

// UseInvitation 使用邀请码
func (s *invitationService) UseInvitation(req UseInvitationRequest) error {
	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 查询邀请码
	var invitation model.InvitationCode
	if err := tx.Where("code = ?", req.Code).First(&invitation).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("邀请码不存在")
		}
		return errors.New("查询邀请码失败")
	}

	// 检查邀请码是否有效
	if !invitation.IsValid() {
		tx.Rollback()
		if !invitation.IsActive {
			return errors.New("邀请码已被禁用")
		} else if invitation.ExpiresAt != nil && time.Now().After(*invitation.ExpiresAt) {
			return errors.New("邀请码已过期")
		} else if invitation.MaxUses != -1 && invitation.UsedCount >= invitation.MaxUses {
			return errors.New("邀请码使用次数已达上限")
		}
		return errors.New("邀请码无效")
	}

	// 检查用户是否已使用过该邀请码
	var existingUse model.InvitationUse
	if err := tx.Where("invitation_code = ? AND used_by = ?", req.Code, req.UserID).First(&existingUse).Error; err == nil {
		tx.Rollback()
		return errors.New("您已使用过此邀请码")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		tx.Rollback()
		return errors.New("查询使用记录失败")
	}

	// 创建使用记录
	invitationUse := model.InvitationUse{
		InvitationCode: req.Code,
		UsedBy:         req.UserID,
		UsedAt:         time.Now(),
		IPAddress:      req.IPAddress,
		UserAgent:      req.UserAgent,
	}

	if err := tx.Create(&invitationUse).Error; err != nil {
		tx.Rollback()
		return errors.New("创建使用记录失败")
	}

	// 更新邀请码使用次数
	if err := tx.Model(&invitation).Update("used_count", gorm.Expr("used_count + 1")).Error; err != nil {
		tx.Rollback()
		return errors.New("更新使用次数失败")
	}

	tx.Commit()
	return nil
}

// GetInvitationList 获取邀请码列表（管理员）
func (s *invitationService) GetInvitationList(page, limit string) (*InvitationListResponse, error) {
	pageInt, _ := strconv.Atoi(page)
	limitInt, _ := strconv.Atoi(limit)

	if pageInt <= 0 {
		pageInt = 1
	}
	if limitInt <= 0 || limitInt > 100 {
		limitInt = 20
	}

	offset := (pageInt - 1) * limitInt

	var invitations []model.InvitationCode
	var total int64

	// 查询总数
	if err := global.DB.Model(&model.InvitationCode{}).Count(&total).Error; err != nil {
		return nil, errors.New("查询邀请码总数失败")
	}

	// 分页查询，关联创建者
	if err := global.DB.Preload("Creator").
		Order("created_at DESC").
		Limit(limitInt).
		Offset(offset).
		Find(&invitations).Error; err != nil {
		return nil, errors.New("查询邀请码列表失败")
	}

	// 转换为响应格式
	data := make([]InvitationCodeResponse, 0, len(invitations))
	for _, inv := range invitations {
		data = append(data, InvitationCodeResponse{
			Code:      inv.Code,
			ExpiresAt: inv.ExpiresAt,
			MaxUses:   inv.MaxUses,
			UsedCount: inv.UsedCount,
			CreatedAt: inv.CreatedAt,
			IsActive:  inv.IsActive,
			Note:      inv.Note,
			CreatorID: inv.CreatorID,
			Creator:   inv.Creator.Name,
		})
	}

	response := &InvitationListResponse{
		Data:  data,
		Total: total,
		Page:  pageInt,
		Limit: limitInt,
	}

	return response, nil
}

// DeactivateInvitation 禁用邀请码（管理员）
func (s *invitationService) DeactivateInvitation(code string) error {
	// 查询邀请码
	var invitation model.InvitationCode
	if err := global.DB.Where("code = ?", code).First(&invitation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("邀请码不存在")
		}
		return errors.New("查询邀请码失败")
	}

	// 更新状态
	if err := global.DB.Model(&invitation).Update("is_active", false).Error; err != nil {
		return errors.New("禁用邀请码失败")
	}

	return nil
}

// ActivateInvitation 激活邀请码（管理员）
func (s *invitationService) ActivateInvitation(code string) error {
	// 查询邀请码
	var invitation model.InvitationCode
	if err := global.DB.Where("code = ?", code).First(&invitation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("邀请码不存在")
		}
		return errors.New("查询邀请码失败")
	}

	// 更新状态
	if err := global.DB.Model(&invitation).Update("is_active", true).Error; err != nil {
		return errors.New("激活邀请码失败")
	}

	return nil
}

// GetInvitationDetail 获取邀请码详情
func (s *invitationService) GetInvitationDetail(code string) (*InvitationCodeResponse, error) {
	var invitation model.InvitationCode
	if err := global.DB.Preload("Creator").Where("code = ?", code).First(&invitation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("邀请码不存在")
		}
		return nil, errors.New("查询邀请码失败")
	}

	response := &InvitationCodeResponse{
		Code:      invitation.Code,
		ExpiresAt: invitation.ExpiresAt,
		MaxUses:   invitation.MaxUses,
		UsedCount: invitation.UsedCount,
		CreatedAt: invitation.CreatedAt,
		IsActive:  invitation.IsActive,
		Note:      invitation.Note,
		CreatorID: invitation.CreatorID,
		Creator:   invitation.Creator.Name,
	}

	return response, nil
}

// UpdateInvitation 更新单个邀请码（管理员）
func (s *invitationService) UpdateInvitation(code string, req UpdateInvitationRequest) error {
	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 查询邀请码是否存在
	var invitation model.InvitationCode
	if err := tx.Where("code = ?", code).First(&invitation).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("邀请码不存在")
		}
		return errors.New("查询邀请码失败")
	}

	// 构建更新字段
	updates := make(map[string]interface{})

	// 更新使用次数上限
	if req.MaxUses != nil {
		if *req.MaxUses < -1 || *req.MaxUses == 0 {
			tx.Rollback()
			return errors.New("使用次数必须为 -1（无限次）或大于 0")
		}
		updates["max_uses"] = *req.MaxUses
	}

	// 更新过期时间
	if req.ExpiresInDays != nil {
		if *req.ExpiresInDays == 0 {
			// 0 表示设为永不过期
			updates["expires_at"] = nil
		} else if *req.ExpiresInDays > 0 {
			// 计算新的过期时间
			expires := time.Now().AddDate(0, 0, *req.ExpiresInDays)
			updates["expires_at"] = expires
		} else {
			tx.Rollback()
			return errors.New("有效期必须大于等于 0")
		}
	}

	// 更新备注
	if req.Note != nil {
		updates["note"] = *req.Note
	}

	// 如果没有要更新的字段
	if len(updates) == 0 {
		tx.Rollback()
		return errors.New("没有需要更新的字段")
	}

	// 执行更新
	if err := tx.Model(&invitation).Updates(updates).Error; err != nil {
		tx.Rollback()
		return errors.New("更新邀请码失败")
	}

	tx.Commit()
	return nil
}

// BatchUpdateInvitation 批量更新邀请码（管理员）
func (s *invitationService) BatchUpdateInvitation(req BatchUpdateInvitationRequest) error {
	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 检查所有邀请码是否存在
	var count int64
	if err := tx.Model(&model.InvitationCode{}).Where("code IN ?", req.Codes).Count(&count).Error; err != nil {
		tx.Rollback()
		return errors.New("查询邀请码失败")
	}

	if int(count) != len(req.Codes) {
		tx.Rollback()
		return errors.New("部分邀请码不存在")
	}

	// 构建更新字段
	updates := make(map[string]interface{})

	// 更新使用次数上限
	if req.MaxUses != nil {
		if *req.MaxUses < -1 || *req.MaxUses == 0 {
			tx.Rollback()
			return errors.New("使用次数必须为 -1（无限次）或大于 0")
		}
		updates["max_uses"] = *req.MaxUses
	}

	// 更新过期时间
	if req.ExpiresInDays != nil {
		if *req.ExpiresInDays == 0 {
			// 0 表示设为永不过期
			updates["expires_at"] = nil
		} else if *req.ExpiresInDays > 0 {
			// 计算新的过期时间
			expires := time.Now().AddDate(0, 0, *req.ExpiresInDays)
			updates["expires_at"] = expires
		} else {
			tx.Rollback()
			return errors.New("有效期必须大于等于 0")
		}
	}

	// 如果没有要更新的字段
	if len(updates) == 0 {
		tx.Rollback()
		return errors.New("没有需要更新的字段")
	}

	// 执行批量更新
	if err := tx.Model(&model.InvitationCode{}).Where("code IN ?", req.Codes).Updates(updates).Error; err != nil {
		tx.Rollback()
		return errors.New("批量更新邀请码失败")
	}

	tx.Commit()
	return nil
}
