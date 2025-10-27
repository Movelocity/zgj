package user

import (
	"crypto/rand"
	"encoding/base32"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"server/global"
	"server/model"
	"server/utils"
)

type userService struct{}

var UserService = &userService{}

// generateInvitationCode 生成邀请码（格式：ABCD-EFGH-IJKL）
func (s *userService) generateInvitationCode() string {
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

// createUnlimitedInvitationForUser 为用户创建无限制邀请码
func (s *userService) createUnlimitedInvitationForUser(tx *gorm.DB, userID string) error {
	// 生成唯一邀请码
	var code string
	for {
		code = s.generateInvitationCode()
		// 检查是否已存在
		var existingCode model.InvitationCode
		if err := tx.Where("code = ?", code).First(&existingCode).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				break // 邀请码不存在，可以使用
			}
		}
	}

	// 创建无限制邀请码记录
	invitation := model.InvitationCode{
		Code:      code,
		CreatorID: userID,
		MaxUses:   -1, // -1 表示无限次使用
		UsedCount: 0,
		ExpiresAt: nil,  // nil 表示永不过期
		IsActive:  true, // 激活状态
		Note:      "用户注册自动生成",
	}

	if err := tx.Create(&invitation).Error; err != nil {
		return errors.New("创建邀请码失败")
	}

	fmt.Printf("为用户 %s 自动创建无限制邀请码: %s\n", userID, code)
	return nil
}

