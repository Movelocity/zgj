package utils

import (
	"fmt"
	"math/rand"
	"server/global"
	"time"
)

// GenerateSMSCode 生成6位数字验证码
func GenerateSMSCode() string {
	rand.Seed(time.Now().UnixNano())
	code := rand.Intn(900000) + 100000
	return fmt.Sprintf("%06d", code)
}

// SendSMS 发送短信验证码
func SendSMS(phone, code string) error {
	// 这里应该调用实际的短信API
	// 目前只是模拟发送，可以根据需要集成具体的短信服务商API

	// 将验证码存储到缓存中，有效期5分钟
	cacheKey := fmt.Sprintf("sms_code_%s", phone)
	global.Cache.Set(cacheKey, code, 5*time.Minute)

	// 模拟发送短信
	fmt.Printf("向 %s 发送验证码: %s\n", phone, code)

	return nil
}

// VerifySMSCode 验证短信验证码
func VerifySMSCode(phone, code string) bool {
	cacheKey := fmt.Sprintf("sms_code_%s", phone)
	cachedCode, exists := global.Cache.Get(cacheKey)

	if !exists {
		return false
	}

	return cachedCode.(string) == code
}
