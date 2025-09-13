# API 测试套件

这是一个全面的 API 测试套件，用于测试 Resume Polisher 后端服务的基本功能。

## 测试覆盖范围

### 用户 API 测试 (`user_test.go`)
- ✅ 用户注册 (成功/失败场景)
- ✅ 用户登录 (成功/失败场景)
- ✅ 发送短信验证码
- ✅ 验证短信验证码
- ✅ 获取用户信息
- ✅ 更新用户信息
- ✅ 用户登出
- ✅ 重置密码

### 应用 API 测试 (`app_test.go`)
- ✅ 对话管理 (创建/获取/更新/删除)
- ✅ 工作流管理 (创建/获取/更新/删除/执行)
- ✅ 权限验证
- ✅ 错误处理

### 管理员 API 测试 (`admin_test.go`)
- ✅ 用户管理 (获取/更新/激活/停用/删除)
- ✅ 系统统计
- ✅ 系统日志
- ✅ 工作流管理
- ✅ 权限验证

## 测试工具

### 测试工具类 (`test_utils.go`)
- `SetupTestApp()` - 设置测试应用环境
- `CleanupTestApp()` - 清理测试数据
- `MakeRequest()` - 发送 HTTP 请求
- `AssertJSONResponse()` - 断言 JSON 响应
- `CreateTestUser()` - 创建测试用户
- `CreateTestAdmin()` - 创建测试管理员
- `AuthHeaders()` - 生成认证头

## 运行测试

### 前置条件
1. 确保 PostgreSQL 数据库正在运行
2. 配置文件 `config.yaml` 已正确设置
3. 安装所需依赖

### 安装测试依赖
```bash
cd server
go mod tidy
go get github.com/stretchr/testify/assert
```

### 运行所有测试
```bash
cd server/test
go test -v
```

### 运行特定测试文件
```bash
# 运行用户API测试
go test -v -run TestUser

# 运行应用API测试  
go test -v -run TestConversation
go test -v -run TestWorkflow

# 运行管理员API测试
go test -v -run TestAdmin
```

### 运行基准测试
```bash
go test -bench=.
```

### 生成测试覆盖率报告
```bash
go test -cover
go test -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## 测试配置

测试使用与主应用相同的配置文件 `config.yaml`，但会自动：
- 设置为测试模式 (`gin.TestMode`)
- 使用测试数据库 (在原数据库名后加 `_test` 后缀)
- 每个测试后清理数据

## 测试数据

每个测试都会：
1. 设置独立的测试环境
2. 创建必要的测试数据
3. 执行测试逻辑
4. 清理测试数据

测试使用的手机号格式：`138001380XX`，其中 XX 是测试编号。

## 注意事项

1. **数据库隔离**: 每个测试都会清理数据，确保测试间不互相影响
2. **SMS 服务**: 测试中直接插入验证码到数据库，不依赖真实SMS服务
3. **外部 API**: 工作流执行等外部API调用可能会失败，测试会适当处理
4. **并发安全**: 测试设计为可以并发运行

## 扩展测试

要添加新的测试：

1. 在相应的测试文件中添加测试函数
2. 使用 `SetupTestApp()` 和 `CleanupTestApp()` 管理测试环境
3. 使用 `MakeRequest()` 发送请求
4. 使用 `assert` 包进行断言
5. 遵循现有的测试模式和命名约定

## 常见问题

### 数据库连接失败
- 检查 PostgreSQL 是否运行
- 确认 `config.yaml` 中的数据库配置正确
- 确保测试数据库存在或有权限创建

### 测试超时
- 某些测试可能需要较长时间（如外部API调用）
- 可以使用 `-timeout` 参数增加超时时间：`go test -timeout 30s`

### 权限错误
- 确保数据库用户有足够权限创建/删除表和数据
- 检查文件系统权限（日志、上传目录等）
