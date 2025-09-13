package test

import (
	"log"
	"os"
	"testing"
)

// TestMain 是测试的入口点，在所有测试运行之前和之后执行
func TestMain(m *testing.M) {
	log.Println("开始运行API测试...")

	// 设置测试环境
	setupTestEnvironment()

	// 运行所有测试
	code := m.Run()

	// 清理测试环境
	cleanupTestEnvironment()

	log.Println("API测试完成")
	os.Exit(code)
}

// setupTestEnvironment 设置测试环境
func setupTestEnvironment() {
	log.Println("设置测试环境...")

	// 这里可以添加全局的测试环境设置
	// 比如清理测试数据库、设置环境变量等
}

// cleanupTestEnvironment 清理测试环境
func cleanupTestEnvironment() {
	log.Println("清理测试环境...")

	// 这里可以添加全局的清理逻辑
	// 比如删除测试数据库、清理临时文件等
}

// 基准测试示例
func BenchmarkUserLogin(b *testing.B) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	CreateTestUser(app, "13800138999", "Benchmark User", "password123")

	loginData := map[string]interface{}{
		"phone":    "13800138999",
		"password": "password123",
	}

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		w := MakeRequest(app.Router, "POST", "/api/user/login", loginData, nil)
		if w.Code != 200 {
			b.Fatalf("登录失败: %d", w.Code)
		}
	}
}

// 压力测试示例
func BenchmarkConversationCreate(b *testing.B) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	_, token := CreateTestUser(app, "13800138998", "Benchmark User", "password123")

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		createData := map[string]interface{}{
			"title": "Benchmark Conversation",
		}

		w := MakeRequest(app.Router, "POST", "/api/conversation", createData, AuthHeaders(token))
		if w.Code != 200 {
			b.Fatalf("创建对话失败: %d", w.Code)
		}
	}
}
