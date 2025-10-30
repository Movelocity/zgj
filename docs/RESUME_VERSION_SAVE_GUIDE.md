# 简历版本保存功能指南

## 功能概述

在更新简历接口中新增 `new_version` 参数，允许用户在保存简历时创建新版本而不是覆盖原有简历。该功能参考 `ReorganizeResumeVersions` 的版本管理逻辑，确保版本号的连续性和一致性。

## API 说明

### 更新简历接口

**接口地址：** `PUT /api/user/resumes/:id`

**请求参数：**

```json
{
  "name": "string (可选)",
  "text_content": "string (可选)",
  "structured_data": "object (可选)",
  "new_version": "boolean (可选，默认为 false)"
}
```

**参数说明：**

- `name`: 简历名称
- `text_content`: 简历文本内容
- `structured_data`: 简历结构化数据（JSON 对象）
- `new_version`: **是否创建新版本**
  - `false` (默认): 更新现有简历，覆盖原有数据
  - `true`: 创建新版本简历，保留原有简历

### 响应示例

#### 1. 普通更新（覆盖原简历）

**请求：**
```json
{
  "name": "更新后的简历名称",
  "text_content": "更新后的内容",
  "new_version": false
}
```

**响应：**
```json
{
  "code": 0,
  "message": "简历更新成功"
}
```

#### 2. 创建新版本

**请求：**
```json
{
  "name": "简历 v2",
  "text_content": "修改后的内容",
  "new_version": true
}
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "message": "简历新版本创建成功",
    "new_resume_id": "RL2Kx9mN7pQwJ4vB3sT",
    "is_new_version": true
  }
}
```

## 功能特性

### 版本管理机制

1. **版本号自动递增**
   - 新版本的版本号 = 当前最大版本号 + 1
   - 按 `resume_number` 分组管理版本

2. **简历编号复用**
   - 同一份简历的所有版本共享相同的 `resume_number`
   - 便于追踪和管理同一简历的不同版本

3. **字段继承与覆盖**
   - 新版本会复制原简历的所有字段
   - 请求中提供的字段会覆盖对应的原有值
   - 未提供的字段保持原简历的值

### 版本创建流程

```
1. 验证原简历是否存在
2. 查询该 resume_number 下的最大版本号
3. 创建新简历记录：
   - 生成新的 ID
   - 复用相同的 resume_number
   - 版本号 = 最大版本号 + 1
   - 复制原简历的所有字段
4. 应用请求中的更新内容
5. 保存新版本简历
6. 返回新简历 ID
```

## 使用场景

### 场景 1：保存简历草稿

用户在编辑简历时，希望保留原版本作为备份，同时创建新版本进行编辑：

```javascript
// 创建新版本
await updateResume(resumeId, {
  structured_data: updatedData,
  new_version: true
});
```

### 场景 2：简历迭代优化

用户对简历进行多次优化，希望保留每次优化的版本：

```javascript
// 第一次优化 -> 创建 v2
await updateResume(resumeId, {
  text_content: "优化后的内容",
  new_version: true
});

// 第二次优化 -> 创建 v3
await updateResume(resumeId, {
  text_content: "再次优化的内容",
  new_version: true
});
```

### 场景 3：不同版本对比

用户创建多个版本后，可以通过版本号查看和对比不同版本的简历：

```javascript
// 获取同一简历的所有版本
const versions = await getResumes({
  resume_number: 'R123456001'
});
```

## 实现细节

### 后端实现

#### 1. 数据模型（types.go）

```go
type UpdateResumeRequest struct {
    Name           string      `json:"name"`
    TextContent    string      `json:"text_content"`
    StructuredData interface{} `json:"structured_data"`
    NewVersion     bool        `json:"new_version"` // 是否创建新版本
}
```

#### 2. 服务层（resume_service.go）

**UpdateResume 方法：**
- 检查 `new_version` 参数
- 如果为 `true`，调用 `createNewResumeVersion` 创建新版本
- 如果为 `false`，执行常规更新逻辑