// RegisterWithInvitation 使用邀请码注册用户（邀请码选填）
// 如果用户已存在，则直接登录；如果不存在，则注册新用户
func (s *userService) RegisterWithInvitation(phone, name, invitationCode, ipAddress, userAgent string) (string, *UserInfo, string, error) {
	// 检查手机号是否已存在
	var existUser model.User
	err := global.DB.Where("phone = ?", phone).First(&existUser).Error

	if err == nil {
		// 用户已存在，执行登录逻辑
		if !existUser.Active {
			return "", nil, "", errors.New("用户已被停用")
		}

		// 更新最后登录时间
		global.DB.Model(&existUser).Update("last_login", time.Now())

		// 处理邀请码逻辑（如果提供了邀请码）
		if invitationCode != "" {
			// 检查用户是否已有邀请码使用记录
			var existingUse model.InvitationUse
			if err := global.DB.Where("used_by = ?", existUser.ID).First(&existingUse).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					// 用户没有邀请码使用记录，记录新邀请码
					// 验证邀请码
					var invitation model.InvitationCode
					if err := global.DB.Where("code = ?", invitationCode).First(&invitation).Error; err == nil {
						// 邀请码存在且有效，创建使用记录
						if invitation.IsValid() {
							tx := global.DB.Begin()
							invitationUse := model.InvitationUse{
								InvitationCode: invitationCode,
								UsedBy:         existUser.ID,
								UsedAt:         time.Now(),
								IPAddress:      ipAddress,
								UserAgent:      userAgent,
							}
							if err := tx.Create(&invitationUse).Error; err == nil {
								// 更新邀请码使用次数
								tx.Model(&invitation).Update("used_count", gorm.Expr("used_count + ?", 1))
								tx.Commit()
							} else {
								tx.Rollback()
							}
						}
					}
					// 忽略邀请码验证失败的情况，因为用户已存在
				}
				// 如果用户已有邀请码使用记录，忽略新邀请码
			}
		}

		// 生成JWT token
		token, err := utils.GenerateToken(existUser.ID, existUser.Name, existUser.Role)
		if err != nil {
			return "", nil, "", errors.New("token生成失败")
		}

		// 构建用户信息
		userInfo := &UserInfo{
			ID:        existUser.ID,
			Name:      existUser.Name,
			Phone:     existUser.Phone,
			Email:     existUser.Email,
			HeaderImg: existUser.HeaderImg,
			Role:      existUser.Role,
			Active:    existUser.Active,
			LastLogin: existUser.LastLogin,
			CreatedAt: existUser.CreatedAt,
		}

		return token, userInfo, "已有账号，直接登录", nil
	}

	// 用户不存在，执行注册逻辑
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return "", nil, "", errors.New("数据库查询失败")
	}

	// 如果提供了邀请码，需要验证
	var invitation *model.InvitationCode
	if invitationCode != "" {
		var inv model.InvitationCode
		if err := global.DB.Where("code = ?", invitationCode).First(&inv).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return "", nil, "", errors.New("邀请码不存在")
			}
			return "", nil, "", errors.New("查询邀请码失败")
		}

		// 检查邀请码是否有效
		if !inv.IsValid() {
			if !inv.IsActive {
				return "", nil, "", errors.New("邀请码已被禁用")
			} else if inv.ExpiresAt != nil && time.Now().After(*inv.ExpiresAt) {
				return "", nil, "", errors.New("邀请码已过期")
			} else if inv.MaxUses != -1 && inv.UsedCount >= inv.MaxUses {
				return "", nil, "", errors.New("邀请码使用次数已达上限")
			}
			return "", nil, "", errors.New("邀请码无效")
		}
		invitation = &inv
	}

	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 检查系统中是否已有用户，如果没有则第一个注册的用户为管理员
	var userCount int64
	tx.Model(&model.User{}).Where("active = ?", true).Count(&userCount)

	userRole := 666 // 默认为普通用户
	if userCount == 0 {
		userRole = 888 // 第一个用户设为管理员
	}

	// 如果没有提供用户名，使用手机号后4位
	if name == "" {
		name = "用户" + phone[len(phone)-4:]
	}

	// 创建用户（设置默认密码）
	hashedDefaultPassword, _ := utils.HashPassword("123456")
	newUser := model.User{
		ID:       utils.GenerateTLID(),
		Name:     name,
		Phone:    phone,
		Password: hashedDefaultPassword,
		Active:   true,
		Role:     userRole,
	}

	if err := tx.Create(&newUser).Error; err != nil {
		tx.Rollback()
		return "", nil, "", errors.New("用户创建失败")
	}

	// 创建用户档案
	userProfile := model.UserProfile{
		ID:      utils.GenerateTLID(),
		UserID:  newUser.ID,
		Data:    model.JSON("{}"),
		Resumes: model.JSON("[]"),
	}

	if err := tx.Create(&userProfile).Error; err != nil {
		tx.Rollback()
		return "", nil, "", errors.New("用户档案创建失败")
	}

	// 如果提供了邀请码，创建邀请码使用记录
	if invitation != nil {
		invitationUse := model.InvitationUse{
			InvitationCode: invitationCode,
			UsedBy:         newUser.ID,
			UsedAt:         time.Now(),
			IPAddress:      ipAddress,
			UserAgent:      userAgent,
		}

		if err := tx.Create(&invitationUse).Error; err != nil {
			tx.Rollback()
			return "", nil, "", errors.New("创建邀请码使用记录失败")
		}

		// 更新邀请码使用次数
		if err := tx.Model(invitation).Update("used_count", gorm.Expr("used_count + ?", 1)).Error; err != nil {
			tx.Rollback()
			return "", nil, "", errors.New("更新邀请码使用次数失败")
		}
	}

	// 为新用户创建无限制邀请码
	if err := s.createUnlimitedInvitationForUser(tx, newUser.ID); err != nil {
		tx.Rollback()
		return "", nil, "", err
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return "", nil, "", errors.New("注册失败")
	}

	// 如果是第一个用户（管理员），输出提示信息
	if userRole == 888 {
		fmt.Printf("首个用户注册成功，已自动设为管理员 - 手机号: %s, 用户名: %s\n", phone, name)
	}

	// 生成JWT token
	token, err := utils.GenerateToken(newUser.ID, newUser.Name, newUser.Role)
	if err != nil {
		return "", nil, "", errors.New("token生成失败")
	}

	// 构建用户信息
	userInfo := &UserInfo{
		ID:        newUser.ID,
		Name:      newUser.Name,
		Phone:     newUser.Phone,
		Email:     newUser.Email,
		HeaderImg: newUser.HeaderImg,
		Role:      newUser.Role,
		Active:    newUser.Active,
		LastLogin: newUser.LastLogin,
		CreatedAt: newUser.CreatedAt,
	}

	return token, userInfo, "", nil
}

