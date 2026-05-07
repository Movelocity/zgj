package initialize

import (
	"encoding/json"
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
		&model.ChatMessage{},
		&model.Workflow{},
		&model.ResumeRecord{},
		&model.WorkflowExecution{},
		&model.File{},
		&model.InvitationCode{},
		&model.InvitationUse{},
		&model.SiteVariable{},
		&model.EventLog{},
		&model.BillingActionPrice{},
		&model.BillingPackage{},
		&model.UserBillingPackage{},
		&model.TOSUpload{},
		&model.ASRTask{},
		&model.PdfExportTask{},
		&model.InterviewReview{},
		&model.JobOpportunity{},
	); err != nil {
		panic(fmt.Errorf("failed to migrate database: %s", err))
	}

	global.DB = db
	initDefaultJobOpportunities(db)

	// 注释掉默认管理员初始化，改为第一个注册用户自动成为管理员
	// initDefaultData()

	fmt.Println("数据库初始化成功")
}

func mustJSONList(items []string) model.JSON {
	raw, err := json.Marshal(items)
	if err != nil {
		return model.JSON("[]")
	}
	return model.JSON(raw)
}

func initDefaultJobOpportunities(db *gorm.DB) {
	var count int64
	if err := db.Model(&model.JobOpportunity{}).Count(&count).Error; err != nil || count > 0 {
		return
	}

	opportunities := []model.JobOpportunity{
		{
			Company:      "爱奇艺",
			Title:        "内容创作产品 / AI 产品产运实习生",
			Category:     "AI 产品 / 内容生产 / 工作流 Agent",
			Location:     "未注明",
			Cadence:      "尽快到岗，每周到岗 5 天，实习 3 个月以上，不支持线上办公",
			Summary:      "面向影视综、短剧及二创内容场景，探索视频或文案的 AI 自动化生产方案。",
			ContactEmail: "popkid616@163.com",
			Note:         "招聘将包含一轮 AI 工具使用及视频剪辑思路笔试；只发简历即可，简历 OK 会直接发笔试题。",
			Status:       model.JobOpportunityStatusPublished,
			SortOrder:    10,
			CreatedBy:    "system",
			Responsibilities: mustJSONList([]string{
				"负责影视综相关衍生视频或文案的 AI 生产探索，调研并梳理内容生产逻辑，撰写 PRD 文档，使用工具搭建工作流或 Agent 实现自动化生产。",
				"统筹 AI 自动产线的模型实验，包括对标案例收集、prompt 测试、优化分析、结果评价和成片效果评估。",
				"规划工作量，并与组内其他实习生协同完成模型实验和产线推进。",
				"探索影视、短剧相关二创类视频和图文自动生产的质量优化方案。",
				"协助各产线功能建设和产品优化，整理使用问题反馈并跟进排查情况。",
			}),
			Requirements: mustJSONList([]string{
				"在校本科生或研究生，能够尽快到岗者优先。",
				"对 AI 产品有浓厚兴趣和探索欲，熟练使用 ChatGPT、Deepseek、Gemini 等 AI 工具，并具备总结方法论的能力。",
				"有 AI 行业或产品类工作经验者优先。",
				"了解 Office 基本操作，能够使用 Coze、Dify 等工作流工具并独立完成完整工作流搭建者优先。",
				"具备较强自驱力、执行力、时间管理能力，工作细致有耐心。",
				"对影视、短剧及相关二创感兴趣，熟悉混剪或解说类短视频创作过程，具备良好文案能力、内容审美和理解力。",
				"有相关自媒体经验者优先，欢迎在简历中附个人账号或作品链接。",
			}),
		},
		{
			Company:      "滴滴",
			Title:        "用户研究实习生",
			Category:     "用户研究 / 金融产品 / 国际化",
			Location:     "北京，不接受远程",
			Cadence:      "每周实习 4 天及以上，连续实习 6 个月及以上优先，能尽快入职者优先",
			Summary:      "支持滴滴国内金融与国际化金融产品、运营、品牌等方向的用户研究工作。",
			ContactEmail: "yimeizhang2020@163.com",
			Status:       model.JobOpportunityStatusPublished,
			SortOrder:    20,
			CreatedBy:    "system",
			Responsibilities: mustJSONList([]string{
				"支持国内金融和国际化金融产品、运营、品牌等方向的用户研究工作。",
				"协助开展用户研究项目，包括问卷、访谈、可用性测试等。",
				"参与用研项目全流程，包括需求沟通、研究设计、执行、数据分析和结论产出。",
			}),
			Requirements: mustJSONList([]string{
				"积极主动、认真仔细、执行力高，态度端正，沟通和表达能力良好。",
				"有访谈和用户邀约经验者优先。",
				"熟练使用 SPSS。",
			}),
		},
		{
			Company:      "小红书",
			Title:        "社区市场部实习生",
			Category:     "产品营销 / 整合传播 / 社区视频",
			Location:     "上海",
			Cadence:      "27 届学生优先，每周到岗 5 天",
			Summary:      "深度参与社区核心产品功能的市场推介策略，围绕视频消费需求推进产品营销和传播落地。",
			ContactEmail: "1453455481@qq.com",
			Status:       model.JobOpportunityStatusPublished,
			SortOrder:    30,
			CreatedBy:    "system",
			Responsibilities: mustJSONList([]string{
				"参与社区核心产品功能的市场推介策略，协助挖掘用户在社区内的视频消费需求。",
				"参与制定产品定位、核心卖点提炼、创意传播和线下活动落地方案，推动新场景在用户侧建立心智。",
				"参与项目传播方案策划和流程跟进，与传播代理商对接，把控并产出有质量的传播物料。",
				"完成从站内氛围到站外传播的全链路流程，对传播声量负责。",
				"跟进市场合作项目中对内各部门合作资源沟通与资料整理。",
			}),
			Requirements: mustJSONList([]string{
				"市场营销、广告、新闻传播等相关专业的 27 届学生优先。",
				"有想法、思维活跃、爱冲浪，文案能力强，沟通力和执行力强。",
				"能协助项目传播策划和执行。",
				"有一线互联网公司经验、4A 广告经验，了解传播渠道，具备产品营销或大型项目执行经验者优先。",
				"了解小红书社区视频内容生态，是中长视频深度用户，对产品营销有热情者优先。",
			}),
		},
	}

	if err := db.Create(&opportunities).Error; err != nil {
		fmt.Printf("初始化默认实习机会失败: %v\n", err)
		return
	}
	fmt.Println("默认实习机会初始化成功")
}

