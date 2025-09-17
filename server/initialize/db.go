package initialize

import (
	"fmt"
	"time"

	"server/global"
	"server/model"

	"server/utils"

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
		&model.File{},
	); err != nil {
		panic(fmt.Errorf("failed to migrate database: %s", err))
	}

	global.DB = db

	// 初始化默认数据
	initDefaultData()

	fmt.Println("数据库初始化成功")
}

// initDefaultData 初始化默认数据
func initDefaultData() {
	// 检查是否已存在管理员用户
	var adminCount int64
	global.DB.Model(&model.User{}).Where("role = ?", 888).Count(&adminCount)

	if adminCount == 0 {
		// 从配置文件读取管理员信息
		adminConfig := global.CONFIG.Admin
		hashedPassword, err := utils.HashPassword(adminConfig.Password)
		if err != nil {
			panic(fmt.Errorf("failed to hash password: %s", err))
		}

		// 生成符合长度要求的ID
		adminID := utils.GenerateTLID()

		// 创建默认管理员用户
		defaultAdmin := model.User{
			ID:       adminID,
			Name:     adminConfig.Name,
			Phone:    adminConfig.Phone,
			Password: hashedPassword,
			Email:    adminConfig.Email,
			Active:   true,
			Role:     888, // 管理员角色
		}

		if err := global.DB.Create(&defaultAdmin).Error; err != nil {
			fmt.Printf("创建默认管理员失败: %v\n", err)
		} else {
			fmt.Println("默认管理员创建成功 - 手机号: ", adminConfig.Phone, ", 密码: ", adminConfig.Password)

			// 为管理员创建用户档案
			adminProfile := model.UserProfile{
				ID:      utils.GenerateTLID(),
				UserID:  defaultAdmin.ID,
				Data:    model.JSON("{}"),
				Resumes: model.JSON("[]"),
			}

			if err := global.DB.Create(&adminProfile).Error; err != nil {
				fmt.Printf("创建管理员档案失败: %v\n", err)
			}
		}
	}
}
