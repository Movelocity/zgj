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

// SMS 发送策略常量
const (
	SMSCooldownDuration = 5 * time.Minute                     // 冷却时间窗口
	SMSCodeExpiry       = 5 * time.Minute                     // 验证码有效期
	MaxAliyunAttempts   = 2                                   // 阿里云最大尝试次数（第1、2次）
	MaxSpugAttempts     = 2                                   // Spug最大尝试次数（第3、4次）
	MaxTotalAttempts    = MaxAliyunAttempts + MaxSpugAttempts // 总最大尝试次数
)

// SpugSMSResponse 短信服务响应结构
type SpugSMSResponse struct {
	Code      int    `json:"code"`
	Msg       string `json:"msg"`
	RequestID string `json:"request_id"`
}

// SMSAttemptInfo 短信尝试信息
type SMSAttemptInfo struct {
	Count    int       // 尝试次数
	LastTime time.Time // 最后尝试时间
}

// GenerateSMSCode 生成6位数字验证码
func GenerateSMSCode() string {
	code := rand.Intn(900000) + 100000
	return fmt.Sprintf("%06d", code)
}

// getSMSAttemptCount 获取当前手机号的尝试次数
func getSMSAttemptCount(phone string) int {
	cacheKey := fmt.Sprintf("sms_attempt_%s", phone)
	if val, exists := global.Cache.Get(cacheKey); exists {
		if info, ok := val.(*SMSAttemptInfo); ok {
			return info.Count
		}
	}
	return 0
}

// incrementSMSAttempt 增加尝试次数并返回新的计数
func incrementSMSAttempt(phone string) int {
	cacheKey := fmt.Sprintf("sms_attempt_%s", phone)
	var info *SMSAttemptInfo

	if val, exists := global.Cache.Get(cacheKey); exists {
		if existing, ok := val.(*SMSAttemptInfo); ok {
			info = existing
		}
	}

	if info == nil {
		info = &SMSAttemptInfo{}
	}

	info.Count++
	info.LastTime = time.Now()
	global.Cache.Set(cacheKey, info, SMSCooldownDuration)

	return info.Count
}

// resetSMSAttempt 重置尝试次数（发送成功后调用）
func resetSMSAttempt(phone string) {
	cacheKey := fmt.Sprintf("sms_attempt_%s", phone)
	global.Cache.Delete(cacheKey)
}

// SendSMS 智能发送短信验证码（带服务商切换和冷却机制）
// 策略：
//   - 第1、2次尝试：使用阿里云
//   - 第3、4次尝试：使用 Spug
//   - 第5次及以后：进入冷却期，拒绝发送
//
// 返回值：实际尝试次数, error
func SendSMS(phone string, code string) (int, error) {
	// 获取当前尝试次数（在本次尝试之前）
	currentAttempt := getSMSAttemptCount(phone)

	// 检查是否在冷却期
	if currentAttempt >= MaxTotalAttempts {
		cooldownRemaining := SMSCooldownDuration // 简化处理，实际剩余时间可从缓存获取
		fmt.Printf("[SMS] 手机号 %s 已达到最大尝试次数（%d次），进入冷却期\n", phone, currentAttempt)
		return 0, fmt.Errorf("发送过于频繁，请 %v 后再试", cooldownRemaining)
	}

	// 增加尝试次数
	attemptNum := incrementSMSAttempt(phone)
	fmt.Printf("[SMS] 手机号 %s 第 %d 次尝试发送验证码\n", phone, attemptNum)

	// 将验证码存储到缓存中
	cacheKey := fmt.Sprintf("sms_code_%s", phone)
	global.Cache.Set(cacheKey, code, SMSCodeExpiry)

	var err error
	var provider string

	// 根据尝试次数选择服务商
	if attemptNum <= MaxAliyunAttempts {
		// 第1、2次使用阿里云
		provider = "阿里云"
		err = sendAliyunSMSInternal(phone, code)
	} else {
		// 第3、4次使用 Spug
		provider = "Spug"
		err = sendSpugSMSInternal(phone, code)
	}

	if err != nil {
		fmt.Printf("[SMS] %s 发送失败（第%d次）: %v\n", provider, attemptNum, err)
		return attemptNum, fmt.Errorf("%s短信发送失败: %w", provider, err)
	}

	// API 调用成功，但不重置计数器
	// 只有用户成功验证验证码后才重置（在 VerifySMSCode 中处理）
	// 这样即使 API 成功但短信未送达，用户重试时会继续递增计数，最终切换服务商
	fmt.Printf("[SMS] %s 发送成功！手机号: %s，第 %d 次尝试（计数器保持为 %d）\n", provider, phone, attemptNum, attemptNum)
	return attemptNum, nil
}

// sendAliyunSMSInternal 使用阿里云发送短信（内部方法，不带尝试计数）
func sendAliyunSMSInternal(phone string, code string) error {
	cfg := global.CONFIG.AliyunSMS
	if cfg.AccessKeyId == "" {
		return fmt.Errorf("阿里云短信配置未设置")
	}

	// 跳过模式：用于开发测试
	if cfg.AccessKeyId == "skip" {
		fmt.Println("[AliyunSMS] 跳过发送，验证码：", code)
		return nil
	}

	// 调用阿里云发送
	_, err := SendAliyunSMS(phone, code)
	return err
}

// sendSpugSMSInternal 使用 Spug 发送短信（内部方法，不带尝试计数）
func sendSpugSMSInternal(phone string, code string) error {
	if global.CONFIG.SpugSMS.Token == "" {
		return fmt.Errorf("Spug短信配置未设置")
	}

	// 跳过模式：用于开发测试
	if global.CONFIG.SpugSMS.Token == "skip" {
		fmt.Println("[SpugSMS] 跳过发送，验证码：", code)
		return nil
	}

	validMinutes := 15
	name := url.QueryEscape(global.CONFIG.SpugSMS.Name)
	requestURL := fmt.Sprintf("https://push.spug.cc/send/%s?key1=%s&key2=%s&key3=%d&&targets=%s",
		global.CONFIG.SpugSMS.Token, name, code, validMinutes, phone)

	fmt.Printf("[SpugSMS] 准备发送短信到 %s\n", phone)

	// 请求配置
	const requestTimeout = 30 * time.Second

	client := &http.Client{
		Timeout: requestTimeout,
	}

	resp, err := client.Get(requestURL)
	if err != nil {
		return fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP状态码异常: %d, 响应: %s", resp.StatusCode, string(body))
	}

	var smsResp SpugSMSResponse
	if err := json.Unmarshal(body, &smsResp); err != nil {
		return fmt.Errorf("解析响应失败: %w, 原始响应: %s", err, string(body))
	}

	if smsResp.Code != 200 {
		return fmt.Errorf("短信服务返回错误: code=%d, msg=%s, request_id=%s",
			smsResp.Code, smsResp.Msg, smsResp.RequestID)
	}

	fmt.Printf("[SpugSMS] 发送成功！request_id: %s\n", smsResp.RequestID)
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
		// 同时重置尝试计数
		resetSMSAttempt(phone)
		return true
	}

	return false
}

// GetSMSAttemptStatus 获取手机号的短信发送状态（用于调试/显示）
func GetSMSAttemptStatus(phone string) (attemptCount int, inCooldown bool, remainingAttempts int) {
	attemptCount = getSMSAttemptCount(phone)
	inCooldown = attemptCount >= MaxTotalAttempts
	if inCooldown {
		remainingAttempts = 0
	} else {
		remainingAttempts = MaxTotalAttempts - attemptCount
	}
	return
}
