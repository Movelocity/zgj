// 数据迁移脚本：为现有文件计算并填充哈希值
// 使用方法：go run scripts/migrate_file_hash.go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Config 配置结构
type Config struct {
	Database struct {
		Host     string `yaml:"host"`
		Port     int    `yaml:"port"`
		Database string `yaml:"database"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
	} `yaml:"database"`
	Local struct {
		StorePath string `yaml:"storePath"`
	} `yaml:"local"`
}

// File 文件模型
type File struct {
	ID           string `gorm:"primaryKey"`
	Hash         string
	Extension    string
	OriginalName string
}

func main() {
	fmt.Println("开始迁移文件哈希值...")

	// 读取配置文件
	config, err := loadConfig("config.yaml")
	if err != nil {
		fmt.Printf("读取配置文件失败: %v\n", err)
		return
	}

	// 连接数据库
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable",
		config.Database.Host,
		config.Database.User,
		config.Database.Password,
		config.Database.Database,
		config.Database.Port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("数据库连接失败: %v\n", err)
		return
	}

	// 查询所有没有哈希值的文件
	var files []File
	if err := db.Table("files").Where("hash IS NULL OR hash = ''").Find(&files).Error; err != nil {
		fmt.Printf("查询文件失败: %v\n", err)
		return
	}

	fmt.Printf("找到 %d 个需要计算哈希的文件\n", len(files))

	successCount := 0
	failCount := 0
	notFoundCount := 0

	// 遍历每个文件，计算哈希值
	for i, file := range files {
		fmt.Printf("[%d/%d] 处理文件 %s...", i+1, len(files), file.ID)

		// 构建文件路径
		storagePath := getStoragePath(file.ID, file.Extension)
		fullPath := filepath.Join(config.Local.StorePath, storagePath)

		// 检查文件是否存在
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			fmt.Printf(" 文件不存在: %s\n", fullPath)
			notFoundCount++
			continue
		}

		// 计算哈希值
		hash, err := calculateFileHashFromPath(fullPath)
		if err != nil {
			fmt.Printf(" 计算哈希失败: %v\n", err)
			failCount++
			continue
		}

		// 更新数据库
		if err := db.Table("files").Where("id = ?", file.ID).Update("hash", hash).Error; err != nil {
			fmt.Printf(" 更新数据库失败: %v\n", err)
			failCount++
			continue
		}

		fmt.Printf(" 成功 (hash: %s)\n", hash[:16]+"...")
		successCount++
	}

	fmt.Println("\n迁移完成！")
	fmt.Printf("成功: %d, 失败: %d, 文件不存在: %d\n", successCount, failCount, notFoundCount)

	// 检查是否还有未处理的文件
	var remainingCount int64
	db.Table("files").Where("hash IS NULL OR hash = ''").Count(&remainingCount)
	if remainingCount > 0 {
		fmt.Printf("警告: 还有 %d 个文件未处理\n", remainingCount)
	} else {
		fmt.Println("所有文件都已成功计算哈希值！")
	}
}

// loadConfig 读取配置文件
func loadConfig(path string) (*Config, error) {
	file, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := yaml.Unmarshal(file, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

// getStoragePath 获取文件存储路径
func getStoragePath(id, extension string) string {
	if len(id) < 6 {
		return id
	}
	return id[:6] + "/" + id + "." + extension
}

// calculateFileHashFromPath 计算文件的SHA256哈希值
func calculateFileHashFromPath(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hasher.Sum(nil)), nil
}
