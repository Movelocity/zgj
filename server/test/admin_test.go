package test

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAdminUserAPIs(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建管理员用户
	adminID, adminToken := CreateTestAdmin(app)

	// 创建普通用户用于测试
	userID, _ := CreateTestUser(app, "13800138030", "Regular User", "password123")

	t.Run("获取所有用户", func(t *testing.T) {
		// 先测试 JWT token 是否有效
		t.Logf("Admin Token: %s", adminToken)

		w := MakeRequest(app.Router, "GET", "/api/admin/user", nil, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)

		// 如果返回错误，打印详细信息
		if response["code"] != float64(0) {
			t.Logf("API returned error. Response: %+v", response)
			t.Logf("Response body: %s", w.Body.String())
		}

		assert.Equal(t, float64(0), response["code"])

		// 安全的类型转换
		dataInterface, ok := response["data"]
		if !ok {
			t.Fatal("Response missing data field")
		}

		data, ok := dataInterface.([]interface{})
		if !ok {
			t.Fatalf("Data is not an array. Got: %T, Value: %+v", dataInterface, dataInterface)
		}

		assert.GreaterOrEqual(t, len(data), 2) // 至少有管理员和普通用户

		// 检查返回的用户信息
		foundAdmin := false
		foundUser := false
		for _, user := range data {
			userMap := user.(map[string]interface{})
			if userMap["id"] == adminID {
				foundAdmin = true
				assert.Equal(t, float64(888), userMap["role"]) // 管理员角色
			}
			if userMap["id"] == userID {
				foundUser = true
				assert.Equal(t, float64(666), userMap["role"]) // 普通用户角色
			}
		}
		assert.True(t, foundAdmin, "应该找到管理员用户")
		assert.True(t, foundUser, "应该找到普通用户")
	})

	t.Run("获取特定用户", func(t *testing.T) {
		url := fmt.Sprintf("/api/admin/user/%s", userID)
		w := MakeRequest(app.Router, "GET", url, nil, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		assert.Equal(t, userID, data["id"])
		assert.Equal(t, "Regular User", data["name"])
		assert.Equal(t, "13800138030", data["phone"])
		assert.Equal(t, float64(666), data["role"])
	})

	t.Run("管理员更新用户信息", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name":  "Admin Updated User",
			"email": "admin@example.com",
		}

		url := fmt.Sprintf("/api/admin/user/%s", userID)
		w := MakeRequest(app.Router, "PUT", url, updateData, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证更新是否成功
		w = MakeRequest(app.Router, "GET", url, nil, AuthHeaders(adminToken))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Admin Updated User", data["name"])
		assert.Equal(t, "admin@example.com", data["email"])
	})

	t.Run("停用用户", func(t *testing.T) {
		url := fmt.Sprintf("/api/admin/user/%s/deactivate", userID)
		w := MakeRequest(app.Router, "POST", url, nil, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证用户是否被停用
		userURL := fmt.Sprintf("/api/admin/user/%s", userID)
		w = MakeRequest(app.Router, "GET", userURL, nil, AuthHeaders(adminToken))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, false, data["active"])
	})

	t.Run("激活用户", func(t *testing.T) {
		url := fmt.Sprintf("/api/admin/user/%s/activate", userID)
		w := MakeRequest(app.Router, "POST", url, nil, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证用户是否被激活
		userURL := fmt.Sprintf("/api/admin/user/%s", userID)
		w = MakeRequest(app.Router, "GET", userURL, nil, AuthHeaders(adminToken))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, true, data["active"])
	})

	t.Run("删除用户", func(t *testing.T) {
		// 创建一个新用户用于删除测试
		deleteUserID, _ := CreateTestUser(app, "13800138031", "Delete User", "password123")

		url := fmt.Sprintf("/api/admin/user/%s", deleteUserID)
		w := MakeRequest(app.Router, "DELETE", url, nil, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证用户是否被删除
		w = MakeRequest(app.Router, "GET", url, nil, AuthHeaders(adminToken))
		assert.Equal(t, 404, w.Code)
	})

	t.Run("普通用户无法访问管理员接口", func(t *testing.T) {
		// 创建普通用户
		_, userToken := CreateTestUser(app, "13800138032", "Normal User", "password123")

		w := MakeRequest(app.Router, "GET", "/api/admin/user", nil, AuthHeaders(userToken))
		assert.Equal(t, 403, w.Code)
	})

	t.Run("未授权访问管理员接口", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/admin/user", nil, nil)
		assert.Equal(t, 401, w.Code)
	})

	t.Run("获取不存在的用户", func(t *testing.T) {
		url := "/api/admin/user/non-existent-id"
		w := MakeRequest(app.Router, "GET", url, nil, AuthHeaders(adminToken))

		assert.Equal(t, 404, w.Code)
	})

	t.Run("更新不存在的用户", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name": "Updated Name",
		}

		url := "/api/admin/user/non-existent-id"
		w := MakeRequest(app.Router, "PUT", url, updateData, AuthHeaders(adminToken))

		assert.Equal(t, 404, w.Code)
	})

	t.Run("管理员修改用户密码", func(t *testing.T) {
		// 创建一个新用户用于密码修改测试
		testUserID, _ := CreateTestUser(app, "13800138040", "Password Test User", "oldpassword123")

		// 管理员修改用户密码
		passwordData := map[string]interface{}{
			"new_password": "newpassword456",
		}

		url := fmt.Sprintf("/api/admin/user/%s/password", testUserID)
		w := MakeRequest(app.Router, "PUT", url, passwordData, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])
		assert.Equal(t, "用户密码修改成功", response["msg"])

		// 验证用户可以用新密码登录
		loginData := map[string]interface{}{
			"phone":    "13800138040",
			"password": "newpassword456",
		}

		w = MakeRequest(app.Router, "POST", "/api/user/login", loginData, nil)
		assert.Equal(t, 200, w.Code)
		response = GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证不能用旧密码登录
		oldLoginData := map[string]interface{}{
			"phone":    "13800138040",
			"password": "oldpassword123",
		}

		w = MakeRequest(app.Router, "POST", "/api/user/login", oldLoginData, nil)
		assert.NotEqual(t, 200, w.Code) // 应该登录失败
	})

	t.Run("管理员修改不存在用户的密码", func(t *testing.T) {
		passwordData := map[string]interface{}{
			"new_password": "newpassword456",
		}

		url := "/api/admin/user/non-existent-id/password"
		w := MakeRequest(app.Router, "PUT", url, passwordData, AuthHeaders(adminToken))

		assert.Equal(t, 404, w.Code)
	})

	t.Run("管理员修改密码时密码过短", func(t *testing.T) {
		// 创建一个新用户用于测试
		testUserID, _ := CreateTestUser(app, "13800138041", "Short Password Test User", "password123")

		passwordData := map[string]interface{}{
			"new_password": "123", // 少于6位
		}

		url := fmt.Sprintf("/api/admin/user/%s/password", testUserID)
		w := MakeRequest(app.Router, "PUT", url, passwordData, AuthHeaders(adminToken))

		assert.NotEqual(t, 200, w.Code) // 应该验证失败
	})

	t.Run("普通用户无法修改其他用户密码", func(t *testing.T) {
		// 创建两个普通用户
		user1ID, user1Token := CreateTestUser(app, "13800138042", "User 1", "password123")
		user2ID, _ := CreateTestUser(app, "13800138043", "User 2", "password123")

		passwordData := map[string]interface{}{
			"new_password": "newpassword456",
		}

		// 用户1尝试修改用户2的密码
		url := fmt.Sprintf("/api/admin/user/%s/password", user2ID)
		w := MakeRequest(app.Router, "PUT", url, passwordData, AuthHeaders(user1Token))

		assert.Equal(t, 403, w.Code) // 权限不足

		// 用户1尝试修改自己的密码也应该失败（因为这是管理员接口）
		url = fmt.Sprintf("/api/admin/user/%s/password", user1ID)
		w = MakeRequest(app.Router, "PUT", url, passwordData, AuthHeaders(user1Token))

		assert.Equal(t, 403, w.Code) // 权限不足
	})
}

