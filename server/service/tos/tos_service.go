package tos

import (
	"context"
	"fmt"

	"server/global"
	"server/model"

	"github.com/volcengine/ve-tos-golang-sdk/v2/tos"
	"github.com/volcengine/ve-tos-golang-sdk/v2/tos/enum"
	"github.com/volcengine/volc-sdk-golang/service/sts"
)

// TOSServiceInterface TOS文件存储服务接口
type TOSServiceInterface interface {
	// GetSTSCredentials 获取STS临时凭证
	GetSTSCredentials(ctx context.Context) (*global.TOSSTSCredentials, error)

	// GeneratePresignedURL 生成预签名URL
	GeneratePresignedURL(ctx context.Context, req *global.TOSPresignRequest) (*global.TOSPresignResponse, error)

	// GenerateDownloadURL 生成下载预签名URL
	GenerateDownloadURL(ctx context.Context, key string) (*global.TOSDownloadResponse, error)

	// RecordUpload 记录上传完成
	RecordUpload(ctx context.Context, upload *model.TOSUpload) error

	// ListUploads 查询上传记录
	ListUploads(ctx context.Context, userID string, page, pageSize int) (*global.TOSUploadListResponse, error)
}

// tosService TOS服务实现
type tosService struct {
	client *tos.ClientV2
}

// NewTOSService 创建TOS服务实例
func NewTOSService() (TOSServiceInterface, error) {
	config := global.CONFIG.TOS

	// 创建TOS客户端
	client, err := tos.NewClientV2(
		config.TOS.Endpoint,
		tos.WithRegion(config.TOS.Region),
		tos.WithCredentials(tos.NewStaticCredentials(
			config.STS.AccessKey,
			config.STS.SecretKey,
		)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create TOS client: %w", err)
	}

	return &tosService{
		client: client,
	}, nil
}

// GetSTSCredentials 获取STS临时凭证
func (s *tosService) GetSTSCredentials(ctx context.Context) (*global.TOSSTSCredentials, error) {
	config := global.CONFIG.TOS

	// 创建STS客户端
	stsClient := sts.NewInstance()
	stsClient.Client.SetAccessKey(config.STS.AccessKey)
	stsClient.Client.SetSecretKey(config.STS.SecretKey)
	stsClient.SetRegion(config.STS.Region)

	// 设置角色ARN和会话名称
	params := &sts.AssumeRoleRequest{
		RoleSessionName: config.STS.SessionName,
		RoleTrn:         config.STS.RoleTRN,
		DurationSeconds: config.STS.DurationSeconds,
		Policy:          config.STS.Policy,
	}

	// 调用AssumeRole获取临时凭证
	resp, status, err := stsClient.AssumeRole(params)
	if err != nil || resp.Result == nil {
		return nil, fmt.Errorf("failed to assume role: %w (status: %d)", err, status)
	}

	credentials := resp.Result.Credentials
	return &global.TOSSTSCredentials{
		AccessKeyID:     credentials.AccessKeyId,
		SecretAccessKey: credentials.SecretAccessKey,
		SessionToken:    credentials.SessionToken,
		Expiration:      credentials.ExpiredTime,
		Region:          config.TOS.Region,
		Endpoint:        config.TOS.Endpoint,
		Bucket:          config.TOS.Bucket,
	}, nil
}

// GeneratePresignedURL 生成预签名URL
func (s *tosService) GeneratePresignedURL(ctx context.Context, req *global.TOSPresignRequest) (*global.TOSPresignResponse, error) {
	config := global.CONFIG.TOS

	// 添加前缀到key
	fullKey := config.TOS.KeyPrefix + req.Key

	// 设置过期时间（默认15分钟）
	expires := config.TOS.PresignExpires
	if expires <= 0 {
		expires = 900 // 15分钟
	}

	// 创建预签名URL输入
	input := &tos.PreSignedURLInput{
		HTTPMethod: enum.HttpMethodPut,
		Bucket:     config.TOS.Bucket,
		Key:        fullKey,
		Expires:    int64(expires),
	}

	// 如果提供了Content-Type，添加到header中
	if req.ContentType != "" {
		input.Header = map[string]string{
			"Content-Type": req.ContentType,
		}
	}

	// 生成预签名URL
	output, err := s.client.PreSignedURL(input)
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return &global.TOSPresignResponse{
		URL:       output.SignedUrl,
		Key:       fullKey,
		ExpiresIn: expires,
	}, nil
}

// GenerateDownloadURL 生成下载预签名URL
func (s *tosService) GenerateDownloadURL(ctx context.Context, key string) (*global.TOSDownloadResponse, error) {
	config := global.CONFIG.TOS

	// 设置过期时间（默认15分钟）
	expires := config.TOS.PresignExpires
	if expires <= 0 {
		expires = 900 // 15分钟
	}

	// 创建预签名URL输入
	input := &tos.PreSignedURLInput{
		HTTPMethod: enum.HttpMethodGet,
		Bucket:     config.TOS.Bucket,
		Key:        key,
		Expires:    int64(expires),
	}

	// 生成预签名URL
	output, err := s.client.PreSignedURL(input)
	if err != nil {
		return nil, fmt.Errorf("failed to generate download URL: %w", err)
	}

	return &global.TOSDownloadResponse{
		URL:       output.SignedUrl,
		ExpiresIn: expires,
	}, nil
}

// RecordUpload 记录上传完成
func (s *tosService) RecordUpload(ctx context.Context, upload *model.TOSUpload) error {
	if err := global.DB.Create(upload).Error; err != nil {
		return fmt.Errorf("failed to record upload: %w", err)
	}
	return nil
}

// ListUploads 查询上传记录
func (s *tosService) ListUploads(ctx context.Context, userID string, page, pageSize int) (*global.TOSUploadListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	var total int64
	var items []model.TOSUpload

	// 查询总数
	if err := global.DB.Model(&model.TOSUpload{}).
		Where("user_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count uploads: %w", err)
	}

	// 查询记录
	if err := global.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to list uploads: %w", err)
	}

	return &global.TOSUploadListResponse{
		Total:   total,
		Page:    page,
		PerPage: pageSize,
		Items:   items,
	}, nil
}
