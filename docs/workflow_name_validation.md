# 工作流名称唯一性验证实现

## 概述

根据业务需求，我们为工作流管理系统实现了"enabled 工作流不能重名"的验证逻辑。本文档详细说明了实现的修改和验证规则。

## 修改内容

### 1. 更新数据类型定义

#### 请求类型更新 (`server/service/app/types.go`)

**CreateWorkflowRequest**:
```go
type CreateWorkflowRequest struct {
    ApiURL      string      `json:"api_url" binding:"required"`
    ApiKey      string      `json:"api_key" binding:"required"`
    Name        string      `json:"name" binding:"required"`
    Description string      `json:"description"`
    Inputs      interface{} `json:"inputs"`
    Outputs     interface{} `json:"outputs"`
    IsPublic    bool        `json:"is_public"`
    Enabled     *bool       `json:"enabled"` // 新增：使用指针类型支持可选字段
}
```

**UpdateWorkflowRequest**:
```go
type UpdateWorkflowRequest struct {
    ApiURL      string      `json:"api_url"`
    ApiKey      string      `json:"api_key"`
    Name        string      `json:"name"`
    Description string      `json:"description"`
    Inputs      interface{} `json:"inputs"`
    Outputs     interface{} `json:"outputs"`
    IsPublic    *bool       `json:"is_public"` // 修改：使用指针类型支持可选字段
    Enabled     *bool       `json:"enabled"`   // 新增：使用指针类型支持可选字段
}
```

**WorkflowResponse**:
```go
type WorkflowResponse struct {
    ID          string      `json:"id"`
    Name        string      `json:"name"`
    Description string      `json:"description"`
    Inputs      interface{} `json:"inputs"`
    Outputs     interface{} `json:"outputs"`
    Used        int64       `json:"used"`
    IsPublic    bool        `json:"is_public"`
    Enabled     bool        `json:"enabled"`     // 新增：返回enabled状态
    CreatedAt   time.Time   `json:"created_at"`
    UpdatedAt   time.Time   `json:"updated_at"`
}
```

### 2. 业务逻辑实现

#### CreateWorkflow 服务修改

```go
func (s *appService) CreateWorkflow(userID string, req CreateWorkflowRequest) (*WorkflowResponse, error) {
    // ... 其他验证逻辑 ...
    
    // 设置默认的enabled值
    enabled := true
    if req.Enabled != nil {
        enabled = *req.Enabled
    }

    // 如果工作流启用，检查名称是否重复
    if enabled {
        var existingWorkflow model.Workflow
        if err := global.DB.Where("name = ? AND enabled = ?", req.Name, true).First(&existingWorkflow).Error; err == nil {
            return nil, errors.New("已启用的工作流名称不能重复")
        } else if !errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("检查工作流名称失败")
        }
    }

    // ... 创建工作流逻辑 ...
}
```

#### UpdateWorkflow 服务修改

```go
func (s *appService) UpdateWorkflow(workflowID, userID string, req UpdateWorkflowRequest) error {
    // ... 权限检查 ...

    // 检查名称重复（如果要更新名称或enabled状态）
    newName := req.Name
    if newName == "" {
        newName = workflow.Name // 如果没有提供新名称，使用当前名称
    }

    newEnabled := workflow.Enabled // 默认使用当前enabled状态
    if req.Enabled != nil {
        newEnabled = *req.Enabled
    }

    // 如果工作流将被启用且名称有变化，或者enabled状态有变化，需要检查名称重复
    if newEnabled && (req.Name != "" || req.Enabled != nil) {
        var existingWorkflow model.Workflow
        query := global.DB.Where("name = ? AND enabled = ? AND id != ?", newName, true, workflowID)
        if err := query.First(&existingWorkflow).Error; err == nil {
            return errors.New("已启用的工作流名称不能重复")
        } else if !errors.Is(err, gorm.ErrRecordNotFound) {
            return errors.New("检查工作流名称失败")
        }
    }

    // ... 更新逻辑 ...
}
```

