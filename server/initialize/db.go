package initialize

import (
	"fmt"
	"time"

	"server/global"
	"server/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB 初始化数据库
func InitDB() {
	config := global.CONFIG.Pgsql

	// 构建DSN
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		config.Host, config.Username, config.Password, config.DbName, config.Port, config.SSLMode)

	// 设置日志级别
	var logLevel logger.LogLevel
	switch config.LogMode {
	case "silent":
		logLevel = logger.Silent
	case "error":
		logLevel = logger.Error
	case "warn":
		logLevel = logger.Warn
	case "info":
		logLevel = logger.Info
	default:
		logLevel = logger.Info
	}

	// 连接数据库
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		panic(fmt.Errorf("failed to connect database: %s", err))
	}

	// 获取底层sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		panic(fmt.Errorf("failed to get sql.DB: %s", err))
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 自动迁移
	if err := db.AutoMigrate(
		&model.User{},
		&model.UserProfile{},
		&model.Conversation{},
		&model.Workflow{},
		&model.ResumeRecord{},
		&model.WorkflowExecution{},
	); err != nil {
		panic(fmt.Errorf("failed to migrate database: %s", err))
	}

	global.DB = db
	fmt.Println("数据库初始化成功")
}