**createNewResumeVersion 方法：**
- 查询最大版本号
- 创建新简历记录并继承原简历字段
- 应用更新内容
- 返回新简历 ID

#### 3. API 层（resume.go）

- 解析请求参数
- 调用服务层更新方法
- 根据返回值判断是否创建了新版本
- 返回相应的响应信息

### 版本号管理

版本号管理逻辑参考 `ReorganizeResumeVersions` 实现：

```go
// 查询该 resume_number 下的最大版本号
var maxVersion int
global.DB.Model(&model.ResumeRecord{}).
    Where("user_id = ? AND resume_number = ? AND status = ?", 
          userID, originalResume.ResumeNumber, "active").
    Select("COALESCE(MAX(version), 0)").
    Scan(&maxVersion)

// 版本号递增
newVersion := maxVersion + 1
```

## 注意事项

1. **版本号连续性**
   - 版本号基于数据库实时查询，确保连续性
   - 即使中间有版本被删除（软删除），新版本号仍会递增

2. **字段更新策略**
   - 只有请求中明确提供的字段才会被更新
   - 空字符串不会被视为更新（除非原值也为空）
   - `structured_data` 为 `null` 时不会更新

3. **权限控制**
   - 只能为属于当前用户的简历创建新版本
   - 需要通过 JWT 认证

4. **存储空间**
   - 创建新版本会占用额外的数据库存储空间
   - 建议定期清理不需要的旧版本

## 前端集成示例

### TypeScript 类型定义

```typescript
interface UpdateResumeRequest {
  name?: string;
  text_content?: string;
  structured_data?: any;
  new_version?: boolean;
}

interface UpdateResumeResponse {
  code: number;
  message?: string;
  data?: {
    message: string;
    new_resume_id: string;
    is_new_version: boolean;
  };
}
```

### API 调用示例

```typescript
import { request } from '@/utils/request';

/**
 * 更新简历
 * @param id 简历 ID
 * @param data 更新数据
 * @param newVersion 是否创建新版本
 */
export const updateResume = async (
  id: string,
  data: {
    name?: string;
    text_content?: string;
    structured_data?: any;
  },
  newVersion: boolean = false
) => {
  const response = await request.put<UpdateResumeResponse>(
    `/api/user/resumes/${id}`,
    {
      ...data,
      new_version: newVersion,
    }
  );
  
  return response;
};

// 使用示例
const handleSave = async (resumeId: string, updatedData: any) => {
  const response = await updateResume(resumeId, {
    structured_data: updatedData,
  }, true); // 创建新版本
  
  if (response.data?.is_new_version) {
    console.log('新版本 ID:', response.data.new_resume_id);
    // 可以跳转到新版本
    navigate(`/resumes/${response.data.new_resume_id}`);
  }
};
```

## 测试用例

### 测试场景 1：创建新版本

```bash
curl -X PUT http://localhost:8080/api/user/resumes/RL2Kx9mN7pQwJ4vB3sT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "简历 v2",
    "text_content": "更新的内容",
    "new_version": true
  }'
```

**预期结果：**
- 返回新简历 ID
- 原简历保持不变
- 新简历版本号 = 原版本号 + 1

### 测试场景 2：覆盖更新

```bash
curl -X PUT http://localhost:8080/api/user/resumes/RL2Kx9mN7pQwJ4vB3sT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新的名称",
    "new_version": false
  }'
```

**预期结果：**
- 原简历被更新
- 不创建新记录
- 版本号保持不变

## 相关文档

- [简历版本重整理 API](./RESUME_VERSION_REORGANIZE_API.md)
- [简历管理 API](./RESUME_MANAGEMENT_API.md)
- [简历数据迁移指南](./RESUME_MIGRATION_GUIDE.md)

## 更新日志

- **2025-10-29**: 初始版本，添加 `new_version` 参数支持

