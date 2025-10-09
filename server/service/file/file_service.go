package file

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"

	"gorm.io/gorm"

	"server/global"
	"server/model"
	"server/utils"
)

type fileService struct{}

var FileService = &fileService{}

// UploadFile 上传文件（统一接口）
func (s *fileService) UploadFile(userID string, fileHeader *multipart.FileHeader, toDify bool) (*UploadFileResponse, error) {
	// 验证用户ID
	if userID == "" {
		return nil, errors.New("无效的用户ID")
	}

	// 检查用户是否存在
	var user model.User
	if err := global.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.New("数据库查询失败")
	}

	// 检查文件大小
	maxSize := global.CONFIG.Upload.FileMaxSize
	if fileHeader.Header.Get("Content-Type") != "" && strings.HasPrefix(fileHeader.Header.Get("Content-Type"), "image/") {
		maxSize = global.CONFIG.Upload.ImageMaxSize
	}
	if !utils.CheckFileSize(fileHeader.Size, maxSize) {
		return nil, errors.New("文件大小超出限制")
	}

	// 检查文件类型
	contentType := fileHeader.Header.Get("Content-Type")
	if !s.isAllowedFileType(contentType) {
		return nil, errors.New("不支持的文件类型")
	}

	// 计算文件哈希值
	fileHash, err := utils.CalculateFileHash(fileHeader)
	if err != nil {
		return nil, errors.New("计算文件哈希失败")
	}

	// 检查是否已存在相同哈希的文件
	var existingFile model.File
	if err := global.DB.Where("hash = ?", fileHash).First(&existingFile).Error; err == nil {
		// 文件已存在，直接返回现有文件信息
		return &UploadFileResponse{
			ID:        existingFile.ID,
			Name:      existingFile.OriginalName,
			Size:      existingFile.Size,
			Extension: existingFile.Extension,
			MimeType:  existingFile.MimeType,
			CreatedBy: existingFile.CreatedBy,
			CreatedAt: existingFile.CreatedAt,
		}, nil
	}

	// 生成文件ID和获取扩展名
	fileID := utils.GenerateTLID()
	extension := s.getFileExtension(fileHeader.Filename)
	mimeType := s.getMimeTypeFromExtension(extension)
	if mimeType == "" {
		mimeType = contentType
	}
	fmt.Println("[mimeType] ", mimeType)

	var difyId string
	if toDify {
		wName := "upload_file"
		workflow := model.Workflow{}
		if err := global.DB.Model(&model.Workflow{}).Where("name = ? AND enabled = ?", wName, true).First(&workflow).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, fmt.Errorf("未找到名为 '%s' 的启用工作流", wName)
			}
			return nil, fmt.Errorf("查询文件上传工作流失败: %v", err)
		}

		url := workflow.ApiURL
		apiKey := workflow.ApiKey

		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		filePart, err := writer.CreateFormFile("file", fileHeader.Filename)
		if err != nil {
			return nil, fmt.Errorf("创建文件表单失败: %v", err)
		}

		file, err := fileHeader.Open()
		if err != nil {
			return nil, fmt.Errorf("打开文件失败: %v", err)
		}
		defer file.Close()

		_, err = io.Copy(filePart, file)
		if err != nil {
			return nil, fmt.Errorf("复制文件内容失败: %v", err)
		}
		writer.WriteField("type", mimeType)
		writer.WriteField("user", userID)
		writer.Close()

		req, err := http.NewRequest("POST", url, body)
		if err != nil {
			return nil, fmt.Errorf("创建请求失败: %v", err)
		}

		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+apiKey)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("发送请求失败: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			bodyBytes, _ := io.ReadAll(resp.Body)
			bodyStr := string(bodyBytes)

			utils.Logger.Error("Dify API返回错误状态码",
				zap.Int("status_code", resp.StatusCode),
				zap.String("response_body", bodyStr))

			return nil, fmt.Errorf("dify api 返回错误状态码: %d, 响应: %s", resp.StatusCode, bodyStr)
		}

		var response struct {
			ID string `json:"id"`
			// Name      string `json:"name"`
			// Size      int64  `json:"size"`
			// Extension string `json:"extension"`
			// MimeType  string `json:"mime_type"`
			// CreatedBy int64  `json:"created_by"`
			// CreatedAt int64  `json:"created_at"`
		}

		fmt.Println("[response upload file] ", zap.Any("response", resp.Body))

		if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
			return nil, fmt.Errorf("解析响应失败: %v", err)
		}

		difyId = response.ID
	} else {
		difyId = ""
	}

	// 创建文件记录
	file := model.File{
		ID:           fileID,
		Hash:         fileHash,
		DifyID:       difyId,
		OriginalName: fileHeader.Filename,
		Extension:    extension,
		MimeType:     mimeType,
		Size:         fileHeader.Size,
		CreatedBy:    userID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// 保存到数据库
	if err := global.DB.Create(&file).Error; err != nil {
		return nil, errors.New("保存文件记录失败")
	}

	// 保存物理文件
	if err := s.savePhysicalFile(fileHeader, &file); err != nil {
		// 如果物理文件保存失败，删除数据库记录
		global.DB.Delete(&file)
		return nil, err
	}

	return &UploadFileResponse{
		ID:        file.ID,
		Name:      file.OriginalName,
		Size:      file.Size,
		Extension: file.Extension,
		MimeType:  file.MimeType,
		CreatedBy: file.CreatedBy,
		CreatedAt: file.CreatedAt,
	}, nil
}

