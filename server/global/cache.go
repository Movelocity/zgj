package global

import (
	"sync"
	"time"
)

// CacheItem 缓存项
type CacheItem struct {
	Value      interface{}
	Expiration time.Time
}

// MemoryCache 内存缓存
type MemoryCache struct {
	items map[string]CacheItem
	mutex sync.RWMutex
}

// InitCache 初始化缓存
func InitCache() {
	Cache = &MemoryCache{
		items: make(map[string]CacheItem),
	}
	// 启动定期清理过期项目的goroutine
	go Cache.cleanup()
}

// Set 设置缓存
func (c *MemoryCache) Set(key string, value interface{}, duration time.Duration) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.items[key] = CacheItem{
		Value:      value,
		Expiration: time.Now().Add(duration),
	}
}

// Get 获取缓存
func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	item, exists := c.items[key]
	if !exists || time.Now().After(item.Expiration) {
		return nil, false
	}
	return item.Value, true
}

// Delete 删除缓存
func (c *MemoryCache) Delete(key string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	delete(c.items, key)
}

// cleanup 清理过期缓存
func (c *MemoryCache) cleanup() {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		c.mutex.Lock()
		now := time.Now()
		for key, item := range c.items {
			if now.After(item.Expiration) {
				delete(c.items, key)
			}
		}
		c.mutex.Unlock()
	}
}
