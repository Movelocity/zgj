package utils

import (
	"fmt"
	"math/rand"
	"time"
)

// GenerateTLID 生成时间有序ID
func GenerateTLID() string {
	// 使用当前时间的毫秒级时间戳
	timestamp := time.Now().UnixMilli()

	// 生成随机数部分，确保唯一性
	randomPart := rand.Intn(999999)

	// 组合成20位的字符串ID
	return fmt.Sprintf("%d%06d", timestamp, randomPart)
}
