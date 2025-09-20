package utils

import (
	"fmt"
	"math/rand"
	"net/http"
	"net/url"
	"server/global"
	"time"
)

// GenerateSMSCode 生成6位数字验证码
func GenerateSMSCode() string {
	code := rand.Intn(900000) + 100000
	return fmt.Sprintf("%06d", code)
}

// SendSMS 发送短信验证码
func SendSMS(phone string, code string) error {
	if global.CONFIG.SpugSMS.Token == "" {
		// global.LOG.Error("后台短信配置未设置")
		fmt.Println("后台短信配置未设置")
		return fmt.Errorf("后台短信配置未设置")
	}

	// 将验证码存储到缓存中，有效期5分钟
	cacheKey := fmt.Sprintf("sms_code_%s", phone)
	global.Cache.Set(cacheKey, code, 5*time.Minute)

	// GET https://push.spug.cc/send/...&targets=18816742740 is enough
	// {
	//    "code": 200,
	//    "msg": "请求成功",
	//    "request_id": "NbKBjzgRO0DrpxWe"
	// }
	name := url.QueryEscape(global.CONFIG.SpugSMS.Name)
	requestURL := fmt.Sprintf("https://push.spug.cc/send/%s?key1=%s&key2=%s&key3=15&&targets=%s", global.CONFIG.SpugSMS.Token, name, code, phone)
	fmt.Println("SMS URL:", requestURL)

	if global.CONFIG.SpugSMS.Token == "skip" {
		fmt.Println("跳过短信发送，请查看验证码：", code)
		return nil
	}

	resp, err := http.Get(requestURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("发送短信失败，状态码: %d", resp.StatusCode)
	}

	return nil
}

// VerifySMSCode 验证短信验证码
func VerifySMSCode(phone, code string) bool {
	cacheKey := fmt.Sprintf("sms_code_%s", phone)
	cachedCode, exists := global.Cache.Get(cacheKey)

	if !exists {
		return false
	}

	if cachedCode.(string) == code {
		// 验证成功后删除缓存，防止重复使用
		global.Cache.Delete(cacheKey)
		return true
	}

	return false
}
