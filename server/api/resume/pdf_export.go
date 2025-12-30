package resume

import (
	"net/http"

	"server/service/pdfexport"

	"github.com/gin-gonic/gin"
)

// CreateExportTask 创建PDF导出任务
func CreateExportTask(c *gin.Context) {
	// 1. 解析请求
	var req struct {
		ResumeID string `json:"resume_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	// 2. 获取当前用户ID
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusOK, gin.H{
			"code": 401,
			"msg":  "未登录",
		})
		return
	}

	// 3. 调用服务层创建任务
	taskID, err := pdfexport.CreateExportTask(userID, req.ResumeID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 500,
			"msg":  err.Error(),
		})
		return
	}

	// 4. 返回任务ID
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": gin.H{
			"task_id": taskID,
			"status":  "pending",
		},
		"msg": "任务创建成功",
	})
}

// GetExportTaskStatus 查询任务状态
func GetExportTaskStatus(c *gin.Context) {
	// 1. 解析路径参数
	taskID := c.Param("taskId")
	if taskID == "" {
		c.JSON(http.StatusOK, gin.H{
			"code": 400,
			"msg":  "任务ID不能为空",
		})
		return
	}

	// 2. 调用服务层查询状态
	task, err := pdfexport.GetTaskStatus(taskID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 404,
			"msg":  err.Error(),
		})
		return
	}

	// 3. 返回任务状态
	data := gin.H{
		"task_id":    task.ID,
		"status":     task.Status,
		"created_at": task.CreatedAt,
	}

	if task.Status == "completed" {
		data["pdf_url"] = "/api/resume/export/download/" + task.ID
		data["completed_at"] = task.CompletedAt
	}

	if task.Status == "failed" {
		data["error_message"] = task.ErrorMessage
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": data,
		"msg":  "success",
	})
}

// DownloadExportPdf 下载PDF文件
func DownloadExportPdf(c *gin.Context) {
	// 1. 解析路径参数
	taskID := c.Param("taskId")
	if taskID == "" {
		c.JSON(http.StatusOK, gin.H{
			"code": 400,
			"msg":  "任务ID不能为空",
		})
		return
	}

	// 2. 调用服务层获取文件路径
	filePath, err := pdfexport.GetPdfFilePath(taskID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 404,
			"msg":  err.Error(),
		})
		return
	}

	// 3. 设置文件名
	filename := "resume_" + taskID + ".pdf"

	// 4. 返回文件
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.File(filePath)
}

// VerifyTokenAndGetResume 验证token并返回简历数据（用于渲染页面）
func VerifyTokenAndGetResume(c *gin.Context) {
	// 1. 解析参数
	taskID := c.Param("taskId")
	token := c.Query("token")

	if taskID == "" || token == "" {
		c.JSON(http.StatusOK, gin.H{
			"code": 400,
			"msg":  "参数缺失",
		})
		return
	}

	// 2. 验证token并获取简历数据
	resumeData, err := pdfexport.VerifyTokenAndGetResume(taskID, token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 401,
			"msg":  err.Error(),
		})
		return
	}

	// 3. 返回简历数据
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": resumeData,
		"msg":  "success",
	})
}
