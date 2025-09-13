package config

import (
	"time"
)

type Server struct {
	Port string `mapstructure:"port" json:"port" yaml:"port"`
	Mode string `mapstructure:"mode" json:"mode" yaml:"mode"`
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

type Config struct {
	Server  Server  `mapstructure:"server" json:"server" yaml:"server"`
	CORS    CORS    `mapstructure:"cors" json:"cors" yaml:"cors"`
	Pgsql   Pgsql   `mapstructure:"pgsql" json:"pgsql" yaml:"pgsql"`
	SpugSMS SpugSMS `mapstructure:"spug-sms" json:"spug-sms" yaml:"spug-sms"`
	JWT     JWT     `mapstructure:"jwt" json:"jwt" yaml:"jwt"`
	Local   Local   `mapstructure:"local" json:"local" yaml:"local"`
	Upload  Upload  `mapstructure:"upload" json:"upload" yaml:"upload"`
	Log     Log     `mapstructure:"log" json:"log" yaml:"log"`
}