func TestAdminSystemAPIs(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建管理员用户
	_, adminToken := CreateTestAdmin(app)

	t.Run("获取系统统计", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/admin/system/stats", nil, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		// 检查统计数据是否包含预期字段
		assert.Contains(t, data, "users")
		assert.Contains(t, data, "conversations")
		assert.Contains(t, data, "workflows")

		// 验证数据类型
		assert.IsType(t, float64(0), data["users"])
		assert.IsType(t, float64(0), data["conversations"])
		assert.IsType(t, float64(0), data["workflows"])
	})

	t.Run("获取系统日志", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/admin/system/logs", nil, AuthHeaders(adminToken))

		// 日志接口可能返回成功或错误（取决于日志文件是否存在）
		assert.True(t, w.Code == 200 || w.Code == 404 || w.Code == 500)

		if w.Code == 200 {
			response := GetJSONResponse(w)
			assert.Equal(t, float64(0), response["code"])
			assert.Contains(t, response, "data")
		}
	})

	t.Run("普通用户无法访问系统接口", func(t *testing.T) {
		// 创建普通用户
		_, userToken := CreateTestUser(app, "13800138033", "Normal User", "password123")

		w := MakeRequest(app.Router, "GET", "/api/admin/system/stats", nil, AuthHeaders(userToken))
		assert.Equal(t, 403, w.Code)
	})

	t.Run("未授权访问系统接口", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/admin/system/stats", nil, nil)
		assert.Equal(t, 401, w.Code)
	})
}

