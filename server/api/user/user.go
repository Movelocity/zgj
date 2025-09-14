package user

import (
	"fmt"
	"path/filepath"
	"strconv"
	"time"

	"server/global"
	"server/service"
	userService "server/service/user"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// Register 用户注册
func Register(c *gin.Context) {
	var req userService.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 验证短信验证码
	if !utils.VerifySMSCode(req.Phone, req.SmsCode) {
		utils.FailWithMessage("验证码错误或已过期", c)
		return
	}

	// 调用服务层
	if err := service.UserService.Register(req.Name, req.Phone, req.Password); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("注册成功", c)
}

// Login 用户登录
func Login(c *gin.Context) {
	var req userService.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	token, userInfo, err := service.UserService.Login(req.Phone, req.Password)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	response := userService.LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(global.CONFIG.JWT.ExpiresTime),
		User:      *userInfo,
	}

	utils.OkWithData(response, c)
}

// SendSMS 发送短信验证码
func SendSMS(c *gin.Context) {
	var req userService.SendSMSRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 生成验证码
	code := utils.GenerateSMSCode()

	// 发送短信
	if err := utils.SendSMS(req.Phone, code); err != nil {
		utils.FailWithMessage("短信发送失败", c)
		return
	}

	utils.OkWithMessage("验证码发送成功", c)
}

// VerifySMS 验证短信验证码
func VerifySMS(c *gin.Context) {
	var req userService.VerifySMSRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	if utils.VerifySMSCode(req.Phone, req.SmsCode) {
		utils.OkWithMessage("验证成功", c)
	} else {
		utils.FailWithMessage("验证码错误或已过期", c)
	}
}

// ResetPassword 重置密码
func ResetPassword(c *gin.Context) {
	var req userService.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 验证短信验证码
	if !utils.VerifySMSCode(req.Phone, req.SmsCode) {
		utils.FailWithMessage("验证码错误或已过期", c)
		return
	}

	// 调用服务层
	if err := service.UserService.ResetPassword(req.Phone, req.NewPassword); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("密码重置成功", c)
}

// GetUserProfile 获取用户信息
func GetUserProfile(c *gin.Context) {
	userID := c.GetString("userID")

	// 调用服务层
	profile, err := service.UserService.GetUserProfile(userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(profile, c)
}

// UpdateUserProfile 更新用户信息
func UpdateUserProfile(c *gin.Context) {
	userID := c.GetString("userID")
	var req userService.UpdateUserProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	if err := service.UserService.UpdateUserProfile(userID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("更新成功", c)
}

// UnifiedAuth 统一认证接口（自动注册+登录）
func UnifiedAuth(c *gin.Context) {
	var req userService.UnifiedAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 验证短信验证码
	if !utils.VerifySMSCode(req.Phone, req.SmsCode) {
		utils.FailWithMessage("验证码错误或已过期", c)
		return
	}

	// 调用统一认证服务
	token, userInfo, isNewUser, err := service.UserService.LoginOrRegister(req.Phone, req.Name)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	response := userService.UnifiedAuthResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(global.CONFIG.JWT.ExpiresTime),
		User:      *userInfo,
		IsNewUser: isNewUser,
	}

	utils.OkWithData(response, c)
}

// Logout 用户登出
func Logout(c *gin.Context) {
	// 这里可以将token加入黑名单，或者删除相关缓存
	utils.OkWithMessage("登出成功", c)
}

// UploadAvatar 上传头像
func UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		utils.FailWithMessage("文件上传失败", c)
		return
	}

	// 检查文件类型和大小
	if !utils.IsAllowedImageType(file.Header.Get("Content-Type")) {
		utils.FailWithMessage("不支持的图片格式", c)
		return
	}

	if !utils.CheckFileSize(file.Size, global.CONFIG.Upload.ImageMaxSize) {
		utils.FailWithMessage("文件大小超出限制", c)
		return
	}

	// 生成文件名和路径
	filename := utils.GenerateFileName(file.Filename)
	dst := filepath.Join(global.CONFIG.Local.StorePath, "avatars", filename)

	// 保存文件
	if err := utils.UploadFile(file, dst); err != nil {
		utils.FailWithMessage("文件保存失败", c)
		return
	}

	response := userService.UploadResponse{
		URL:      fmt.Sprintf("/uploads/file/avatars/%s", filename),
		Filename: filename,
		Size:     file.Size,
	}

	utils.OkWithData(response, c)
}

// UploadResume 上传简历
func UploadResume(c *gin.Context) {
	file, err := c.FormFile("resume")
	if err != nil {
		utils.FailWithMessage("文件上传失败", c)
		return
	}

	// 检查文件类型和大小
	if !utils.IsAllowedFileType(file.Header.Get("Content-Type")) {
		utils.FailWithMessage("不支持的文件格式", c)
		return
	}

	if !utils.CheckFileSize(file.Size, global.CONFIG.Upload.FileMaxSize) {
		utils.FailWithMessage("文件大小超出限制", c)
		return
	}

	userID := c.GetString("userID")

	// 调用服务层保存简历信息
	resumeInfo, err := service.UserService.UploadResume(userID, file)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(resumeInfo, c)
}

// GetAllUsers 获取所有用户（管理员）- 支持分页
func GetAllUsers(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	// 调用服务层
	users, total, err := service.UserService.GetAllUsers(page, pageSize)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	response := userService.UserListResponse{
		List:     users,
		Total:    total,
		Page:     pageInt,
		PageSize: pageSizeInt,
	}

	utils.OkWithData(response, c)
}

// GetUserByID 根据ID获取用户（管理员）
func GetUserByID(c *gin.Context) {
	userID := c.Param("id")

	// 调用服务层
	userInfo, err := service.UserService.GetUserByID(userID)
	if err != nil {
		if err.Error() == "用户不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithData(userInfo, c)
}

// UpdateUserByAdmin 管理员更新用户信息
func UpdateUserByAdmin(c *gin.Context) {
	userID := c.Param("id")
	var req userService.UpdateUserProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	if err := service.UserService.UpdateUserProfile(userID, req); err != nil {
		if err.Error() == "用户不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithMessage("更新成功", c)
}

// DeleteUser 删除用户（管理员）
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	// 调用服务层
	if err := service.UserService.DeleteUser(userID); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("删除成功", c)
}

// ActivateUser 激活用户（管理员）
func ActivateUser(c *gin.Context) {
	userID := c.Param("id")

	// 调用服务层
	if err := service.UserService.SetUserActive(userID, true); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("用户已激活", c)
}

// DeactivateUser 停用用户（管理员）
func DeactivateUser(c *gin.Context) {
	userID := c.Param("id")

	// 调用服务层
	if err := service.UserService.SetUserActive(userID, false); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("用户已停用", c)
}

// CreateAdmin 创建管理员用户
func CreateAdmin(c *gin.Context) {
	var req userService.CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层创建管理员
	if err := service.UserService.CreateAdmin(req.Name, req.Phone, req.Password, req.Email); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("管理员创建成功", c)
}

// AdminLogin 管理员登录
func AdminLogin(c *gin.Context) {
	var req userService.AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层
	token, userInfo, err := service.UserService.AdminLogin(req.Phone, req.Password)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	response := userService.LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(global.CONFIG.JWT.ExpiresTime),
		User:      *userInfo,
	}

	utils.OkWithData(response, c)
}
