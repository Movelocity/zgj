package config

import (
	"time"
)

type Server struct {
	Port       string `mapstructure:"port" json:"port" yaml:"port"`
	Mode       string `mapstructure:"mode" json:"mode" yaml:"mode"`
	StaticPath string `mapstructure:"static-path" json:"static-path" yaml:"static-path"`
}

type CORS struct {
	Mode      string      `mapstructure:"mode" json:"mode" yaml:"mode"`
	Whitelist []Whitelist `mapstructure:"whitelist" json:"whitelist" yaml:"whitelist"`
}

type Whitelist struct {
	AllowOrigin      string `mapstructure:"allow-origin" json:"allow-origin" yaml:"allow-origin"`
	AllowMethods     string `mapstructure:"allow-methods" json:"allow-methods" yaml:"allow-methods"`
	AllowHeaders     string `mapstructure:"allow-headers" json:"allow-headers" yaml:"allow-headers"`
	ExposeHeaders    string `mapstructure:"expose-headers" json:"expose-headers" yaml:"expose-headers"`
	AllowCredentials bool   `mapstructure:"allow-credentials" json:"allow-credentials" yaml:"allow-credentials"`
}

type Pgsql struct {
	Host         string `mapstructure:"host" json:"host" yaml:"host"`
	Port         string `mapstructure:"port" json:"port" yaml:"port"`
	DbName       string `mapstructure:"db-name" json:"db-name" yaml:"db-name"`
	Username     string `mapstructure:"username" json:"username" yaml:"username"`
	Password     string `mapstructure:"password" json:"password" yaml:"password"`
	SSLMode      string `mapstructure:"sslmode" json:"sslmode" yaml:"sslmode"`
	MaxIdleConns int    `mapstructure:"max-idle-conns" json:"max-idle-conns" yaml:"max-idle-conns"`
	MaxOpenConns int    `mapstructure:"max-open-conns" json:"max-open-conns" yaml:"max-open-conns"`
	LogMode      string `mapstructure:"log-mode" json:"log-mode" yaml:"log-mode"`
}

type SpugSMS struct {
	Token  string `mapstructure:"token" json:"token" yaml:"token"`
	ApiURL string `mapstructure:"api-url" json:"api-url" yaml:"api-url"`
	Name   string `mapstructure:"name" json:"name" yaml:"name"`
}

type JWT struct {
	SigningKey  string        `mapstructure:"signing-key" json:"signing-key" yaml:"signing-key"`
	ExpiresTime time.Duration `mapstructure:"expires-time" json:"expires-time" yaml:"expires-time"`
	BufferTime  time.Duration `mapstructure:"buffer-time" json:"buffer-time" yaml:"buffer-time"`
	Issuer      string        `mapstructure:"issuer" json:"issuer" yaml:"issuer"`
}

type Local struct {
	Path      string `mapstructure:"path" json:"path" yaml:"path"`
	StorePath string `mapstructure:"store-path" json:"store-path" yaml:"store-path"`
	MaxSize   int    `mapstructure:"max-size" json:"max-size" yaml:"max-size"`
}

type Upload struct {
	ImageMaxSize    int    `mapstructure:"image-max-size" json:"image-max-size" yaml:"image-max-size"`
	FileMaxSize     int    `mapstructure:"file-max-size" json:"file-max-size" yaml:"file-max-size"`
	AllowImageTypes string `mapstructure:"allow-image-types" json:"allow-image-types" yaml:"allow-image-types"`
	AllowFileTypes  string `mapstructure:"allow-file-types" json:"allow-file-types" yaml:"allow-file-types"`
}

type Log struct {
	Level       string `mapstructure:"level" json:"level" yaml:"level"`
	Prefix      string `mapstructure:"prefix" json:"prefix" yaml:"prefix"`
	Format      string `mapstructure:"format" json:"format" yaml:"format"`
	Director    string `mapstructure:"director" json:"director" yaml:"director"`
	ShowLine    bool   `mapstructure:"show-line" json:"show-line" yaml:"show-line"`
	EncodeLevel string `mapstructure:"encode-level" json:"encode-level" yaml:"encode-level"`
}

type TOSConfig struct {
	// STS Configuration
	STS struct {
		AccessKey       string `mapstructure:"access_key" json:"access_key" yaml:"access_key"`
		SecretKey       string `mapstructure:"secret_key" json:"secret_key" yaml:"secret_key"`
		RoleTRN         string `mapstructure:"role_trn" json:"role_trn" yaml:"role_trn"`
		SessionName     string `mapstructure:"session_name" json:"session_name" yaml:"session_name"`
		DurationSeconds int    `mapstructure:"duration_seconds" json:"duration_seconds" yaml:"duration_seconds"`
		Endpoint        string `mapstructure:"endpoint" json:"endpoint" yaml:"endpoint"`
		Region          string `mapstructure:"region" json:"region" yaml:"region"`
		Policy          string `mapstructure:"policy" json:"policy" yaml:"policy"`
	} `mapstructure:"sts" json:"sts" yaml:"sts"`

	// TOS Configuration
	TOS struct {
		Endpoint       string `mapstructure:"endpoint" json:"endpoint" yaml:"endpoint"`
		Region         string `mapstructure:"region" json:"region" yaml:"region"`
		Bucket         string `mapstructure:"bucket" json:"bucket" yaml:"bucket"`
		KeyPrefix      string `mapstructure:"key_prefix" json:"key_prefix" yaml:"key_prefix"`
		PresignExpires int    `mapstructure:"presign_expires" json:"presign_expires" yaml:"presign_expires"` // in seconds
	} `mapstructure:"tos" json:"tos" yaml:"tos"`
}

type ASRConfig struct {
	AppKey     string `mapstructure:"app_key" json:"app_key" yaml:"app_key"`
	AccessKey  string `mapstructure:"access_key" json:"access_key" yaml:"access_key"`
	ResourceID string `mapstructure:"resource_id" json:"resource_id" yaml:"resource_id"`
	BaseURL    string `mapstructure:"base_url" json:"base_url" yaml:"base_url"`
	Timeout    int    `mapstructure:"timeout" json:"timeout" yaml:"timeout"` // in seconds
}

type PdfExportConfig struct {
	NodeServiceURL string `mapstructure:"node_service_url" json:"node_service_url" yaml:"node_service_url"` // Node.js服务地址
	RenderBaseURL  string `mapstructure:"render_base_url" json:"render_base_url" yaml:"render_base_url"`    // 前端渲染页面基础URL
}

type Config struct {
	Server    Server          `mapstructure:"server" json:"server" yaml:"server"`
	CORS      CORS            `mapstructure:"cors" json:"cors" yaml:"cors"`
	Pgsql     Pgsql           `mapstructure:"pgsql" json:"pgsql" yaml:"pgsql"`
	SpugSMS   SpugSMS         `mapstructure:"spug-sms" json:"spug-sms" yaml:"spug-sms"`
	JWT       JWT             `mapstructure:"jwt" json:"jwt" yaml:"jwt"`
	Local     Local           `mapstructure:"local" json:"local" yaml:"local"`
	Upload    Upload          `mapstructure:"upload" json:"upload" yaml:"upload"`
	Log       Log             `mapstructure:"log" json:"log" yaml:"log"`
	TOS       TOSConfig       `mapstructure:"tos" json:"tos" yaml:"tos"`
	ASR       ASRConfig       `mapstructure:"asr" json:"asr" yaml:"asr"`
	PdfExport PdfExportConfig `mapstructure:"pdf_export" json:"pdf_export" yaml:"pdf_export"`
}
