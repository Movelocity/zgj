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

// UseInvitation 使用邀请码
func UseInvitation(c *gin.Context) {
	var req invitationService.UseInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误", c)
		return
	}

	// 获取请求IP和UserAgent
	req.IPAddress = c.ClientIP()
	req.UserAgent = c.Request.UserAgent()

	// 调用服务层
	if err := service.InvitationService.UseInvitation(req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("邀请码使用成功", c)
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
