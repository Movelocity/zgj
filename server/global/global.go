package global

import (
	"server/config"

	"gorm.io/gorm"
)

var (
	CONFIG *config.Config
	DB     *gorm.DB
	Cache  *MemoryCache
)
