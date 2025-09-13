package initialize

import (
	"fmt"

	"server/config"
	"server/global"

	"github.com/spf13/viper"
)

// InitConfig 初始化配置
func InitConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")

	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error config file: %s", err))
	}

	global.CONFIG = &config.Config{}
	if err := viper.Unmarshal(global.CONFIG); err != nil {
		panic(fmt.Errorf("unable to decode into struct: %s", err))
	}

	fmt.Println("配置文件加载成功")
}
