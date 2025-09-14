package file

import (
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"server/global"
	"server/model"
)

type fileService struct{}

var FileService = &fileService{}

// GetFileStats 获取文件统计信息
func (s *fileService) GetFileStats() (*FileStatsResponse, error) {
	var stats FileStatsResponse

	// 统计简历文件数量
	if err := global.DB.Model(&model.ResumeRecord{}).Where("status = ?", "active").Count(&stats.TotalResumes).Error; err != nil {
		return nil, errors.New("查询简历文件统计失败")
	}

	// 统计头像文件数量（通过用户表中的header_img字段）
	if err := global.DB.Model(&model.User{}).Where("header_img != '' AND header_img IS NOT NULL").Count(&stats.TotalAvatars).Error; err != nil {
		return nil, errors.New("查询头像文件统计失败")
	}

	// 计算文件总大小
	var resumeSize int64
	global.DB.Model(&model.ResumeRecord{}).Where("status = ?", "active").Select("COALESCE(SUM(file_size), 0)").Scan(&resumeSize)
	stats.TotalSize = resumeSize

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

	var files []FileInfo
	var total int64

	switch fileType {
	case "resume", "resumes":
		// 查询简历文件
		var resumes []model.ResumeRecord
		query := global.DB.Model(&model.ResumeRecord{}).Where("status = ?", "active")

		// 统计总数
		if err := query.Count(&total).Error; err != nil {
			return nil, errors.New("查询简历文件总数失败")
		}

		// 分页查询
		if err := query.Preload("User").Order("created_at DESC").
			Limit(pageSizeInt).Offset(offset).Find(&resumes).Error; err != nil {
			return nil, errors.New("查询简历文件列表失败")
		}

		for _, resume := range resumes {
			files = append(files, FileInfo{
				ID:           resume.ID,
				Name:         resume.Name,
				OriginalName: resume.OriginalFilename,
				Path:         resume.FilePath,
				Size:         resume.FileSize,
				Type:         "resume",
				MimeType:     s.getMimeType(resume.FileType),
				UserID:       resume.UserID,
				UserName:     resume.User.Name,
				CreatedAt:    resume.CreatedAt,
				UpdatedAt:    resume.UpdatedAt,
			})
		}

	case "avatar", "avatars":
		// 查询头像文件
		var users []model.User
		query := global.DB.Model(&model.User{}).Where("header_img != '' AND header_img IS NOT NULL")

		// 统计总数
		if err := query.Count(&total).Error; err != nil {
			return nil, errors.New("查询头像文件总数失败")
		}

		// 分页查询
		if err := query.Order("created_at DESC").
			Limit(pageSizeInt).Offset(offset).Find(&users).Error; err != nil {
			return nil, errors.New("查询头像文件列表失败")
		}

		for _, user := range users {
			files = append(files, FileInfo{
				ID:           user.ID,
				Name:         filepath.Base(user.HeaderImg),
				OriginalName: filepath.Base(user.HeaderImg),
				Path:         user.HeaderImg,
				Size:         s.getFileSize(user.HeaderImg),
				Type:         "avatar",
				MimeType:     "image/*",
				UserID:       user.ID,
				UserName:     user.Name,
				CreatedAt:    user.CreatedAt,
				UpdatedAt:    user.UpdatedAt,
			})
		}

	default:
		// 查询所有文件
		return s.getAllFiles(pageInt, pageSizeInt)
	}

	response := &FileListResponse{
		List:     files,
		Total:    total,
		Page:     pageInt,
		PageSize: pageSizeInt,
	}

	return response, nil
}

// DeleteFile 删除文件（管理员）
func (s *fileService) DeleteFile(fileID, fileType string) error {
	switch fileType {
	case "resume":
		// 删除简历文件
		var resume model.ResumeRecord
		if err := global.DB.First(&resume, "id = ?", fileID).Error; err != nil {
			return errors.New("简历文件不存在")
		}

		// 软删除数据库记录
		if err := global.DB.Model(&resume).Updates(map[string]interface{}{
			"status":     "deleted",
			"updated_at": time.Now(),
		}).Error; err != nil {
			return errors.New("删除简历记录失败")
		}

		// 删除物理文件
		if resume.FilePath != "" {
			fullPath := filepath.Join(global.CONFIG.Local.StorePath, strings.TrimPrefix(resume.FilePath, "/uploads/file/"))
			os.Remove(fullPath)
		}

	case "avatar":
		// 删除头像文件
		var user model.User
		if err := global.DB.First(&user, "id = ?", fileID).Error; err != nil {
			return errors.New("用户不存在")
		}

		// 删除物理文件
		if user.HeaderImg != "" {
			fullPath := filepath.Join(global.CONFIG.Local.StorePath, strings.TrimPrefix(user.HeaderImg, "/uploads/file/"))
			os.Remove(fullPath)
		}

		// 清空用户头像字段
		if err := global.DB.Model(&user).Update("header_img", "").Error; err != nil {
			return errors.New("清空用户头像失败")
		}

	default:
		return errors.New("不支持的文件类型")
	}

	return nil
}

// BatchDeleteFiles 批量删除文件
func (s *fileService) BatchDeleteFiles(fileIDs []string, fileType string) error {
	for _, fileID := range fileIDs {
		if err := s.DeleteFile(fileID, fileType); err != nil {
			return err
		}
	}
	return nil
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

// getFileSize 获取文件大小
func (s *fileService) getFileSize(filePath string) int64 {
	fullPath := filepath.Join(global.CONFIG.Local.StorePath, strings.TrimPrefix(filePath, "/uploads/file/"))
	if info, err := os.Stat(fullPath); err == nil {
		return info.Size()
	}
	return 0
}

// getMimeType 根据文件扩展名获取MIME类型
func (s *fileService) getMimeType(ext string) string {
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
	default:
		return "application/octet-stream"
	}
}

// getAllFiles 获取所有文件（简化实现）
func (s *fileService) getAllFiles(page, pageSize int) (*FileListResponse, error) {
	// 这里可以实现更复杂的逻辑来合并所有类型的文件
	// 目前返回简历文件作为示例
	return s.GetFileList(strconv.Itoa(page), strconv.Itoa(pageSize), "resume")
}