func TestAdminWorkflowAPIs(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建管理员用户
	_, adminToken := CreateTestAdmin(app)

	// 创建普通用户和工作流
	_, userToken := CreateTestUser(app, "13800138034", "Workflow User", "password123")

	// 创建一个工作流
	createData := map[string]interface{}{
		"api_url":     "https://api.example.com/workflow",
		"api_key":     "test_api_key",
		"name":        "User Workflow",
		"description": "User created workflow",
		"inputs":      map[string]interface{}{"input1": "value1"},
		"outputs":     map[string]interface{}{"output1": "value1"},
		"is_public":   false,
	}

	w := MakeRequest(app.Router, "POST", "/api/workflow", createData, AuthHeaders(userToken))
	assert.Equal(t, 200, w.Code)
	response := GetJSONResponse(w)
	workflowID := response["data"].(map[string]interface{})["id"].(string)

	t.Run("管理员获取所有工作流", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/admin/workflow/all", nil, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 1)

		// 检查是否包含刚创建的工作流
		found := false
		for _, workflow := range data {
			workflowMap := workflow.(map[string]interface{})
			if workflowMap["id"] == workflowID {
				found = true
				assert.Equal(t, "User Workflow", workflowMap["name"])
				break
			}
		}
		assert.True(t, found, "应该找到用户创建的工作流")
	})

	t.Run("管理员更新工作流", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name":        "Admin Updated Workflow",
			"description": "Admin updated description",
			"is_public":   true,
		}

		url := fmt.Sprintf("/api/admin/workflow/%s", workflowID)
		w := MakeRequest(app.Router, "PUT", url, updateData, AuthHeaders(adminToken))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证更新是否成功
		getURL := fmt.Sprintf("/api/workflow/%s", workflowID)
		w = MakeRequest(app.Router, "GET", getURL, nil, AuthHeaders(userToken))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Admin Updated Workflow", data["name"])
		assert.Equal(t, "Admin updated description", data["description"])
		assert.Equal(t, true, data["is_public"])
	})

	t.Run("普通用户无法访问管理员工作流接口", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/admin/workflow/all", nil, AuthHeaders(userToken))
		assert.Equal(t, 403, w.Code)
	})

	t.Run("未授权访问管理员工作流接口", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/admin/workflow/all", nil, nil)
		assert.Equal(t, 401, w.Code)
	})

	t.Run("管理员更新不存在的工作流", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name": "Updated Name",
		}

		url := "/api/admin/workflow/non-existent-id"
		w := MakeRequest(app.Router, "PUT", url, updateData, AuthHeaders(adminToken))

		assert.Equal(t, 404, w.Code)
	})
}