// Login 用户登录
func (s *userService) Login(phone, password string) (string, *UserInfo, error) {
	// 查找用户
	var u model.User
	if err := global.DB.Where("phone = ? AND active = ?", phone, true).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, errors.New("用户不存在或已被停用")
		}
		return "", nil, errors.New("数据库查询失败")
	}

	// 验证密码
	if !utils.CheckPasswordHash(password, u.Password) {
		return "", nil, errors.New("密码错误")
	}

	// 更新最后登录时间
	global.DB.Model(&u).Update("last_login", time.Now())

	// 生成JWT token
	token, err := utils.GenerateToken(u.ID, u.Name, u.Role)
	if err != nil {
		return "", nil, errors.New("token生成失败")
	}

	// 构建用户信息
	userInfo := &UserInfo{
		ID:        u.ID,
		Name:      u.Name,
		Phone:     u.Phone,
		Email:     u.Email,
		HeaderImg: u.HeaderImg,
		Role:      u.Role,
		Active:    u.Active,
		LastLogin: u.LastLogin,
		CreatedAt: u.CreatedAt,
	}

	return token, userInfo, nil
}

// ResetPassword 重置密码
func (s *userService) ResetPassword(phone, newPassword string) error {
	// 查找用户
	var u model.User
	if err := global.DB.Where("phone = ?", phone).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在")
		}
		return errors.New("数据库查询失败")
	}

	// 哈希新密码
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("密码加密失败")
	}

	// 更新密码
	if err := global.DB.Model(&u).Update("password", hashedPassword).Error; err != nil {
		return errors.New("密码更新失败")
	}

	return nil
}

// ChangePassword 修改密码（需要验证当前密码）
func (s *userService) ChangePassword(userID string, req ChangePasswordRequest) error {
	// 查找用户
	var u model.User
	if err := global.DB.Where("id = ? AND active = ?", userID, true).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在或已被停用")
		}
		return errors.New("数据库查询失败")
	}

	// 验证当前密码
	if !utils.CheckPasswordHash(req.CurrentPassword, u.Password) {
		return errors.New("当前密码错误")
	}

	// 检查新密码是否与当前密码相同
	if utils.CheckPasswordHash(req.NewPassword, u.Password) {
		return errors.New("新密码不能与当前密码相同")
	}

	// 哈希新密码
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return errors.New("密码加密失败")
	}

	// 更新密码
	if err := global.DB.Model(&u).Update("password", hashedPassword).Error; err != nil {
		return errors.New("密码更新失败")
	}

	return nil
}

// GetUserProfile 获取用户档案
func (s *userService) GetUserProfile(userID string) (*UserProfileResponse, error) {
	// 获取用户信息
	var u model.User
	if err := global.DB.First(&u, "id = ?", userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	// 获取用户档案
	var profile model.UserProfile
	if err := global.DB.First(&profile, "user_id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 用户档案不存在，但用户存在（老用户情况），自动创建默认档案
			profile = model.UserProfile{
				ID:      utils.GenerateTLID(),
				UserID:  userID,
				Data:    model.JSON("{}"),
				Resumes: model.JSON("[]"),
			}

			// 创建默认用户档案
			if err := global.DB.Create(&profile).Error; err != nil {
				return nil, errors.New("创建默认用户档案失败")
			}
		} else {
			return nil, errors.New("查询用户档案失败")
		}
	}

	// 解析数据
	var data any
	var resumes any

	if len(profile.Data) > 0 {
		json.Unmarshal(profile.Data, &data)
	}
	if len(profile.Resumes) > 0 {
		json.Unmarshal(profile.Resumes, &resumes)
	}

	userInfo := UserInfo{
		ID:        u.ID,
		Name:      u.Name,
		Phone:     u.Phone,
		Email:     u.Email,
		HeaderImg: u.HeaderImg,
		Role:      u.Role,
		Active:    u.Active,
		LastLogin: u.LastLogin,
		CreatedAt: u.CreatedAt,
	}

	response := &UserProfileResponse{
		User:    userInfo,
		Data:    data,
		Resumes: resumes,
	}

	return response, nil
}

// UpdateUserProfile 更新用户档案
func (s *userService) UpdateUserProfile(userID string, req UpdateUserProfileRequest) error {
	// 先检查用户是否存在
	var existingUser model.User
	if err := global.DB.Where("id = ?", userID).First(&existingUser).Error; err != nil {
		return errors.New("用户不存在")
	}

	// 更新用户基本信息
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.HeaderImg != "" {
		updates["header_img"] = req.HeaderImg
	}

	if len(updates) > 0 {
		if err := global.DB.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
			return errors.New("用户信息更新失败")
		}
	}

	// 更新用户档案数据
	if req.Data != nil {
		dataJSON, err := json.Marshal(req.Data)
		if err != nil {
			return errors.New("数据格式错误")
		}

		// 检查用户档案是否存在，不存在则创建
		var profile model.UserProfile
		if err := global.DB.First(&profile, "user_id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// 用户档案不存在，创建默认档案
				profile = model.UserProfile{
					ID:      utils.GenerateTLID(),
					UserID:  userID,
					Data:    model.JSON(dataJSON),
					Resumes: model.JSON("[]"),
				}

				if err := global.DB.Create(&profile).Error; err != nil {
					return errors.New("创建默认用户档案失败")
				}
			} else {
				return errors.New("查询用户档案失败")
			}
		} else {
			// 更新现有档案
			if err := global.DB.Model(&profile).Update("data", model.JSON(dataJSON)).Error; err != nil {
				return errors.New("用户档案更新失败")
			}
		}
	}

	return nil
}

