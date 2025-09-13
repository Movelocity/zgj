package user

import (
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"time"

	"server/global"
	"server/model"
	"server/types/user"
	"server/utils"

	"gorm.io/gorm"
)

type userService struct{}

var UserService = &userService{}

// Register 用户注册
func (s *userService) Register(name, phone, password string) error {
	// 检查手机号是否已存在
	var existUser model.User
	if err := global.DB.Where("phone = ? AND active = ?", phone, true).First(&existUser).Error; err == nil {
		return errors.New("手机号已被注册")
	}

	// 哈希密码
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return errors.New("密码加密失败")
	}

	// 创建用户
	newUser := model.User{
		ID:       utils.GenerateTLID(),
		Name:     name,
		Phone:    phone,
		Password: hashedPassword,
		Active:   true,
		Role:     666, // 普通用户
	}

	if err := global.DB.Create(&newUser).Error; err != nil {
		return errors.New("用户创建失败")
	}

	// 创建用户档案
	userProfile := model.UserProfile{
		ID:      utils.GenerateTLID(),
		UserID:  newUser.ID,
		Data:    model.JSON("{}"),
		Resumes: model.JSON("[]"),
	}

	if err := global.DB.Create(&userProfile).Error; err != nil {
		return errors.New("用户档案创建失败")
	}

	return nil
}

// Login 用户登录
func (s *userService) Login(phone, password string) (string, *user.UserInfo, error) {
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
	userInfo := &user.UserInfo{
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

// GetUserProfile 获取用户档案
func (s *userService) GetUserProfile(userID string) (*user.UserProfileResponse, error) {
	// 获取用户信息
	var u model.User
	if err := global.DB.First(&u, "id = ?", userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	// 获取用户档案
	var profile model.UserProfile
	if err := global.DB.First(&profile, "user_id = ?", userID).Error; err != nil {
		return nil, errors.New("用户档案不存在")
	}

	// 解析数据
	var data interface{}
	var resumes interface{}

	if len(profile.Data) > 0 {
		json.Unmarshal(profile.Data, &data)
	}
	if len(profile.Resumes) > 0 {
		json.Unmarshal(profile.Resumes, &resumes)
	}

	userInfo := user.UserInfo{
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

	response := &user.UserProfileResponse{
		User:    userInfo,
		Data:    data,
		Resumes: resumes,
	}

	return response, nil
}

// UpdateUserProfile 更新用户档案
func (s *userService) UpdateUserProfile(userID string, req user.UpdateUserProfileRequest) error {
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

		if err := global.DB.Model(&model.UserProfile{}).Where("user_id = ?", userID).Update("data", model.JSON(dataJSON)).Error; err != nil {
			return errors.New("用户档案更新失败")
		}
	}

	return nil
}

// UploadResume 上传简历
func (s *userService) UploadResume(userID string, file *multipart.FileHeader) (*user.UploadResponse, error) {
	// 生成文件名和路径
	filename := utils.GenerateFileName(file.Filename)
	dst := filepath.Join(global.CONFIG.Local.StorePath, "resumes", filename)

	// 保存文件
	if err := utils.UploadFile(file, dst); err != nil {
		return nil, errors.New("文件保存失败")
	}

	// 构建简历信息
	resume := model.Resume{
		Name:      file.Filename,
		URL:       fmt.Sprintf("/uploads/file/resumes/%s", filename),
		Size:      file.Size,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 获取现有简历列表
	var profile model.UserProfile
	if err := global.DB.First(&profile, "user_id = ?", userID).Error; err != nil {
		return nil, errors.New("用户档案不存在")
	}

	var resumes []model.Resume
	if len(profile.Resumes) > 0 {
		json.Unmarshal(profile.Resumes, &resumes)
	}

	// 添加新简历
	resumes = append(resumes, resume)

	// 更新简历列表
	resumesJSON, err := json.Marshal(resumes)
	if err != nil {
		return nil, errors.New("数据序列化失败")
	}

	if err := global.DB.Model(&profile).Update("resumes", model.JSON(resumesJSON)).Error; err != nil {
		return nil, errors.New("简历信息保存失败")
	}

	response := &user.UploadResponse{
		URL:      resume.URL,
		Filename: filename,
		Size:     file.Size,
	}

	return response, nil
}

// GetAllUsers 获取所有用户（管理员）
func (s *userService) GetAllUsers() ([]user.UserInfo, error) {
	var users []model.User
	if err := global.DB.Find(&users).Error; err != nil {
		return nil, errors.New("查询用户失败")
	}

	var userInfos []user.UserInfo
	for _, u := range users {
		userInfo := user.UserInfo{
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

	return userInfos, nil
}

// GetUserByID 根据ID获取用户
func (s *userService) GetUserByID(userID string) (*user.UserInfo, error) {
	var u model.User
	if err := global.DB.First(&u, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.New("查询用户失败")
	}

	userInfo := &user.UserInfo{
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
