package test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"server/global"
	"server/initialize"
	"server/utils"
)

// TestApp 测试应用结构
type TestApp struct {
	Router *gin.Engine
	DB     *gorm.DB
}

// SetupTestApp 设置测试应用
func SetupTestApp() *TestApp {
	// 设置测试模式
	gin.SetMode(gin.TestMode)

	// 初始化配置
	initialize.InitConfig()

	// 修改配置为测试模式
	global.CONFIG.Server.Mode = "test"
	global.CONFIG.Pgsql.DbName = global.CONFIG.Pgsql.DbName + "_test"

	// 初始化日志
	utils.InitLogger()

	// 初始化缓存
	initialize.InitCache()

	// 初始化数据库
	initialize.InitDB()

	// 初始化路由
	router := initialize.InitRouter()

	return &TestApp{
		Router: router,
		DB:     global.DB,
	}
}

// CleanupTestApp 清理测试应用
func CleanupTestApp(app *TestApp) {
	// 清理数据库表
	if app.DB != nil {
		// 删除测试数据
		app.DB.Exec("TRUNCATE TABLE users CASCADE")
		app.DB.Exec("TRUNCATE TABLE conversations CASCADE")
		app.DB.Exec("TRUNCATE TABLE workflows CASCADE")
		app.DB.Exec("TRUNCATE TABLE user_profiles CASCADE")
	}
}

// MakeRequest 发送HTTP请求的辅助函数
func MakeRequest(router *gin.Engine, method, url string, body interface{}, headers map[string]string) *httptest.ResponseRecorder {
	var jsonBytes []byte
	var err error

	if body != nil {
		jsonBytes, err = json.Marshal(body)
		if err != nil {
			panic(err)
		}
	}

	req, _ := http.NewRequest(method, url, bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")

	// 添加自定义头部
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	return w
}

// AssertJSONResponse 断言JSON响应的辅助函数
func AssertJSONResponse(t *testing.T, w *httptest.ResponseRecorder, expectedCode int, expectedData interface{}) {
	assert.Equal(t, expectedCode, w.Code)
	assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

	if expectedData != nil {
		var actualData interface{}
		err := json.Unmarshal(w.Body.Bytes(), &actualData)
		assert.NoError(t, err)

		expectedBytes, _ := json.Marshal(expectedData)
		var expectedJSON interface{}
		json.Unmarshal(expectedBytes, &expectedJSON)

		assert.Equal(t, expectedJSON, actualData)
	}
}

// GetJSONResponse 获取JSON响应数据
func GetJSONResponse(w *httptest.ResponseRecorder) map[string]interface{} {
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

// CreateTestUser 创建测试用户
func CreateTestUser(app *TestApp, phone string, name string, password string) (string, string) {
	// 在测试环境中直接将验证码设置到缓存中
	utils.SendSMS(phone, "123456")

	// 注册用户
	registerData := map[string]interface{}{
		"name":     name,
		"phone":    phone,
		"password": password,
		"sms_code": "123456",
	}

	w := MakeRequest(app.Router, "POST", "/api/user/register", registerData, nil)
	if w.Code != 200 {
		panic(fmt.Sprintf("Failed to create test user: %s", w.Body.String()))
	}

	// 登录获取token
	loginData := map[string]interface{}{
		"phone":    phone,
		"password": password,
	}

	w = MakeRequest(app.Router, "POST", "/api/user/login", loginData, nil)
	if w.Code != 200 {
		panic(fmt.Sprintf("Failed to login test user: %s", w.Body.String()))
	}

	response := GetJSONResponse(w)

	// 检查响应结构是否正确
	if response["data"] == nil {
		panic(fmt.Sprintf("Login response missing data field. Response: %+v", response))
	}

	data, ok := response["data"].(map[string]interface{})
	if !ok {
		panic(fmt.Sprintf("Login response data is not a map. Got: %T, Response: %+v", response["data"], response))
	}

	if data["token"] == nil {
		panic(fmt.Sprintf("Login response missing token field. Data: %+v", data))
	}

	token, ok := data["token"].(string)
	if !ok {
		panic(fmt.Sprintf("Token is not a string. Got: %T, Value: %+v", data["token"], data["token"]))
	}

	if data["user"] == nil {
		panic(fmt.Sprintf("Login response missing user field. Data: %+v", data))
	}

	user, ok := data["user"].(map[string]interface{})
	if !ok {
		panic(fmt.Sprintf("User is not a map. Got: %T, Value: %+v", data["user"], data["user"]))
	}

	if user["id"] == nil {
		panic(fmt.Sprintf("User missing id field. User: %+v", user))
	}

	userID, ok := user["id"].(string)
	if !ok {
		panic(fmt.Sprintf("User ID is not a string. Got: %T, Value: %+v", user["id"], user["id"]))
	}

	return userID, token
}

// CreateTestAdmin 创建测试管理员
func CreateTestAdmin(app *TestApp) (string, string) {
	userID, _ := CreateTestUser(app, "13800138000", "Test Admin", "password123")

	// 将用户设置为管理员
	app.DB.Exec("UPDATE users SET role = 888 WHERE id = ?", userID)

	// 验证用户角色是否更新成功
	var user struct {
		Role int    `json:"role"`
		Name string `json:"name"`
	}
	app.DB.Raw("SELECT role, name FROM users WHERE id = ?", userID).Scan(&user)
	fmt.Printf("Updated user role to: %d\n", user.Role)

	// 重新生成带有管理员角色的 token
	adminToken, err := utils.GenerateToken(userID, user.Name, user.Role)
	if err != nil {
		panic(fmt.Sprintf("Failed to generate admin token: %s", err.Error()))
	}

	return userID, adminToken
}

// AuthHeaders 返回带有认证头的headers
func AuthHeaders(token string) map[string]string {
	return map[string]string{
		"Authorization": "Bearer " + token,
	}
}