// initDefaultData 初始化默认数据 - 已废弃，改为第一个注册用户自动成为管理员
// func initDefaultData() {
//	// 检查是否已存在管理员用户
//	var adminCount int64
//	global.DB.Model(&model.User{}).Where("role = ?", 888).Count(&adminCount)
//
//	if adminCount == 0 {
//		// 从配置文件读取管理员信息
//		adminConfig := global.CONFIG.Admin
//		hashedPassword, err := utils.HashPassword(adminConfig.Password)
//		if err != nil {
//			panic(fmt.Errorf("failed to hash password: %s", err))
//		}
//
//		// 生成符合长度要求的ID
//		adminID := utils.GenerateTLID()
//
//		// 创建默认管理员用户
//		defaultAdmin := model.User{
//			ID:       adminID,
//			Name:     adminConfig.Name,
//			Phone:    adminConfig.Phone,
//			Password: hashedPassword,
//			Email:    adminConfig.Email,
//			Active:   true,
//			Role:     888, // 管理员角色
//		}
//
//		if err := global.DB.Create(&defaultAdmin).Error; err != nil {
//			fmt.Printf("创建默认管理员失败: %v\n", err)
//		} else {
//			fmt.Println("默认管理员创建成功 - 手机号: ", adminConfig.Phone, ", 密码: ", adminConfig.Password)
//
//			// 为管理员创建用户档案
//			adminProfile := model.UserProfile{
//				ID:      utils.GenerateTLID(),
//				UserID:  defaultAdmin.ID,
//				Data:    model.JSON("{}"),
//				Resumes: model.JSON("[]"),
//			}
//
//			if err := global.DB.Create(&adminProfile).Error; err != nil {
//				fmt.Printf("创建管理员档案失败: %v\n", err)
//			}
//		}
//	}
// }
