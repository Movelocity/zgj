package asr

import (
	"server/global"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

// SubmitTask 提交识别任务
func SubmitTask(c *gin.Context) {
	// 检查ASR服务是否可用
	if global.ASRService == nil {
		utils.FailWithMessage("ASR服务未启用", c)
		return
	}

	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	var req struct {
		AudioURL    string                 `json:"audio_url" binding:"required"`
		AudioFormat string                 `json:"audio_format" binding:"required"`
		Options     map[string]interface{} `json:"options"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 验证音频格式
	validFormats := map[string]bool{
		"mp3": true,
		"wav": true,
		"ogg": true,
		"raw": true,
	}
	if !validFormats[req.AudioFormat] {
		utils.FailWithMessage("不支持的音频格式，仅支持: mp3, wav, ogg, raw", c)
		return
	}

	// 构造提交请求
	submitReq := &global.ASRSubmitTaskRequest{
		UserID:      userID,
		AudioURL:    req.AudioURL,
		AudioFormat: req.AudioFormat,
		Options:     req.Options,
	}

	// 提交任务
	task, err := global.ASRService.SubmitTask(c.Request.Context(), submitReq)
	if err != nil {
		utils.FailWithMessage("提交识别任务失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(task, c)
}

// GetTask 查询任务详情
func GetTask(c *gin.Context) {
	// 检查ASR服务是否可用
	if global.ASRService == nil {
		utils.FailWithMessage("ASR服务未启用", c)
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		utils.FailWithMessage("任务ID不能为空", c)
		return
	}

	// 获取任务
	task, err := global.ASRService.GetTask(c.Request.Context(), taskID)
	if err != nil {
		utils.FailWithMessage("查询任务失败: "+err.Error(), c)
		return
	}

	// 验证用户权限（只能查看自己的任务）
	userID := c.GetString("userID")
	if task.UserID != userID {
		// 检查是否是管理员
		role := c.GetInt("role")
		if role != 888 { // 888是管理员角色
			utils.FailWithMessage("无权访问该任务", c)
			return
		}
	}

	utils.OkWithData(task, c)
}

// PollTask 轮询任务结果
func PollTask(c *gin.Context) {
	// 检查ASR服务是否可用
	if global.ASRService == nil {
		utils.FailWithMessage("ASR服务未启用", c)
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		utils.FailWithMessage("任务ID不能为空", c)
		return
	}

	// 先获取任务验证权限
	task, err := global.ASRService.GetTask(c.Request.Context(), taskID)
	if err != nil {
		utils.FailWithMessage("查询任务失败: "+err.Error(), c)
		return
	}

	// 验证用户权限
	userID := c.GetString("userID")
	if task.UserID != userID {
		role := c.GetInt("role")
		if role != 888 {
			utils.FailWithMessage("无权访问该任务", c)
			return
		}
	}

	// 轮询任务结果
	updatedTask, err := global.ASRService.PollTask(c.Request.Context(), taskID)
	if err != nil {
		utils.FailWithMessage("轮询任务失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(updatedTask, c)
}

// ListTasks 获取任务列表
func ListTasks(c *gin.Context) {
	// 检查ASR服务是否可用
	if global.ASRService == nil {
		utils.FailWithMessage("ASR服务未启用", c)
		return
	}

	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	// 查询任务列表
	response, err := global.ASRService.ListTasks(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		utils.FailWithMessage("查询任务列表失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// DeleteTask 删除任务
func DeleteTask(c *gin.Context) {
	// 检查ASR服务是否可用
	if global.ASRService == nil {
		utils.FailWithMessage("ASR服务未启用", c)
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		utils.FailWithMessage("任务ID不能为空", c)
		return
	}

	// 先获取任务验证权限
	task, err := global.ASRService.GetTask(c.Request.Context(), taskID)
	if err != nil {
		utils.FailWithMessage("查询任务失败: "+err.Error(), c)
		return
	}

	// 验证用户权限
	userID := c.GetString("userID")
	if task.UserID != userID {
		role := c.GetInt("role")
		if role != 888 {
			utils.FailWithMessage("无权删除该任务", c)
			return
		}
	}

	// 删除任务
	if err := global.ASRService.DeleteTask(c.Request.Context(), taskID); err != nil {
		utils.FailWithMessage("删除任务失败: "+err.Error(), c)
		return
	}

	utils.OkWithMessage("任务删除成功", c)
}

// RetryTask 重试任务
func RetryTask(c *gin.Context) {
	// 检查ASR服务是否可用
	if global.ASRService == nil {
		utils.FailWithMessage("ASR服务未启用", c)
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		utils.FailWithMessage("任务ID不能为空", c)
		return
	}

	// 先获取任务验证权限
	task, err := global.ASRService.GetTask(c.Request.Context(), taskID)
	if err != nil {
		utils.FailWithMessage("查询任务失败: "+err.Error(), c)
		return
	}

	// 验证用户权限
	userID := c.GetString("userID")
	if task.UserID != userID {
		role := c.GetInt("role")
		if role != 888 {
			utils.FailWithMessage("无权重试该任务", c)
			return
		}
	}

	// 重试任务
	retriedTask, err := global.ASRService.RetryTask(c.Request.Context(), taskID)
	if err != nil {
		utils.FailWithMessage("重试任务失败: "+err.Error(), c)
		return
	}

	utils.OkWithData(retriedTask, c)
}
