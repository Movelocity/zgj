# JSONB 字段空值修复文档

## 问题描述

在 TOS 和 ASR 服务中，某些字段在数据库中定义为 `jsonb` 类型，但代码在创建记录时可能传入空字符串 `""`，导致 PostgreSQL 报错：

```
ERROR: invalid input syntax for type json (SQLSTATE 22P02)
```

## 涉及的字段

### TOS 服务

**表**: `tos_uploads`

| 字段 | 类型 | 问题 |
|------|------|------|
| `metadata` | jsonb | 前端可能不传或传空字符串 |

**相关代码**: `server/api/tos/tos.go:120`

---

### ASR 服务

**表**: `asr_tasks`

| 字段 | 类型 | 问题 |
|------|------|------|
| `result` | jsonb | 创建任务时未初始化，GORM 默认为空字符串 |
| `options` | jsonb | 正常（已序列化为 JSON） |

**相关代码**: `server/service/asr/asr_service.go:96`

---

## 修复方案

### 1. TOS 服务修复

**文件**: `server/api/tos/tos.go`

**修复内容**:

```go
// 处理 metadata：如果为空字符串，设置为 null（空的 JSON）
metadata := req.Metadata
if metadata == "" {
    metadata = "null"
}

// 创建上传记录
upload := &model.TOSUpload{
    UserID:      userID,
    Key:         req.Key,
    Filename:    req.Filename,
    ContentType: req.ContentType,
    Size:        req.Size,
    Status:      "success",
    Metadata:    metadata, // 使用处理后的值
}
```

**修复位置**: Line 112-128

---

### 2. ASR 服务修复

**文件**: `server/service/asr/asr_service.go`

**修复内容**:

```go
// 创建任务记录
task := &model.ASRTask{
    ID:          taskID,
    UserID:      req.UserID,
    AudioURL:    req.AudioURL,
    AudioFormat: req.AudioFormat,
    Status:      model.ASRTaskStatusPending,
    Progress:    0,
    Options:     string(optionsJSON),
    Result:      "null", // 初始化为有效的 JSON 值，避免 jsonb 字段报错
}
```

**修复位置**: Line 89-98

---

## 为什么使用 `"null"` 而不是 `"{}"`

### 选择 `"null"` 的原因

1. **语义清晰**: `null` 明确表示"没有值"，符合字段的初始状态
2. **更小的存储**: `null` 只需要 1 字节，`{}` 需要更多空间
3. **前端处理方便**: 
   ```typescript
   const result = asrAPI.parseResult(task);
   if (!result) {
     // result 为 null，未识别
   }
   ```

### 使用 `"{}"` 的场景

如果字段表示"空对象但存在"的语义，可以使用 `{}`：

```go
Metadata: "{}" // 表示有元数据结构，但内容为空
```

---

## JSONB 字段最佳实践

### 1. 使用指针类型（推荐方案）

如果字段可以为 NULL，在 Go 模型中使用指针类型：

```go
type TOSUpload struct {
    // ... 其他字段
    Metadata *string `gorm:"type:jsonb" json:"metadata,omitempty"`
}

// 使用时
var metadata *string
if req.Metadata != "" {
    metadata = &req.Metadata
}

upload := &model.TOSUpload{
    // ... 其他字段
    Metadata: metadata, // 未设置时为 nil，数据库中为 NULL
}
```

**优点**:
- 自动处理 NULL 值
- 类型安全
- 符合 Go 惯例

**缺点**:
- 使用时需要判空
- 代码稍显冗长

---

### 2. 使用默认值（当前方案）

为 jsonb 字段提供有效的默认值：

```go
Result: "null" // 或 "{}"
```

**优点**:
- 简单直接
- 不需要修改模型定义

**缺点**:
- 需要在每个创建位置手动处理
- 容易遗漏

---

### 3. 使用 GORM Hooks

在模型中添加 Hook 自动处理：

```go
func (t *TOSUpload) BeforeCreate(tx *gorm.DB) error {
    if t.Metadata == "" {
        t.Metadata = "null"
    }
    return nil
}
```

**优点**:
- 统一处理，不易遗漏
- 模型自包含

**缺点**:
- Hook 可能影响性能
- 增加模型复杂度

---

## 验证测试

### 1. TOS 服务测试

```bash
# 测试 metadata 为空的情况
curl -X POST http://localhost:8888/api/tos/uploads/complete \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "uploads/test.txt",
    "filename": "test.txt",
    "content_type": "text/plain",
    "size": 1024
  }'

# 期望结果：成功，metadata 在数据库中为 null
```

### 2. ASR 服务测试

```bash
# 测试任务创建
curl -X POST http://localhost:8888/api/asr/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio.mp3",
    "audio_format": "mp3",
    "options": {
      "enable_itn": true,
      "enable_ddc": true
    }
  }'

# 期望结果：成功，result 在数据库中为 null
```

### 3. 前端测试页面

访问测试页面验证完整流程：

- **TOS 测试**: http://localhost:5173/test/tos
- **ASR 测试**: http://localhost:5173/test/asr

---

## 数据库验证

### 查看 TOS 上传记录

```sql
SELECT id, filename, 
       metadata,
       metadata IS NULL as is_null,
       pg_typeof(metadata) as field_type
FROM tos_uploads 
ORDER BY created_at DESC 
LIMIT 5;
```

### 查看 ASR 任务记录

```sql
SELECT id, status, 
       result,
       result IS NULL as is_null,
       options,
       pg_typeof(result) as result_type,
       pg_typeof(options) as options_type
FROM asr_tasks 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 相关问题排查

### 如何判断是 JSONB 字段问题

**错误特征**:
1. 错误信息包含 `invalid input syntax for type json`
2. 错误代码为 `SQLSTATE 22P02`
3. SQL 语句中某个字段值为空字符串 `''`

**排查步骤**:
1. 查看错误日志中的 SQL 语句
2. 找到值为 `''` 的字段
3. 检查数据库表定义，确认该字段是否为 `jsonb` 或 `json` 类型
4. 检查代码中该字段的赋值逻辑

---

## 未来优化建议

### 1. 统一 JSONB 处理

创建一个辅助函数：

```go
// utils/json.go
func NullableJSON(s string) string {
    if s == "" {
        return "null"
    }
    return s
}

// 使用
Metadata: utils.NullableJSON(req.Metadata)
```

### 2. 使用自定义类型

```go
type NullableJSON string

func (n NullableJSON) Value() (driver.Value, error) {
    if n == "" {
        return "null", nil
    }
    return string(n), nil
}

// 在模型中使用
type TOSUpload struct {
    Metadata NullableJSON `gorm:"type:jsonb" json:"metadata,omitempty"`
}
```

### 3. 添加验证

在 API 层添加请求验证：

```go
func validateJSONField(s string) error {
    if s == "" {
        return nil // 空字符串会被处理
    }
    var js json.RawMessage
    return json.Unmarshal([]byte(s), &js)
}
```

---

## 修复检查清单

- [x] TOS `metadata` 字段空值处理
- [x] ASR `result` 字段初始化
- [x] 添加修复文档
- [x] 创建前端测试页面
- [ ] 添加单元测试（建议）
- [ ] 考虑迁移到指针类型（长期优化）

---

**版本**: v1.0.0  
**修复日期**: 2025-12-31  
**作者**: Resume Polisher Team

