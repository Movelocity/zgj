package initialize

import (
	"fmt"
	"server/global"
)

// InitCache 初始化缓存
func InitCache() {
	global.InitCache()
	fmt.Println("内存缓存初始化成功")
}
