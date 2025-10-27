# 用户邀请码管理功能指南

## 功能概述

为用户个人资料页面添加了邀请码管理功能，允许用户查看、创建和管理自己的邀请码。

## 实现内容

### 后端实现

#### 1. 服务层 (`server/service/invitation/invitation_service.go`)

新增方法：
```go
GetUserCreatedInvitationList(userID string, page, limit string) (*InvitationListResponse, error)
```

功能：
- 查询指定用户创建的所有邀请码
- 支持分页查询（默认每页20条，最多100条）
- 按创建时间倒序排列
- 关联创建者信息

#### 2. API层 (`server/api/invitation/invitation.go`)

新增处理函数：
```go
GetUserCreatedInvitationList(c *gin.Context)
```

功能：
- 从JWT token获取当前登录用户ID
- 验证用户登录状态
- 支持分页参数（page, limit）
- 调用服务层获取邀请码列表

#### 3. 路由配置 (`server/router/invitation.go`)

新增路由：
```
GET /api/invitations/my-created
```

- 需要用户登录认证
- 属于私有路由组

### 前端实现

#### 1. API接口 (`web/src/api/invitation.ts`)

新增方法：
```typescript
getMyCreatedInvitations(params?: { page?: number; limit?: number })
```

#### 2. 用户界面 (`web/src/pages/profile/components/ProfileInfo.tsx`)

新增功能：

##### 状态管理
- `myInvitations`: 存储用户创建的邀请码列表
- `loadingInvitations`: 加载状态
- `creatingInvitation`: 创建邀请码加载状态

##### 核心功能

1. **加载邀请码列表** (`loadMyInvitations`)
   - 页面加载时自动获取用户创建的邀请码
   - 最多显示100条记录

2. **创建邀请码** (`handleCreateInvitation`)
   - 一键创建新的邀请码
   - 默认配置：
     - 无使用次数限制（max_uses: -1）
     - 无时间限制（expires_in_days: null）
     - 备注：'用户自创建'
   - 创建成功后自动刷新列表

3. **复制邀请码** (`handleCopyCode`)
   - 点击复制按钮将邀请码复制到剪贴板
   - 使用 `navigator.clipboard` API
   - 提供成功/失败提示

##### UI设计

邀请码卡片显示信息：
- **邀请码**：以等宽字体显示，带复制按钮
- **激活状态**：绿色标签（激活）/ 灰色标签（禁用）
- **使用情况**：已使用次数 / 总次数（无限制显示为"无限制"）
- **有效期**：过期时间或"永久有效"
- **创建时间**：本地化时间格式
- **备注**：如果有备注则显示

空状态提示：
- 无邀请码时显示友好提示
- 引导用户点击按钮创建

## 使用说明

### 用户端操作

1. **访问个人资料页面**
   - 登录后进入"个人资料"页面
   - 滚动到"我的邀请码"部分

2. **创建邀请码**
   - 点击右上角"创建邀请码"按钮
   - 系统自动生成格式为 `XXXX-XXXX-XXXX` 的邀请码
   - 创建成功后显示在列表中

3. **复制邀请码**
   - 点击邀请码旁边的复制图标
   - 邀请码自动复制到剪贴板
   - 可以分享给其他用户使用

4. **查看使用情况**
   - 每个邀请码卡片显示详细的使用信息
   - 实时查看已使用次数
   - 查看创建时间和有效期

### 邀请码特性

- **默认无限制**：创建的邀请码默认无使用次数和时间限制
- **自动生成**：邀请码格式统一，易于识别
- **实时更新**：使用情况实时同步
- **状态管理**：支持激活/禁用（管理员功能）

## API接口文档

### 获取用户创建的邀请码列表

**请求**
```
GET /api/invitations/my-created
```

**查询参数**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量（最大100） |

**请求头**
```
Authorization: Bearer {JWT_TOKEN}
```

**响应示例**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "data": [
      {
        "code": "ABCD-EFGH-IJKL",
        "max_uses": -1,
        "used_count": 5,
        "expires_at": null,
        "created_at": "2025-10-26T10:00:00Z",
        "is_active": true,
        "note": "用户自创建",
        "creator_id": "user123",
        "creator": "张三"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

**响应字段说明**
| 字段 | 类型 | 说明 |
|------|------|------|
| code | string | 邀请码 |
| max_uses | number | 最大使用次数（-1表示无限制） |
| used_count | number | 已使用次数 |
| expires_at | string\|null | 过期时间（null表示永不过期） |
| created_at | string | 创建时间 |
| is_active | boolean | 是否激活 |
| note | string | 备注 |
| creator_id | string | 创建者ID |
| creator | string | 创建者名称 |

## 技术要点

### 后端
1. 使用 GORM 的 Preload 预加载创建者信息
2. 支持分页查询，避免一次性加载过多数据
3. 按创建时间倒序排列，最新的在前
4. 通过 JWT 获取用户ID，确保安全性

### 前端
1. 使用 React Hooks 管理状态
2. 异步操作带加载状态提示
3. 使用 Clipboard API 实现一键复制
4. 响应式设计，适配不同屏幕尺寸
5. 友好的错误提示和空状态处理

## 注意事项

1. **权限控制**：用户只能查看自己创建的邀请码
2. **默认配置**：用户创建的邀请码默认无限制，便于分享
3. **管理限制**：用户不能修改或删除邀请码（需要管理员权限）
4. **浏览器兼容**：复制功能需要浏览器支持 Clipboard API

## 后续扩展建议

1. 添加邀请码删除功能（可选）
2. 支持自定义邀请码配置（使用次数、有效期等）
3. 添加邀请码使用记录详情（谁使用了这个邀请码）
4. 添加邀请统计功能（总邀请人数、活跃度等）
5. 支持邀请码分类或标签管理

## 文件变更清单

### 后端
- `server/service/invitation/invitation_service.go` - 新增服务方法
- `server/api/invitation/invitation.go` - 新增API处理函数
- `server/router/invitation.go` - 新增路由配置

### 前端
- `web/src/api/invitation.ts` - 新增API调用方法
- `web/src/pages/profile/components/ProfileInfo.tsx` - 新增UI组件和逻辑

## 测试建议

1. **功能测试**
   - 测试邀请码创建
   - 测试邀请码列表加载
   - 测试复制功能
   - 测试空状态显示

2. **边界测试**
   - 无邀请码时的显示
   - 大量邀请码时的性能
   - 网络错误时的处理

3. **安全测试**
   - 未登录用户访问
   - 跨用户访问测试
   - JWT token过期处理