// GetAllUsers 获取所有用户（管理员）- 支持分页
func (s *userService) GetAllUsers(page, pageSize string) ([]UserInfo, int64, error) {
	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	if pageInt <= 0 {
		pageInt = 1
	}
	if pageSizeInt <= 0 || pageSizeInt > 100 {
		pageSizeInt = 10
	}

	offset := (pageInt - 1) * pageSizeInt

	var users []model.User
	var total int64

	// 查询总数
	if err := global.DB.Model(&model.User{}).Count(&total).Error; err != nil {
		return nil, 0, errors.New("查询用户总数失败")
	}

	// 分页查询
	if err := global.DB.Order("created_at DESC").
		Limit(pageSizeInt).
		Offset(offset).
		Find(&users).Error; err != nil {
		return nil, 0, errors.New("查询用户失败")
	}

	var userInfos []UserInfo
	for _, u := range users {
		userInfo := UserInfo{
			ID:        u.ID,
			Name:      u.Name,
			Phone:     u.Phone,
			Email:     u.Email,
			HeaderImg: u.HeaderImg,
			Role:      u.Role,
			Active:    u.Active,
			LastLogin: u.LastLogin,
			CreatedAt: u.CreatedAt,
		}
		userInfos = append(userInfos, userInfo)
	}

	return userInfos, total, nil
}

// GetUserByID 根据ID获取用户
func (s *userService) GetUserByID(userID string) (*UserInfo, error) {
	var u model.User
	if err := global.DB.First(&u, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.New("查询用户失败")
	}

	userInfo := &UserInfo{
		ID:        u.ID,
		Name:      u.Name,
		Phone:     u.Phone,
		Email:     u.Email,
		HeaderImg: u.HeaderImg,
		Role:      u.Role,
		Active:    u.Active,
		LastLogin: u.LastLogin,
		CreatedAt: u.CreatedAt,
	}

	return userInfo, nil
}

// DeleteUser 删除用户
func (s *userService) DeleteUser(userID string) error {
	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除用户档案
	if err := tx.Where("user_id = ?", userID).Delete(&model.UserProfile{}).Error; err != nil {
		tx.Rollback()
		return errors.New("删除用户档案失败")
	}

	// 删除用户对话
	if err := tx.Where("user_id = ?", userID).Delete(&model.Conversation{}).Error; err != nil {
		tx.Rollback()
		return errors.New("删除用户对话失败")
	}

	// 删除用户工作流
	if err := tx.Where("creator_id = ?", userID).Delete(&model.Workflow{}).Error; err != nil {
		tx.Rollback()
		return errors.New("删除用户工作流失败")
	}

	// 删除用户
	if err := tx.Where("id = ?", userID).Delete(&model.User{}).Error; err != nil {
		tx.Rollback()
		return errors.New("删除用户失败")
	}

	tx.Commit()
	return nil
}

// SetUserActive 设置用户激活状态
func (s *userService) SetUserActive(userID string, active bool) error {
	if err := global.DB.Model(&model.User{}).Where("id = ?", userID).Update("active", active).Error; err != nil {
		return errors.New("更新用户状态失败")
	}
	return nil
}

