package utils

import (
	"fmt"
	"math/rand"
	"time"
)

// GenerateTLID 生成时间有序ID
func GenerateTLID() string {
	now := time.Now()

	// 生成日期部分 (yyyymmdd)
	dateStr := now.Format("200601021504")

	// 生成随机数部分，确保唯一性
	randomPart := rand.Intn(99999999)

	// 组合成 yyyymmdd-timestamp-rand 格式
	return fmt.Sprintf("%s%08d", dateStr, randomPart)
}
