package invitation

import (
	"server/service"
	invitationService "server/service/invitation"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// CreateInvitation 创建邀请码
func CreateInvitation(c *gin.Context) {
	userID := c.GetString("userID")
	var req invitationService.CreateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 调用服务层
	response, err := service.InvitationService.CreateInvitation(userID, req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// AdminCreateInvitation 管理员为指定用户创建邀请码
func AdminCreateInvitation(c *gin.Context) {
	var req invitationService.AdminCreateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 调用服务层
	response, err := service.InvitationService.AdminCreateInvitation(req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// ValidateInvitation 验证邀请码
func ValidateInvitation(c *gin.Context) {
	var req invitationService.ValidateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 调用服务层
	response, err := service.InvitationService.ValidateInvitation(req.Code)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// UseInvitation 使用邀请码（需要用户登录）
func UseInvitation(c *gin.Context) {
	// 从 JWT 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("用户未登录", c)
		return
	}

	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 构建完整请求
	useReq := invitationService.UseInvitationRequest{
		Code:      req.Code,
		UserID:    userID,
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}

	// 调用服务层
	if err := service.InvitationService.UseInvitation(useReq); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("邀请码使用成功", c)
}

// GetUserInvitationUse 查询用户的邀请码使用记录
func GetUserInvitationUse(c *gin.Context) {
	// 从 JWT 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("用户未登录", c)
		return
	}

	// 调用服务层
	response, err := service.InvitationService.GetUserInvitationUse(userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// GetUserCreatedInvitationList 获取用户创建的邀请码列表
func GetUserCreatedInvitationList(c *gin.Context) {
	// 从 JWT 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("用户未登录", c)
		return
	}

	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	// 调用服务层
	response, err := service.InvitationService.GetUserCreatedInvitationList(userID, page, limit)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// GetInvitationList 获取邀请码列表（管理员）
func GetInvitationList(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	// 调用服务层
	response, err := service.InvitationService.GetInvitationList(page, limit)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// DeactivateInvitation 禁用邀请码（管理员）
func DeactivateInvitation(c *gin.Context) {
	code := c.Param("code")

	// 调用服务层
	if err := service.InvitationService.DeactivateInvitation(code); err != nil {
		if err.Error() == "邀请码不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithMessage("邀请码已禁用", c)
}

// ActivateInvitation 激活邀请码（管理员）
func ActivateInvitation(c *gin.Context) {
	code := c.Param("code")

	// 调用服务层
	if err := service.InvitationService.ActivateInvitation(code); err != nil {
		if err.Error() == "邀请码不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithMessage("邀请码已激活", c)
}

// GetInvitationDetail 获取邀请码详情（管理员）
func GetInvitationDetail(c *gin.Context) {
	code := c.Param("code")

	// 调用服务层
	response, err := service.InvitationService.GetInvitationDetail(code)
	if err != nil {
		if err.Error() == "邀请码不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithData(response, c)
}

// UpdateInvitation 更新单个邀请码（管理员）
func UpdateInvitation(c *gin.Context) {
	code := c.Param("code")
	var req invitationService.UpdateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 调用服务层
	if err := service.InvitationService.UpdateInvitation(code, req); err != nil {
		if err.Error() == "邀请码不存在" {
			utils.FailWithNotFound(err.Error(), c)
		} else {
			utils.FailWithMessage(err.Error(), c)
		}
		return
	}

	utils.OkWithMessage("更新成功", c)
}

// BatchUpdateInvitation 批量更新邀请码（管理员）
func BatchUpdateInvitation(c *gin.Context) {
	var req invitationService.BatchUpdateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 调用服务层
	if err := service.InvitationService.BatchUpdateInvitation(req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("批量更新成功", c)
}

// GetOrCreateNormalInvitation 获取或创建普通邀请码
func GetOrCreateNormalInvitation(c *gin.Context) {
	// 从 JWT 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("用户未登录", c)
		return
	}

	// 调用服务层
	response, err := service.InvitationService.GetOrCreateNormalInvitation(userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}
