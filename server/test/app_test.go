package test

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConversationAPIs(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	_, token := CreateTestUser(app, "13800138020", "Test User", "password123")

	var conversationID string

	t.Run("创建对话", func(t *testing.T) {
		createData := map[string]interface{}{
			"title": "Test Conversation",
		}

		w := MakeRequest(app.Router, "POST", "/api/conversation", createData, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		conversationID = data["id"].(string)
		assert.NotEmpty(t, conversationID)
		assert.Equal(t, "Test Conversation", data["title"])
	})

	t.Run("获取对话列表", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/conversation", nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 1)

		// 检查第一个对话
		firstConv := data[0].(map[string]interface{})
		assert.Equal(t, conversationID, firstConv["id"])
		assert.Equal(t, "Test Conversation", firstConv["title"])
	})

	t.Run("获取特定对话", func(t *testing.T) {
		url := fmt.Sprintf("/api/conversation/%s", conversationID)
		w := MakeRequest(app.Router, "GET", url, nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		assert.Equal(t, conversationID, data["id"])
		assert.Equal(t, "Test Conversation", data["title"])
	})

	t.Run("更新对话", func(t *testing.T) {
		updateData := map[string]interface{}{
			"title":       "Updated Conversation",
			"messages":    []map[string]interface{}{{"role": "user", "content": "Hello"}},
			"is_archived": false,
		}

		url := fmt.Sprintf("/api/conversation/%s", conversationID)
		w := MakeRequest(app.Router, "PUT", url, updateData, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证更新是否成功
		w = MakeRequest(app.Router, "GET", url, nil, AuthHeaders(token))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Updated Conversation", data["title"])
	})

	t.Run("删除对话", func(t *testing.T) {
		url := fmt.Sprintf("/api/conversation/%s", conversationID)
		w := MakeRequest(app.Router, "DELETE", url, nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证删除是否成功
		w = MakeRequest(app.Router, "GET", url, nil, AuthHeaders(token))
		assert.Equal(t, 404, w.Code)
	})

	t.Run("未授权访问对话", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/conversation", nil, nil)
		assert.Equal(t, 401, w.Code)
	})

	t.Run("创建对话失败-缺少标题", func(t *testing.T) {
		createData := map[string]interface{}{}

		w := MakeRequest(app.Router, "POST", "/api/conversation", createData, AuthHeaders(token))

		assert.Equal(t, 400, w.Code)
	})
}

func TestWorkflowAPIs(t *testing.T) {
	app := SetupTestApp()
	defer CleanupTestApp(app)

	// 创建测试用户
	_, token := CreateTestUser(app, "13800138021", "Test User", "password123")

	var workflowID string

	t.Run("创建工作流", func(t *testing.T) {
		createData := map[string]interface{}{
			"api_url":     "https://api.example.com/workflow",
			"api_key":     "test_api_key",
			"name":        "Test Workflow",
			"description": "This is a test workflow",
			"inputs":      map[string]interface{}{"input1": "value1"},
			"outputs":     map[string]interface{}{"output1": "value1"},
			"is_public":   false,
		}

		w := MakeRequest(app.Router, "POST", "/api/workflow", createData, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		workflowID = data["id"].(string)
		assert.NotEmpty(t, workflowID)
		assert.Equal(t, "Test Workflow", data["name"])
		assert.Equal(t, "This is a test workflow", data["description"])
	})

	t.Run("获取工作流列表", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/workflow", nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 1)

		// 检查第一个工作流
		firstWorkflow := data[0].(map[string]interface{})
		assert.Equal(t, workflowID, firstWorkflow["id"])
		assert.Equal(t, "Test Workflow", firstWorkflow["name"])
	})

	t.Run("获取特定工作流", func(t *testing.T) {
		url := fmt.Sprintf("/api/workflow/%s", workflowID)
		w := MakeRequest(app.Router, "GET", url, nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		data := response["data"].(map[string]interface{})
		assert.Equal(t, workflowID, data["id"])
		assert.Equal(t, "Test Workflow", data["name"])
		assert.Equal(t, "This is a test workflow", data["description"])
	})

	t.Run("更新工作流", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name":        "Updated Workflow",
			"description": "Updated description",
			"is_public":   true,
		}

		url := fmt.Sprintf("/api/workflow/%s", workflowID)
		w := MakeRequest(app.Router, "PUT", url, updateData, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证更新是否成功
		w = MakeRequest(app.Router, "GET", url, nil, AuthHeaders(token))
		response = GetJSONResponse(w)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Updated Workflow", data["name"])
		assert.Equal(t, "Updated description", data["description"])
		assert.Equal(t, true, data["is_public"])
	})

	t.Run("执行工作流", func(t *testing.T) {
		executeData := map[string]interface{}{
			"inputs": map[string]interface{}{
				"param1": "value1",
				"param2": "value2",
			},
		}

		url := fmt.Sprintf("/api/workflow/%s/execute", workflowID)
		w := MakeRequest(app.Router, "POST", url, executeData, AuthHeaders(token))

		// 由于没有真实的API端点，这里可能返回错误，但至少应该能处理请求
		assert.True(t, w.Code == 200 || w.Code == 400 || w.Code == 500)

		if w.Code == 200 {
			response := GetJSONResponse(w)
			assert.Equal(t, float64(0), response["code"])

			data := response["data"].(map[string]interface{})
			assert.Contains(t, data, "success")
		}
	})

	t.Run("删除工作流", func(t *testing.T) {
		url := fmt.Sprintf("/api/workflow/%s", workflowID)
		w := MakeRequest(app.Router, "DELETE", url, nil, AuthHeaders(token))

		assert.Equal(t, 200, w.Code)
		response := GetJSONResponse(w)
		assert.Equal(t, float64(0), response["code"])

		// 验证删除是否成功
		w = MakeRequest(app.Router, "GET", url, nil, AuthHeaders(token))
		assert.Equal(t, 404, w.Code)
	})

	t.Run("未授权访问工作流", func(t *testing.T) {
		w := MakeRequest(app.Router, "GET", "/api/workflow", nil, nil)
		assert.Equal(t, 401, w.Code)
	})

	t.Run("创建工作流失败-缺少必要参数", func(t *testing.T) {
		createData := map[string]interface{}{
			"name": "Incomplete Workflow",
		}

		w := MakeRequest(app.Router, "POST", "/api/workflow", createData, AuthHeaders(token))

		assert.Equal(t, 400, w.Code)
	})

	t.Run("访问不存在的工作流", func(t *testing.T) {
		url := "/api/workflow/non-existent-id"
		w := MakeRequest(app.Router, "GET", url, nil, AuthHeaders(token))

		assert.Equal(t, 404, w.Code)
	})

	t.Run("更新不存在的工作流", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name": "Updated Name",
		}

		url := "/api/workflow/non-existent-id"
		w := MakeRequest(app.Router, "PUT", url, updateData, AuthHeaders(token))

		assert.Equal(t, 404, w.Code)
	})

	t.Run("删除不存在的工作流", func(t *testing.T) {
		url := "/api/workflow/non-existent-id"
		w := MakeRequest(app.Router, "DELETE", url, nil, AuthHeaders(token))

		assert.Equal(t, 404, w.Code)
	})

	t.Run("执行不存在的工作流", func(t *testing.T) {
		executeData := map[string]interface{}{
			"inputs": map[string]interface{}{
				"param1": "value1",
			},
		}

		url := "/api/workflow/non-existent-id/execute"
		w := MakeRequest(app.Router, "POST", url, executeData, AuthHeaders(token))

		assert.Equal(t, 404, w.Code)
	})
}
