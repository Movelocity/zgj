package utils

import (
	"encoding/json"
	"fmt"
	"server/global"
	"strings"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	dypnsapi20170525 "github.com/alibabacloud-go/dypnsapi-20170525/v3/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
)

// createAliyunSMSClient 使用配置文件凭据初始化阿里云短信Client
//
// @return Client
// @throws Exception
func createAliyunSMSClient() (*dypnsapi20170525.Client, error) {
	cfg := global.CONFIG.AliyunSMS
	if cfg.AccessKeyId == "" || cfg.AccessKeySecret == "" {
		return nil, fmt.Errorf("阿里云短信配置未设置 (access-key-id 或 access-key-secret 为空)")
	}

	config := &openapi.Config{
		AccessKeyId:     tea.String(cfg.AccessKeyId),
		AccessKeySecret: tea.String(cfg.AccessKeySecret),
	}
	// Endpoint 请参考 https://api.aliyun.com/product/Dypnsapi
	config.Endpoint = tea.String("dypnsapi.aliyuncs.com")

	return dypnsapi20170525.NewClient(config)
}

// SendAliyunSMS 使用阿里云发送短信验证码
// 注意：此函数仅负责发送，不处理验证码缓存（由调用方处理）
// 返回值：尝试次数（1表示一次成功）, error
func SendAliyunSMS(phone string, code string) (int, error) {
	cfg := global.CONFIG.AliyunSMS
	if cfg.AccessKeyId == "" {
		return 0, fmt.Errorf("阿里云短信配置未设置")
	}

	// 跳过模式：用于开发测试
	if cfg.AccessKeyId == "skip" {
		fmt.Println("[AliyunSMS] 跳过发送，验证码：", code)
		return 1, nil
	}

	// 创建客户端
	client, err := createAliyunSMSClient()
	if err != nil {
		return 0, fmt.Errorf("创建阿里云短信客户端失败: %w", err)
	}

	// 构建模板参数
	validDuration := "5"
	paramString := fmt.Sprintf("{\"code\":\"%s\",\"min\":\"%s\"}", code, validDuration)

	sendSmsVerifyCodeRequest := &dypnsapi20170525.SendSmsVerifyCodeRequest{
		PhoneNumber:   tea.String(phone),
		SignName:      tea.String(cfg.SignName),
		TemplateCode:  tea.String(cfg.TemplateLogin),
		TemplateParam: tea.String(paramString),
	}
	runtime := &util.RuntimeOptions{}

	fmt.Printf("[AliyunSMS] 发送短信到 %s，验证码：%s\n", phone, code)

	// 发送请求
	resp, err := client.SendSmsVerifyCodeWithOptions(sendSmsVerifyCodeRequest, runtime)
	if err != nil {
		return 1, handleAliyunSMSError(err)
	}

	// 检查响应
	if resp.Body != nil && resp.Body.Code != nil && *resp.Body.Code == "OK" {
		fmt.Printf("[AliyunSMS] 发送成功！request_id: %s, 手机号: %s\n",
			tea.StringValue(resp.Body.RequestId), phone)
		return 1, nil
	}

	// 业务错误
	if resp.Body != nil {
		return 1, fmt.Errorf("阿里云短信服务返回错误: code=%s, message=%s",
			tea.StringValue(resp.Body.Code), tea.StringValue(resp.Body.Message))
	}
	return 1, fmt.Errorf("阿里云短信服务返回空响应")
}

// handleAliyunSMSError 处理阿里云短信SDK错误
func handleAliyunSMSError(err error) error {
	var sdkErr = &tea.SDKError{}
	if _t, ok := err.(*tea.SDKError); ok {
		sdkErr = _t
	} else {
		return err
	}

	// 错误 message
	errMsg := tea.StringValue(sdkErr.Message)

	// 尝试获取诊断信息
	var recommend string
	if sdkErr.Data != nil {
		var data interface{}
		d := json.NewDecoder(strings.NewReader(tea.StringValue(sdkErr.Data)))
		if d.Decode(&data) == nil {
			if m, ok := data.(map[string]interface{}); ok {
				if r, exists := m["Recommend"]; exists {
					recommend = fmt.Sprintf("%v", r)
				}
			}
		}
	}

	if recommend != "" {
		return fmt.Errorf("%s (诊断: %s)", errMsg, recommend)
	}
	return fmt.Errorf("%s", errMsg)
}
