package opportunity

import (
	"strconv"

	opportunityService "server/service/opportunity"
	"server/utils"

	"github.com/gin-gonic/gin"
)

// ListPublicOpportunities 获取公开岗位列表
func ListPublicOpportunities(c *gin.Context) {
	var req opportunityService.OpportunityListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	list, err := opportunityService.OpportunityService.ListPublic(&req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(list, c)
}

// ListAdminOpportunities 获取管理员岗位列表
func ListAdminOpportunities(c *gin.Context) {
	var req opportunityService.OpportunityListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	list, err := opportunityService.OpportunityService.List(&req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(list, c)
}

// CreateOpportunity 创建岗位
func CreateOpportunity(c *gin.Context) {
	var req opportunityService.OpportunityUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	userID, _ := c.Get("userID")
	createdBy, _ := userID.(string)
	opportunity, err := opportunityService.OpportunityService.Create(&req, createdBy)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithDetailed(opportunity, "创建成功", c)
}

// BatchCreateOpportunities 批量创建岗位
func BatchCreateOpportunities(c *gin.Context) {
	var req opportunityService.OpportunityBatchCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	userID, _ := c.Get("userID")
	createdBy, _ := userID.(string)
	opportunities, err := opportunityService.OpportunityService.BatchCreate(&req, createdBy)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithDetailed(opportunities, "批量创建成功", c)
}

// UpdateOpportunity 更新岗位
func UpdateOpportunity(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的ID", c)
		return
	}

	var req opportunityService.OpportunityUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	opportunity, err := opportunityService.OpportunityService.Update(id, &req)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithDetailed(opportunity, "更新成功", c)
}

// ArchiveOpportunity 下架岗位
func ArchiveOpportunity(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.FailWithMessage("无效的ID", c)
		return
	}

	if err := opportunityService.OpportunityService.Archive(id); err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithMessage("下架成功", c)
}