#### UpdateWorkflow 服务修改

管理员更新工作流的逻辑与普通用户更新相同，同样需要遵循名称唯一性规则。

## 验证规则

### 1. 基本规则
- **只有 `enabled = true` 的工作流需要检查名称唯一性**
- **`enabled = false` 的工作流可以有重复名称**
- **检查范围是全局的，不区分创建者**

### 2. 创建工作流时的验证
- 如果 `enabled` 字段未提供，默认为 `true`
- 如果工作流启用，检查是否存在同名的已启用工作流
- 如果存在重复，返回错误："已启用的工作流名称不能重复"

### 3. 更新工作流时的验证
- **名称更新场景**：如果更新名称且工作流启用，检查新名称是否与其他已启用工作流重复
- **状态更新场景**：如果将工作流从禁用改为启用，检查当前名称是否与其他已启用工作流重复
- **组合更新场景**：同时更新名称和状态时，使用新的名称和状态进行检查
- **排除自身**：检查时排除当前工作流本身

### 4. 验证场景示例

| 场景 | 操作 | 结果 | 说明 |
|------|------|------|------|
| 创建工作流A（enabled=true, name="测试"） | CREATE | ✅ 成功 | 首次创建 |
| 创建工作流B（enabled=true, name="测试"） | CREATE | ❌ 失败 | 名称重复 |
| 创建工作流C（enabled=false, name="测试"） | CREATE | ✅ 成功 | 禁用状态允许重名 |
| 更新工作流C（enabled=true） | UPDATE | ❌ 失败 | 启用时名称重复 |
| 更新工作流A（name="新名称"） | UPDATE | ✅ 成功 | 更新为不重复名称 |
| 更新工作流C（enabled=true） | UPDATE | ✅ 成功 | 现在可以启用了 |

## 数据库建议

为了提高查询性能和确保数据一致性，建议添加以下数据库索引：

```sql
-- 工作流名称唯一性索引（仅针对启用的工作流）
CREATE UNIQUE INDEX idx_workflow_name_enabled ON workflows(name) WHERE enabled = true;

-- 工作流启用状态索引
CREATE INDEX idx_workflows_enabled ON workflows(enabled);

-- 组合索引用于快速查询
CREATE INDEX idx_workflows_name_enabled ON workflows(name, enabled);
```

## API 接口更新

### 请求参数
- `enabled` 字段现在可以在创建和更新请求中使用
- 创建时如果不提供 `enabled` 字段，默认为 `true`
- 更新时 `is_public` 和 `enabled` 都使用指针类型，支持可选更新

### 响应数据
- 所有工作流响应现在都包含 `enabled` 字段
- 现有的 API 接口保持向后兼容

## 错误处理

### 错误消息
- **"已启用的工作流名称不能重复"**：当尝试创建或更新为重复名称时
- **"检查工作流名称失败"**：当数据库查询出错时

### HTTP 状态码
- 名称重复验证失败返回 `400 Bad Request`
- 其他验证错误按原有逻辑处理

## 测试

我们创建了 `workflow_validation_test.go` 测试文件，包含以下测试场景：

1. **创建启用工作流的名称唯一性验证**
2. **创建禁用工作流允许重名**
3. **更新工作流时的名称冲突检测**
4. **状态变更时的验证逻辑**
5. **HTTP 接口的完整测试流程**

## 注意事项

1. **向后兼容性**：现有的 API 接口保持兼容，`enabled` 字段是可选的
2. **性能考虑**：建议添加数据库索引以提高查询性能
3. **数据一致性**：在高并发场景下，数据库唯一索引可以确保数据一致性
4. **错误处理**：所有验证错误都有明确的错误消息，便于前端处理

## 后续建议

1. **添加数据库唯一索引**：在生产环境中添加建议的索引
2. **前端适配**：更新前端代码以支持 `enabled` 字段的管理
3. **监控告警**：添加名称冲突的监控，跟踪验证失败的频率
4. **文档更新**：更新 API 文档以反映新的字段和验证规则
