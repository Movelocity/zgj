package main

import (
	"fmt"
	"log"

	"server/global"
	"server/initialize"
	"server/utils"
)

func main() {
	// 初始化配置
	initialize.InitConfig()

	// 初始化日志
	utils.InitLogger()
	global.LOG = utils.Logger

	// 初始化缓存
	initialize.InitCache()

	// 初始化数据库
	initialize.InitDB()

	// 初始化全局服务
	initialize.InitServices()

	// 初始化路由
	r := initialize.InitRouter()

	// 启动服务器
	port := ":" + global.CONFIG.Server.Port
	fmt.Printf("服务器启动在端口 %s\n", port)

	if err := r.Run(port); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
