package pdfexport

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"server/global"
	"server/model"
	"server/utils"

	"github.com/google/uuid"
)

// CreateExportTask 创建PDF导出任务
func CreateExportTask(userID, resumeID string) (string, error) {
	// 1. 查询简历记录
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		return "", errors.New("简历不存在或无权限访问")
	}

	// 2. 生成任务ID和token
	taskID := utils.GenerateTLID()
	token := uuid.New().String()

	// 3. 创建任务记录 (status=pending)
	task := model.PdfExportTask{
		ID:        taskID,
		UserID:    userID,
		ResumeID:  resumeID,
		Status:    model.PdfExportStatusPending,
		Token:     token,
		TokenUsed: false,
		CreatedAt: time.Now(),
	}

	if err := global.DB.Create(&task).Error; err != nil {
		return "", fmt.Errorf("创建任务记录失败: %w", err)
	}

	// 4. 异步调用PDF生成
	go GeneratePdfAsync(taskID)

	return taskID, nil
}

// GetTaskStatus 查询任务状态
func GetTaskStatus(taskID string) (*model.PdfExportTask, error) {
	var task model.PdfExportTask
	if err := global.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		return nil, errors.New("任务不存在")
	}
	return &task, nil
}

// GeneratePdfAsync 异步生成PDF
func GeneratePdfAsync(taskID string) {
	// 1. 获取任务信息
	var task model.PdfExportTask
	if err := global.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		log.Printf("查询任务失败: %v", err)
		return
	}

	// 2. 更新任务状态为processing
	if err := global.DB.Model(&model.PdfExportTask{}).Where("id = ?", taskID).
		Updates(map[string]interface{}{
			"status": model.PdfExportStatusProcessing,
		}).Error; err != nil {
		log.Printf("更新任务状态失败: %v", err)
		return
	}

	// 3. 获取配置
	nodeURL := global.CONFIG.PdfExport.NodeServiceURL
	renderBaseURL := global.CONFIG.PdfExport.RenderBaseURL
	if nodeURL == "" || renderBaseURL == "" {
		updateTaskFailed(taskID, "PDF服务配置不完整")
		return
	}

	// 4. 构建渲染URL
	renderURL := fmt.Sprintf("%s/export/%s?token=%s", renderBaseURL, taskID, task.Token)

	// 5. 构建请求体
	requestBody := map[string]interface{}{
		"task_id":    taskID,
		"render_url": renderURL,
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		updateTaskFailed(taskID, fmt.Sprintf("构建请求失败: %v", err))
		return
	}

	// 6. 发送HTTP POST请求
	client := &http.Client{
		Timeout: 120 * time.Second,
	}

	resp, err := client.Post(nodeURL+"/generate", "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		updateTaskFailed(taskID, fmt.Sprintf("调用PDF服务失败: %v", err))
		return
	}
	defer resp.Body.Close()

	// 7. 检查响应状态
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		updateTaskFailed(taskID, fmt.Sprintf("PDF生成失败: HTTP %d - %s", resp.StatusCode, string(bodyBytes)))
		return
	}

	// 8. 读取PDF数据
	pdfData, err := io.ReadAll(resp.Body)
	if err != nil {
		updateTaskFailed(taskID, fmt.Sprintf("读取PDF失败: %v", err))
		return
	}

	// 9. 保存文件
	if err := SavePdfFile(taskID, pdfData); err != nil {
		updateTaskFailed(taskID, fmt.Sprintf("保存PDF失败: %v", err))
		return
	}

	log.Printf("PDF生成成功: task_id=%s", taskID)
}

// SavePdfFile 保存PDF文件
func SavePdfFile(taskID string, fileData []byte) error {
	// 1. 创建目录 server/uploads/pdf/YYYY-MM-DD/
	now := time.Now()
	dateDir := now.Format("2006-01-02")
	pdfDir := filepath.Join("uploads", "pdf", dateDir)

	if err := os.MkdirAll(pdfDir, 0755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}

	// 2. 保存PDF文件
	filename := fmt.Sprintf("%s.pdf", taskID)
	filePath := filepath.Join(pdfDir, filename)

	if err := os.WriteFile(filePath, fileData, 0644); err != nil {
		return fmt.Errorf("写入文件失败: %w", err)
	}

	// 3. 更新任务记录
	completedAt := time.Now()
	if err := global.DB.Model(&model.PdfExportTask{}).Where("id = ?", taskID).
		Updates(map[string]interface{}{
			"status":        model.PdfExportStatusCompleted,
			"pdf_file_path": filePath,
			"completed_at":  completedAt,
		}).Error; err != nil {
		return fmt.Errorf("更新任务记录失败: %w", err)
	}

	return nil
}

// GetPdfFilePath 获取PDF文件路径
func GetPdfFilePath(taskID string) (string, error) {
	var task model.PdfExportTask
	if err := global.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		return "", errors.New("任务不存在")
	}

	if task.Status != model.PdfExportStatusCompleted {
		return "", errors.New("PDF尚未生成完成")
	}

	if task.PdfFilePath == "" {
		return "", errors.New("PDF文件路径为空")
	}

	// 检查文件是否存在
	if _, err := os.Stat(task.PdfFilePath); os.IsNotExist(err) {
		return "", errors.New("PDF文件不存在或已过期")
	}

	return task.PdfFilePath, nil
}

// VerifyTokenAndGetResume 验证token并返回简历数据
func VerifyTokenAndGetResume(taskID, token string) (map[string]interface{}, error) {
	// 1. 查询任务
	var task model.PdfExportTask
	if err := global.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		return nil, errors.New("任务不存在")
	}

	// 2. 验证token
	if task.Token != token {
		return nil, errors.New("无效的访问令牌")
	}

	// 3. 检查token是否过期（10分钟）
	// 只使用时间限制，允许在有效期内多次访问（Puppeteer需要多次加载页面资源）
	if time.Since(task.CreatedAt) > 10*time.Minute {
		return nil, errors.New("访问令牌已过期")
	}

	// 4. 不再标记token为已使用，因为Puppeteer需要多次访问同一页面
	// token有效期通过时间限制来控制（10分钟）

	// 6. 获取简历数据
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ?", task.ResumeID).First(&resume).Error; err != nil {
		return nil, errors.New("简历不存在")
	}

	// 7. 解析简历数据
	var resumeData map[string]interface{}
	if err := json.Unmarshal(resume.StructuredData, &resumeData); err != nil {
		return nil, fmt.Errorf("解析简历数据失败: %w", err)
	}

	return resumeData, nil
}

// updateTaskFailed 更新任务为失败状态
func updateTaskFailed(taskID string, errorMessage string) {
	log.Printf("任务失败: task_id=%s, error=%s", taskID, errorMessage)
	global.DB.Model(&model.PdfExportTask{}).Where("id = ?", taskID).
		Updates(map[string]interface{}{
			"status":        model.PdfExportStatusFailed,
			"error_message": errorMessage,
		})
}
