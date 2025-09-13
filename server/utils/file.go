package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"server/global"
	"strings"
	"time"
)

// UploadFile 上传文件
func UploadFile(file *multipart.FileHeader, dst string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}

// GenerateFileName 生成文件名
func GenerateFileName(originalName string) string {
	ext := filepath.Ext(originalName)
	name := strings.TrimSuffix(originalName, ext)
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%s_%d%s", name, timestamp, ext)
}

// IsAllowedImageType 检查是否为允许的图片类型
func IsAllowedImageType(contentType string) bool {
	allowedTypes := strings.Split(global.CONFIG.Upload.AllowImageTypes, ",")
	for _, t := range allowedTypes {
		if strings.TrimSpace(t) == contentType {
			return true
		}
	}
	return false
}

// IsAllowedFileType 检查是否为允许的文件类型
func IsAllowedFileType(contentType string) bool {
	allowedTypes := strings.Split(global.CONFIG.Upload.AllowFileTypes, ",")
	for _, t := range allowedTypes {
		if strings.TrimSpace(t) == contentType {
			return true
		}
	}
	return false
}

// CheckFileSize 检查文件大小
func CheckFileSize(size int64, maxSize int) bool {
	maxSizeBytes := int64(maxSize * 1024 * 1024) // 转换为字节
	return size <= maxSizeBytes
}
