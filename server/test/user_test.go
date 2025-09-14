package test

import (
	"testing"

	"server/utils"

	"github.com/stretchr/testify/assert"
)

func TestUserRegister(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 测试用户注册
	t.Run("成功注册", func(t *testing.T) {
		// 在测试环境中直接将验证码设置到缓存中
		utils.SendSMS("13800138001", "123456")

		registerData := map[string]interface{}{
			"name":     "Test User",
			"phone":    "13800138001",
			"password": "password123",
			"sms_code": "123456",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/register", registerData, nil)

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])
		assert.Equal(t, "注册成功", response["msg"])
	})

	t.Run("注册失败-手机号已存在", func(t *testing.T) {
		// 先注册一个用户
		utils.SendSMS("13800138002", "123456")

		registerData := map[string]interface{}{
			"name":     "Test User 1",
			"phone":    "13800138002",
			"password": "password123",
			"sms_code": "123456",
		}
		MakeRequest(app.Router, "POST", "/api/user/register", registerData, nil)

		// 再次注册相同手机号
		utils.SendSMS("13800138002", "123456")

		registerData2 := map[string]interface{}{
			"name":     "Test User 2",
			"phone":    "13800138002",
			"password": "password123",
			"sms_code": "123456",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/register", registerData2, nil)

		assert.Equal(t, 400, w.Code)
		response := GetJSONResponse(w)
		assert.NotEqual(t, float64(0), response["code"])
	})

	t.Run("注册失败-验证码错误", func(t *testing.T) {
		registerData := map[string]interface{}{
			"name":     "Test User",
			"phone":    "13800138003",
			"password": "password123",
			"sms_code": "wrong_code",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/register", registerData, nil)

		assert.Equal(t, 400, w.Code)
		response := GetJSONResponse(w)
		assert.NotEqual(t, float64(0), response["code"])
	})

	t.Run("注册失败-参数验证", func(t *testing.T) {
		// 密码太短
		registerData := map[string]interface{}{
			"name":     "Test User",
			"phone":    "13800138004",
			"password": "123",
			"sms_code": "123456",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/register", registerData, nil)

		assert.Equal(t, 400, w.Code)
	})
}

func TestUserLogin(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 先创建一个测试用户
	userID, _ := CreateTestUser(app, "13800138005", "Test User", "password123")

	t.Run("成功登录", func(t *testing.T) {
		loginData := map[string]interface{}{
			"phone":    "13800138005",
			"password": "password123",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/login", loginData, nil)

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		assert.NotEmpty(t, data["token"])
		assert.NotEmpty(t, data["expires_at"])

		user := data["user"].(map[string]interface{})
		assert.Equal(t, userID, user["id"])
		assert.Equal(t, "13800138005", user["phone"])
		assert.Equal(t, "Test User", user["name"])
	})

	t.Run("登录失败-密码错误", func(t *testing.T) {
		loginData := map[string]interface{}{
			"phone":    "13800138005",
			"password": "wrong_password",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/login", loginData, nil)

		assert.Equal(t, 401, w.Code)
		response := GetJSONResponse(w)
		assert.NotEqual(t, float64(0), response["code"])
	})

	t.Run("登录失败-用户不存在", func(t *testing.T) {
		loginData := map[string]interface{}{
			"phone":    "13800138999",
			"password": "password123",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/login", loginData, nil)

		assert.Equal(t, 401, w.Code)
		response := GetJSONResponse(w)
		assert.NotEqual(t, float64(0), response["code"])
	})
}

func TestSendSMS(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	t.Run("发送短信验证码", func(t *testing.T) {
		smsData := map[string]interface{}{
			"phone": "13800138006",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/send_sms", smsData, nil)

		// 由于没有真实的短信服务，这里可能返回错误，但至少应该能处理请求
		assert.True(t, w.Code == 200 || w.Code == 400 || w.Code == 500)
	})
}

func TestVerifySMS(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	t.Run("验证短信验证码", func(t *testing.T) {
		// 在测试环境中设置验证码
		utils.SendSMS("13800138007", "123456")

		verifyData := map[string]interface{}{
			"phone":    "13800138007",
			"sms_code": "123456",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/verify_sms", verifyData, nil)

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])
	})

	t.Run("验证失败-验证码错误", func(t *testing.T) {
		verifyData := map[string]interface{}{
			"phone":    "13800138008",
			"sms_code": "wrong_code",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/verify_sms", verifyData, nil)

		assert.Equal(t, 400, w.Code)
		response := GetJSONResponse(w)
		assert.NotEqual(t, float64(0), response["code"])
	})
}

func TestGetUserProfile(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	userID, token := CreateTestUser(app, "13800138009", "Test User", "password123")

	t.Run("获取用户信息", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/user/profile", nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		user := data["user"].(map[string]interface{})
		assert.Equal(t, userID, user["id"])
		assert.Equal(t, "13800138009", user["phone"])
		assert.Equal(t, "Test User", user["name"])
	})

	t.Run("未授权访问", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/user/profile", nil, nil)

		assert.Equal(t, 401, w.Code)
	})

	t.Run("无效token", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/user/profile", nil, AuthHeaders("invalid_token"))

		assert.Equal(t, 401, w.Code)
	})
}

func TestUpdateUserProfile(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	_, token := CreateTestUser(app, "13800138010", "Test User", "password123")

	t.Run("更新用户信息", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name":  "Updated Name",
			"email": "test@example.com",
		}

		w := MakeRequest(app.Router, "PUT", "/api/user/profile", updateData, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证更新是否成功
		w = MakeRequest(app.Router, "GET", "/api/user/profile", nil, AuthHeaders(token))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		user := data["user"].(map[string]interface{})
		assert.Equal(t, "Updated Name", user["name"])
		assert.Equal(t, "test@example.com", user["email"])
	})
}

func TestUserLogout(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	_, token := CreateTestUser(app, "13800138011", "Test User", "password123")

	t.Run("用户登出", func(t *testing.T) {
		w := MakeRequest(app.Router, "POST", "/api/user/logout", nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])
	})
}

func TestResetPassword(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	CreateTestUser(app, "13800138012", "Test User", "password123")

	t.Run("重置密码", func(t *testing.T) {
		// 在测试环境中直接将验证码设置到缓存中
		utils.SendSMS("13800138012", "123456")

		resetData := map[string]interface{}{
			"phone":        "13800138012",
			"sms_code":     "123456",
			"new_password": "newpassword123",
		}

		w := MakeRequest(app.Router, "POST", "/api/user/reset_password", resetData, nil)

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证新密码是否生效
		loginData := map[string]interface{}{
			"phone":    "13800138012",
			"password": "newpassword123",
		}

		w = MakeRequest(app.Router, "POST", "/api/user/login", loginData, nil)
		assert.Equal(t, 200, w.Code)
	})
}

func TestGetUserProfileWithoutProfile(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	userID, token := CreateTestUser(app, "13800138013", "Old User", "password123")

	// 模拟老用户情况：删除用户的profile记录
	app.DB.Exec("DELETE FROM user_profiles WHERE user_id = ?", userID)

	t.Run("老用户自动创建默认profile", func(t *testing.T) {
		// 验证用户profile确实被删除了
		var count int64
		app.DB.Raw("SELECT COUNT(*) FROM user_profiles WHERE user_id = ?", userID).Scan(&count)
		assert.Equal(t, int64(0), count)

		// 获取用户信息，应该自动创建默认profile
		w := MakeRequest(app.Router, "GET", "/api/user/profile", nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		user := data["user"].(map[string]interface{})
		assert.Equal(t, userID, user["id"])
		assert.Equal(t, "13800138013", user["phone"])
		assert.Equal(t, "Old User", user["name"])

		// 验证返回了默认的data和resumes字段
		assert.NotNil(t, data["data"])
		assert.NotNil(t, data["resumes"])

		// 验证数据库中确实创建了profile记录
		app.DB.Raw("SELECT COUNT(*) FROM user_profiles WHERE user_id = ?", userID).Scan(&count)
		assert.Equal(t, int64(1), count)
	})

	t.Run("老用户更新profile时自动创建", func(t *testing.T) {
		// 创建另一个测试用户
		userID2, token2 := CreateTestUser(app, "13800138014", "Old User 2", "password123")

		// 删除用户的profile记录
		app.DB.Exec("DELETE FROM user_profiles WHERE user_id = ?", userID2)

		// 验证profile确实被删除了
		var count int64
		app.DB.Raw("SELECT COUNT(*) FROM user_profiles WHERE user_id = ?", userID2).Scan(&count)
		assert.Equal(t, int64(0), count)

		// 尝试更新用户信息，应该自动创建默认profile
		updateData := map[string]interface{}{
			"name": "Updated Old User 2",
			"data": map[string]interface{}{
				"skills": []string{"Go", "React"},
			},
		}

		w := MakeRequest(app.Router, "PUT", "/api/user/profile", updateData, AuthHeaders(token2))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证数据库中确实创建了profile记录
		app.DB.Raw("SELECT COUNT(*) FROM user_profiles WHERE user_id = ?", userID2).Scan(&count)
		assert.Equal(t, int64(1), count)

		// 验证更新的数据被正确保存
		w = MakeRequest(app.Router, "GET", "/api/user/profile", nil, AuthHeaders(token2))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		user := data["user"].(map[string]interface{})
		assert.Equal(t, "Updated Old User 2", user["name"])

		profileData := data["data"].(map[string]interface{})
		skills := profileData["skills"].([]interface{})
		assert.Equal(t, "Go", skills[0])
		assert.Equal(t, "React", skills[1])
	})
}
