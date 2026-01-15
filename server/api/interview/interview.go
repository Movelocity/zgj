package interview

import (
	"server/service/interview"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

// CreateReviewRequest 创建面试复盘记录请求
// 基于TOS文件信息创建，ASR任务将在后续步骤中触发
type CreateReviewRequest struct {
	TosFileKey    string `json:"tos_file_key" binding:"required"`   // TOS文件key
	AudioFilename string `json:"audio_filename" binding:"required"` // 音频文件名
}

// CreateReview 创建面试复盘记录
// 在TOS上传完成后立即调用，创建pending状态的记录
func CreateReview(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 创建记录
	review, err := interview.InterviewService.CreateInterviewReview(userID, req.TosFileKey, req.AudioFilename)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(review, c)
}

// GetReview 获取面试复盘记录详情
func GetReview(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 获取记录ID
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("记录ID格式错误", c)
		return
	}

	// 获取记录
	review, err := interview.InterviewService.GetInterviewReview(reviewID, userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(review, c)
}

// ListReviews 获取用户的面试复盘记录列表
func ListReviews(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	// 查询列表
	response, err := interview.InterviewService.ListInterviewReviews(userID, page, pageSize)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(response, c)
}

// UpdateReviewMetadataRequest 更新面试复盘元数据请求
type UpdateReviewMetadataRequest struct {
	Metadata map[string]interface{} `json:"metadata" binding:"required"` // 要更新的元数据字段
}

// UpdateReviewMetadata 更新面试复盘记录元数据（如岗位、公司等）
func UpdateReviewMetadata(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 获取记录ID
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("记录ID格式错误", c)
		return
	}

	var req UpdateReviewMetadataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.FailWithMessage("请求参数错误: "+err.Error(), c)
		return
	}

	// 更新元数据
	review, err := interview.InterviewService.UpdateReviewMetadata(reviewID, userID, req.Metadata)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(review, c)
}

// TriggerAnalysis 触发面试分析工作流
func TriggerAnalysis(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 获取记录ID
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("记录ID格式错误", c)
		return
	}

	// 触发分析
	review, err := interview.InterviewService.TriggerAnalysis(reviewID, userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(review, c)
}

// StartASR 启动ASR语音识别任务
// 使用存储的tos_file_key生成临时URL并提交ASR任务
func StartASR(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 获取记录ID
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("记录ID格式错误", c)
		return
	}

	// 启动ASR
	review, err := interview.InterviewService.StartASR(reviewID, userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(review, c)
}

// RetryASR 重试ASR语音识别任务
// 在ASR失败后使用存储的tos_file_key生成新URL并重新提交任务
func RetryASR(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 获取记录ID
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("记录ID格式错误", c)
		return
	}

	// 重试ASR
	review, err := interview.InterviewService.RetryASR(reviewID, userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(review, c)
}

// SyncASRResult 从ASR表同步识别结果
// 直接从asr_tasks表获取数据并更新到interview_review的metadata中
func SyncASRResult(c *gin.Context) {
	// 获取用户ID
	userID := c.GetString("userID")
	if userID == "" {
		utils.FailWithMessage("无法识别用户", c)
		return
	}

	// 获取记录ID
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseInt(reviewIDStr, 10, 64)
	if err != nil {
		utils.FailWithMessage("记录ID格式错误", c)
		return
	}

	// 同步ASR结果
	review, err := interview.InterviewService.SyncASRResult(reviewID, userID)
	if err != nil {
		utils.FailWithMessage(err.Error(), c)
		return
	}

	utils.OkWithData(review, c)
}