// LoginOrRegister 统一认证接口 - 自动登录或注册
func (s *userService) LoginOrRegister(phone, name string) (string, *UserInfo, bool, error) {
	// 尝试查找现有用户
	var existingUser model.User
	err := global.DB.Where("phone = ?", phone).First(&existingUser).Error

	if err == nil {
		// 用户存在，执行登录逻辑
		if !existingUser.Active {
			return "", nil, false, errors.New("用户已被停用")
		}

		// 更新最后登录时间
		global.DB.Model(&existingUser).Update("last_login", time.Now())

		// 生成JWT token
		token, err := utils.GenerateToken(existingUser.ID, existingUser.Name, existingUser.Role)
		if err != nil {
			return "", nil, false, errors.New("token生成失败")
		}

		// 构建用户信息
		userInfo := &UserInfo{
			ID:        existingUser.ID,
			Name:      existingUser.Name,
			Phone:     existingUser.Phone,
			Email:     existingUser.Email,
			HeaderImg: existingUser.HeaderImg,
			Role:      existingUser.Role,
			Active:    existingUser.Active,
			LastLogin: existingUser.LastLogin,
			CreatedAt: existingUser.CreatedAt,
		}

		return token, userInfo, false, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return "", nil, false, errors.New("数据库查询失败")
	}

	// 用户不存在，自动注册
	if name == "" {
		name = "用户" + phone[len(phone)-4:] // 使用手机号后4位作为默认用户名
	}

	// 检查系统中是否已有用户，如果没有则第一个注册的用户为管理员
	var userCount int64
	global.DB.Model(&model.User{}).Where("active = ?", true).Count(&userCount)

	userRole := 666 // 默认为普通用户
	if userCount == 0 {
		userRole = 888 // 第一个用户设为管理员
	}

	// 开启事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 创建新用户（无需密码）
	hashedDefaultPassword, _ := utils.HashPassword("123456") // 设置默认密码，用户可后续修改
	newUser := model.User{
		ID:       utils.GenerateTLID(),
		Name:     name,
		Phone:    phone,
		Password: hashedDefaultPassword,
		Active:   true,
		Role:     userRole,
	}

	if err := tx.Create(&newUser).Error; err != nil {
		tx.Rollback()
		return "", nil, false, errors.New("用户创建失败")
	}

	// 创建用户档案
	userProfile := model.UserProfile{
		ID:      utils.GenerateTLID(),
		UserID:  newUser.ID,
		Data:    model.JSON("{}"),
		Resumes: model.JSON("[]"),
	}

	if err := tx.Create(&userProfile).Error; err != nil {
		tx.Rollback()
		return "", nil, false, errors.New("用户档案创建失败")
	}

	// 为新用户创建无限制邀请码
	if err := s.createUnlimitedInvitationForUser(tx, newUser.ID); err != nil {
		tx.Rollback()
		return "", nil, false, err
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return "", nil, false, errors.New("注册失败")
	}

	// 如果是第一个用户（管理员），输出提示信息
	if userRole == 888 {
		fmt.Printf("首个用户通过统一认证注册成功，已自动设为管理员 - 手机号: %s, 用户名: %s\n", phone, name)
	}

	// 生成JWT token
	token, err := utils.GenerateToken(newUser.ID, newUser.Name, newUser.Role)
	if err != nil {
		return "", nil, false, errors.New("token生成失败")
	}

	// 构建用户信息
	userInfo := &UserInfo{
		ID:        newUser.ID,
		Name:      newUser.Name,
		Phone:     newUser.Phone,
		Email:     newUser.Email,
		HeaderImg: newUser.HeaderImg,
		Role:      newUser.Role,
		Active:    newUser.Active,
		LastLogin: newUser.LastLogin,
		CreatedAt: newUser.CreatedAt,
	}

	return token, userInfo, true, nil
}

// UpdateUserRole 更新用户角色权限
func (s *userService) UpdateUserRole(userID string, role int) error {
	// 验证角色值是否合法
	if role != 666 && role != 888 {
		return errors.New("无效的角色值，只支持 666(普通用户) 或 888(管理员)")
	}

	// 检查用户是否存在
	var user model.User
	if err := global.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在")
		}
		return errors.New("查询用户失败")
	}

	// 更新用户角色
	if err := global.DB.Model(&user).Update("role", role).Error; err != nil {
		return errors.New("更新用户角色失败")
	}

	return nil
}

// AdminChangePassword 管理员修改用户密码（不需要原密码）
func (s *userService) AdminChangePassword(userID string, newPassword string) error {
	// 查找用户
	var u model.User
	if err := global.DB.Where("id = ?", userID).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在")
		}
		return errors.New("数据库查询失败")
	}

	// 哈希新密码
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("密码加密失败")
	}

	// 更新密码
	if err := global.DB.Model(&u).Update("password", hashedPassword).Error; err != nil {
		return errors.New("密码更新失败")
	}

	return nil
}
