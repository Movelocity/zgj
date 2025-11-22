package user

import (
	"fmt"
	"strconv"
	"time"

	"server/global"
	"server/model"
	"server/service"
	fileService "server/service/file"
	userService "server/service/user"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// Register 用户注册（邀请码选填）
// 如果用户已存在则直接登录
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

	// 获取IP和UserAgent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 调用服务层注册（邀请码选填）
	token, userInfo, message, err := service.UserService.RegisterWithInvitation(req.Phone, req.Name, req.InvitationCode, ipAddress, userAgent)
	if err != nil {
		// 记录注册失败事件
		global.EventLogService.LogLoginFailed(req.Phone, ipAddress, userAgent, "注册失败: "+err.Error())
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 记录注册成功事件
	global.EventLogService.LogUserRegister(userInfo.ID, req.Phone, ipAddress, userAgent)

	response := userService.LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(global.CONFIG.JWT.ExpiresTime),
		User:      *userInfo,
		Message:   message,
	}

	utils.OkWithData(response, c)
}

// Login 用户登录
func Login(c *gin.Context) {
	var req userService.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 获取IP和UserAgent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 调用服务层
	token, userInfo, err := service.UserService.Login(req.Phone, req.Password)
	if err != nil {
		// 记录登录失败事件
		global.EventLogService.LogLoginFailed(req.Phone, ipAddress, userAgent, err.Error())
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 记录登录成功事件
	global.EventLogService.LogUserLogin(userInfo.ID, ipAddress, userAgent)

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

	// 获取IP和UserAgent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 生成验证码
	code := utils.GenerateSMSCode()

	// 发送短信
	retryCount, err := utils.SendSMS(req.Phone, code)
	if err != nil {
		// 记录发送失败事件（包含验证码和重试次数）
		global.EventLogService.LogSMSSent(req.Phone, code, ipAddress, userAgent, false, retryCount)
		utils.FailWithMessage("短信发送失败", c)
		return
	}

	// 记录发送成功事件（包含验证码和重试次数）
	global.EventLogService.LogSMSSent(req.Phone, code, ipAddress, userAgent, true, retryCount)

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

	// 获取IP和UserAgent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 调用服务层
	if err := service.UserService.ResetPassword(req.Phone, req.NewPassword); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 获取用户ID记录事件（需要查询用户）
	var user model.User
	if err := global.DB.Where("phone = ?", req.Phone).First(&user).Error; err == nil {
		global.EventLogService.LogPasswordReset(user.ID, ipAddress, userAgent)
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

	// 获取IP和UserAgent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 调用服务层
	if err := service.UserService.UpdateUserProfile(userID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 记录资料更新事件
	global.EventLogService.LogProfileUpdate(userID, ipAddress, userAgent)

	utils.OkWithMessage("更新成功", c)
}

// ChangePassword 修改密码
func ChangePassword(c *gin.Context) {
	userID := c.GetString("userID")
	var req userService.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 获取IP和UserAgent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 调用服务层
	if err := service.UserService.ChangePassword(userID, req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 记录密码修改事件
	global.EventLogService.LogPasswordChange(userID, ipAddress, userAgent)

	utils.OkWithMessage("密码修改成功", c)
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

	// 获取IP和UserAgent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 调用统一认证服务
	token, userInfo, isNewUser, err := service.UserService.LoginOrRegister(req.Phone, req.Name)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 记录认证事件
	if isNewUser {
		global.EventLogService.LogUserRegister(userInfo.ID, req.Phone, ipAddress, userAgent)
	} else {
		global.EventLogService.LogUserLogin(userInfo.ID, ipAddress, userAgent)
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
	// 获取用户ID和请求信息
	userID := c.GetString("userID")
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// 记录登出事件
	if userID != "" {
		global.EventLogService.LogUserLogout(userID, ipAddress, userAgent)
	}

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

	userID := c.GetString("userID")

	// 使用统一文件服务上传文件
	uploadedFile, err := fileService.FileService.UploadFile(userID, file, false)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 获取IP和UserAgent，记录头像上传事件
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	global.EventLogService.LogAvatarUpload(userID, ipAddress, userAgent)

	response := userService.UploadResponse{
		URL:      fmt.Sprintf("/api/files/%s/preview", uploadedFile.ID), // 使用文件预览API
		Filename: uploadedFile.Name,
		Size:     file.Size,
	}

	utils.OkWithData(response, c)
}

// UploadResume 上传简历
// func UploadResume(c *gin.Context) {
// 	file, err := c.FormFile("resume")
// 	if err != nil {
// 		utils.FailWithMessage("文件上传失败", c)
// 		return
// 	}

// 	// 检查文件类型和大小
// 	if !utils.IsAllowedFileType(file.Header.Get("Content-Type")) {
// 		utils.FailWithMessage("不支持的文件格式", c)
// 		return
// 	}

// 	if !utils.CheckFileSize(file.Size, global.CONFIG.Upload.FileMaxSize) {
// 		utils.FailWithMessage("文件大小超出限制", c)
// 		return
// 	}

// 	userID := c.GetString("userID")

// 	// 调用服务层保存简历信息
// 	resumeInfo, err := service.UserService.UploadResume(userID, file)
// 	if err != nil {
// 		utils.FailWithMessage(err.Error(), c)
// 		return
// 	}

// 	utils.OkWithData(resumeInfo, c)
// }

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

// UpdateUserRole 更新用户角色权限
func UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")
	var req userService.UpdateUserRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层更新用户角色
	if err := service.UserService.UpdateUserRole(userID, req.Role); err != nil {
		if err.Error() == "用户不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithMessage("用户角色更新成功", c)
}

// AdminChangePassword 管理员修改用户密码
func AdminChangePassword(c *gin.Context) {
	userID := c.Param("id")
	var req userService.AdminChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 调用服务层修改用户密码
	if err := service.UserService.AdminChangePassword(userID, req.NewPassword); err != nil {
		if err.Error() == "用户不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithMessage("用户密码修改成功", c)
}
