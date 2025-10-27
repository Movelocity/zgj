package sitevariable

import (
	"server/service"
	siteVariableService "server/service/sitevariable"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

// CreateSiteVariable 创建网站变量（管理员）
func CreateSiteVariable(c *gin.Context) {
	var req siteVariableService.CreateSiteVariableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	if err := service.SiteVariableService.CreateSiteVariable(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("创建成功", c)
}

// UpdateSiteVariable 更新网站变量（管理员）
func UpdateSiteVariable(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的ID", c)
		return
	}

	var req siteVariableService.UpdateSiteVariableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	if err := service.SiteVariableService.UpdateSiteVariable(id, &req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("更新成功", c)
}

// DeleteSiteVariable 删除网站变量（管理员）
func DeleteSiteVariable(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的ID", c)
		return
	}

	if err := service.SiteVariableService.DeleteSiteVariable(id); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("删除成功", c)
}

// GetSiteVariableList 获取网站变量列表（管理员）
func GetSiteVariableList(c *gin.Context) {
	var req siteVariableService.GetSiteVariableListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	// 设置默认值
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 20
	}

	list, err := service.SiteVariableService.GetSiteVariableList(&req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(list, c)
}

// GetSiteVariableByKey 通过key获取网站变量（公开）
func GetSiteVariableByKey(c *gin.Context) {
	key := c.Query("key")
	if key == "" {
		utils.FailWithMessage("key参数不能为空", c)
		return
	}

	variable, err := service.SiteVariableService.GetSiteVariableByKey(key)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(variable, c)
}

// GetSiteVariableByID 通过ID获取网站变量详情（管理员）
func GetSiteVariableByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的ID", c)
		return
	}

	variable, err := service.SiteVariableService.GetSiteVariableByID(id)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(variable, c)
}