// GetFileByID 根据ID获取文件信息
func (s *fileService) GetFileByID(fileID string) (*model.File, error) {
	var file model.File
	if err := global.DB.Preload("User").First(&file, "id = ?", fileID).Error; err != nil {
		return nil, errors.New("文件不存在")
	}
	return &file, nil
}

// GetFilePhysicalPath 获取文件物理路径
func (s *fileService) GetFilePhysicalPath(file *model.File) string {
	return filepath.Join(global.CONFIG.Local.StorePath, file.GetStoragePath())
}

// GetFileStats 获取文件统计信息
func (s *fileService) GetFileStats() (*FileStatsResponse, error) {
	var stats FileStatsResponse

	// 统计总文件数量
	if err := global.DB.Model(&model.File{}).Count(&stats.TotalFiles).Error; err != nil {
		return nil, errors.New("查询文件统计失败")
	}

	// 统计简历文件数量（通过MIME类型或扩展名判断）
	resumeMimeTypes := []string{"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}
	if err := global.DB.Model(&model.File{}).Where("mime_type IN ?", resumeMimeTypes).Count(&stats.TotalResumes).Error; err != nil {
		return nil, errors.New("查询简历文件统计失败")
	}

	// 统计头像文件数量
	if err := global.DB.Model(&model.File{}).Where("mime_type LIKE ?", "image/%").Count(&stats.TotalAvatars).Error; err != nil {
		return nil, errors.New("查询头像文件统计失败")
	}

	// 计算文件总大小
	global.DB.Model(&model.File{}).Select("COALESCE(SUM(size), 0)").Scan(&stats.TotalSize)

	// 获取存储路径信息
	storagePath := global.CONFIG.Local.StorePath
	stats.StoragePath = storagePath

	// 计算存储使用情况
	if info, err := os.Stat(storagePath); err == nil && info.IsDir() {
		stats.StorageUsed = s.calculateDirSize(storagePath)
	}

	return &stats, nil
}

// GetFileList 获取文件列表（管理员）
func (s *fileService) GetFileList(page, pageSize, fileType string) (*FileListResponse, error) {
	pageInt, _ := strconv.Atoi(page)
	pageSizeInt, _ := strconv.Atoi(pageSize)

	if pageInt <= 0 {
		pageInt = 1
	}
	if pageSizeInt <= 0 || pageSizeInt > 100 {
		pageSizeInt = 20
	}

	offset := (pageInt - 1) * pageSizeInt

	var files []model.File
	var total int64

	query := global.DB.Model(&model.File{}).Preload("User")

	// 根据文件类型过滤
	switch fileType {
	case "resume", "resumes":
		resumeMimeTypes := []string{"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}
		query = query.Where("mime_type IN ?", resumeMimeTypes)
	case "avatar", "avatars", "image":
		query = query.Where("mime_type LIKE ?", "image/%")
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.New("查询文件总数失败")
	}

	// 分页查询
	if err := query.Order("created_at DESC").
		Limit(pageSizeInt).Offset(offset).Find(&files).Error; err != nil {
		return nil, errors.New("查询文件列表失败")
	}

	// 转换为响应格式
	var fileInfos []FileInfo
	for _, file := range files {
		fileType := s.getFileTypeByMime(file.MimeType)
		fileInfos = append(fileInfos, FileInfo{
			ID:           file.ID,
			Name:         file.GetFileName(),
			OriginalName: file.OriginalName,
			// Path:         "/files/" + file.ID + "/preview",  // 严格禁止这种用法 ！！！
			Size:      file.Size,
			Type:      fileType,
			MimeType:  file.MimeType,
			UserID:    file.CreatedBy,
			UserName:  file.User.Name,
			CreatedAt: file.CreatedAt,
			UpdatedAt: file.UpdatedAt,
		})
	}

	response := &FileListResponse{
		List:     fileInfos,
		Total:    total,
		Page:     pageInt,
		PageSize: pageSizeInt,
	}

	return response, nil
}

// DeleteFile 删除文件
func (s *fileService) DeleteFile(fileID string) error {
	var file model.File
	if err := global.DB.First(&file, "id = ?", fileID).Error; err != nil {
		return errors.New("文件不存在")
	}

	// 删除物理文件
	physicalPath := s.GetFilePhysicalPath(&file)
	if _, err := os.Stat(physicalPath); err == nil {
		os.Remove(physicalPath)
	}

	// 删除数据库记录
	if err := global.DB.Delete(&file).Error; err != nil {
		return errors.New("删除文件记录失败")
	}

	return nil
}

// BatchDeleteFiles 批量删除文件
func (s *fileService) BatchDeleteFiles(fileIDs []string) error {
	for _, fileID := range fileIDs {
		if err := s.DeleteFile(fileID); err != nil {
			return err
		}
	}
	return nil
}

// savePhysicalFile 保存物理文件
func (s *fileService) savePhysicalFile(fileHeader *multipart.FileHeader, file *model.File) error {
	// 创建目录结构
	storagePath := file.GetStoragePath()
	fullPath := filepath.Join(global.CONFIG.Local.StorePath, storagePath)

	// 确保目录存在
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return errors.New("创建存储目录失败")
	}

	// 保存文件
	if err := utils.UploadFile(fileHeader, fullPath); err != nil {
		return errors.New("保存文件失败")
	}

	return nil
}

// isAllowedFileType 检查文件类型是否允许
func (s *fileService) isAllowedFileType(contentType string) bool {
	allowedImages := strings.Split(global.CONFIG.Upload.AllowImageTypes, ",")
	allowedFiles := strings.Split(global.CONFIG.Upload.AllowFileTypes, ",")

	for _, allowed := range allowedImages {
		if strings.TrimSpace(allowed) == contentType {
			return true
		}
	}

	for _, allowed := range allowedFiles {
		if strings.TrimSpace(allowed) == contentType {
			return true
		}
	}

	return false
}

// getFileExtension 获取文件扩展名
func (s *fileService) getFileExtension(filename string) string {
	ext := filepath.Ext(filename)
	if ext != "" {
		return strings.TrimPrefix(ext, ".")
	}
	return ""
}

// getMimeTypeFromExtension 根据扩展名获取MIME类型
func (s *fileService) getMimeTypeFromExtension(ext string) string {
	switch strings.ToLower(ext) {
	case "pdf":
		return "application/pdf"
	case "doc":
		return "application/msword"
	case "docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case "txt":
		return "text/plain"
	case "jpg", "jpeg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "gif":
		return "image/gif"
	case "webp":
		return "image/webp"
	default:
		return ""
	}
}

// getFileTypeByMime 根据MIME类型获取文件类型
func (s *fileService) getFileTypeByMime(mimeType string) string {
	if strings.HasPrefix(mimeType, "image/") {
		return "image"
	}
	switch mimeType {
	case "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain":
		return "document"
	default:
		return "file"
	}
}

// calculateDirSize 计算目录大小
func (s *fileService) calculateDirSize(path string) int64 {
	var size int64
	filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() {
			size += info.Size()
		}
		return nil
	})
	return size
}

// // copyFile 复制文件
// func (s *fileService) copyFile(src, dst string) error {
// 	sourceFile, err := os.Open(src)
// 	if err != nil {
// 		return err
// 	}
// 	defer sourceFile.Close()

// 	destFile, err := os.Create(dst)
// 	if err != nil {
// 		return err
// 	}
// 	defer destFile.Close()

// 	_, err = destFile.ReadFrom(sourceFile)
// 	return err
// }

// // getFileSize 获取文件大小
// func (s *fileService) getFileSize(filePath string) int64 {
// 	fullPath := filepath.Join(global.CONFIG.Local.StorePath, strings.TrimPrefix(filePath, "/uploads/file/"))
// 	if info, err := os.Stat(fullPath); err == nil {
// 		return info.Size()
// 	}
// 	return 0
// }
