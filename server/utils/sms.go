package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"server/global"
	"time"
)

// SpugSMSResponse 短信服务响应结构
type SpugSMSResponse struct {
	Code      int    `json:"code"`
	Msg       string `json:"msg"`
	RequestID string `json:"request_id"`
}

// GenerateSMSCode 生成6位数字验证码
func GenerateSMSCode() string {
	code := rand.Intn(900000) + 100000
	return fmt.Sprintf("%06d", code)
}

// SendSMS 发送短信验证码（带重试机制）
func SendSMS(phone string, code string) error {
	if global.CONFIG.SpugSMS.Token == "" {
		// global.LOG.Error("后台短信配置未设置")
		fmt.Println("后台短信配置未设置")
		return fmt.Errorf("后台短信配置未设置")
	}

	// 将验证码存储到缓存中，有效期5分钟
	cacheKey := fmt.Sprintf("sms_code_%s", phone)
	global.Cache.Set(cacheKey, code, 5*time.Minute)

	// 跳过模式：用于开发测试
	if global.CONFIG.SpugSMS.Token == "skip" {
		fmt.Println("跳过短信发送，请查看验证码：", code)
		return nil
	}

	// GET https://push.spug.cc/send/...&targets=18816742740 is enough
	// {
	//    "code": 200,
	//    "msg": "请求成功",
	//    "request_id": "NbKBjzgRO0DrpxWe"
	// }
	name := url.QueryEscape(global.CONFIG.SpugSMS.Name)
	requestURL := fmt.Sprintf("https://push.spug.cc/send/%s?key1=%s&key2=%s&key3=15&&targets=%s",
		global.CONFIG.SpugSMS.Token, name, code, phone)

	fmt.Printf("[SMS] 准备发送短信到 %s，验证码：%s\n", phone, code)

	// 重试配置
	const (
		maxRetries     = 3                      // 最大重试次数
		requestTimeout = 100 * time.Second      // 单次请求超时时间
		initialDelay   = 500 * time.Millisecond // 初始重试延迟
	)

	// 创建带超时的HTTP客户端
	client := &http.Client{
		Timeout: requestTimeout,
	}

	var lastErr error

	// 重试循环
	for attempt := 1; attempt <= maxRetries; attempt++ {
		if attempt > 1 {
			// 指数退避：每次重试等待时间翻倍
			delay := initialDelay * time.Duration(1<<uint(attempt-2))
			fmt.Printf("[SMS] 第 %d 次重试，等待 %v...\n", attempt, delay)
			time.Sleep(delay)
		}

		fmt.Printf("[SMS] 尝试 %d/%d，URL: %s\n", attempt, maxRetries, requestURL)

		// 发送请求
		resp, err := client.Get(requestURL)
		if err != nil {
			lastErr = fmt.Errorf("请求失败: %w", err)
			fmt.Printf("[SMS] 尝试 %d/%d 失败: %v\n", attempt, maxRetries, err)
			continue
		}

		// 读取响应体
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()

		if err != nil {
			lastErr = fmt.Errorf("读取响应失败: %w", err)
			fmt.Printf("[SMS] 尝试 %d/%d 读取响应失败: %v\n", attempt, maxRetries, err)
			continue
		}

		// 检查HTTP状态码
		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("HTTP状态码异常: %d, 响应: %s", resp.StatusCode, string(body))
			fmt.Printf("[SMS] 尝试 %d/%d HTTP状态码: %d, 响应: %s\n",
				attempt, maxRetries, resp.StatusCode, string(body))
			continue
		}

		// 解析响应体
		var smsResp SpugSMSResponse
		if err := json.Unmarshal(body, &smsResp); err != nil {
			lastErr = fmt.Errorf("解析响应失败: %w, 原始响应: %s", err, string(body))
			fmt.Printf("[SMS] 尝试 %d/%d 解析响应失败: %v\n", attempt, maxRetries, err)
			continue
		}

		// 检查业务状态码
		if smsResp.Code != 200 {
			lastErr = fmt.Errorf("短信服务返回错误: code=%d, msg=%s, request_id=%s",
				smsResp.Code, smsResp.Msg, smsResp.RequestID)
			fmt.Printf("[SMS] 尝试 %d/%d 业务错误: %v\n", attempt, maxRetries, lastErr)
			continue
		}

		// 发送成功
		fmt.Printf("[SMS] 发送成功！request_id: %s, 手机号: %s\n", smsResp.RequestID, phone)
		return nil
	}

	// 所有重试都失败
	fmt.Printf("[SMS] 发送失败，已重试 %d 次，最后错误: %v\n", maxRetries, lastErr)
	return fmt.Errorf("短信发送失败（已重试%d次）: %w", maxRetries, lastErr)
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
