# 邀请码更新功能使用指南

## 功能概述

邀请码管理界面现已支持单个和批量更新邀请码的过期时间、使用次数上限和备注信息，方便管理员灵活管理邀请码。

## 功能特性

### 1. 选择邀请码（批量更新）
- **单选**：点击表格每行前的复选框可以选择/取消选择单个邀请码
- **全选**：点击表头的复选框可以一次性选择/取消选择当前页面的所有邀请码
- **选择计数**：页面顶部会显示当前已选择的邀请码数量

### 2. 单个邀请码编辑
点击每行的"编辑"按钮可以编辑单个邀请码，支持修改：

#### 使用次数上限
- 输入正整数：设置为指定的使用次数
- 输入 `-1`：设置为无限次使用
- 留空：不修改此字段

#### 有效期（天数）
- 输入正整数：从当前时间开始计算，设置邀请码在指定天数后过期
- 输入 `0`：设置为永不过期
- 留空：不修改此字段

#### 备注
- 可以修改邀请码的备注信息
- 备注会被更新（即使填空也会更新为空字符串）

**优势：**
- 显示当前值，方便对比
- 支持修改备注
- 更适合针对性调整

### 3. 批量更新
选择一个或多个邀请码后，点击"批量更新"按钮，可以批量修改以下属性：

#### 使用次数上限
- 输入正整数：设置为指定的使用次数
- 输入 `-1`：设置为无限次使用
- 留空：不修改此字段

#### 有效期（天数）
- 输入正整数：从当前时间开始计算，设置邀请码在指定天数后过期
- 输入 `0`：设置为永不过期
- 留空：不修改此字段

**注意事项：**
- 至少需要填写一个字段（使用次数或有效期）
- 留空的字段不会被更新
- 更新操作不可撤销，请谨慎操作

## API 接口

### 更新单个邀请码（管理员）

**接口地址：** `PUT /api/invitations/:code`

**权限要求：** 管理员

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | 邀请码 |

**请求参数：**

```json
{
  "max_uses": 10,
  "expires_in_days": 30,
  "note": "VIP用户专属邀请码"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| max_uses | number \| null | 否 | 使用次数上限（-1表示无限次，null表示不更新） |
| expires_in_days | number \| null | 否 | 有效期天数（0表示永不过期，null表示不更新） |
| note | string \| null | 否 | 备注（null表示不更新） |

**响应示例：**

```json
{
  "code": 0,
  "msg": "更新成功",
  "data": null
}
```

**错误响应：**

```json
{
  "code": -1,
  "msg": "邀请码不存在",
  "data": null
}
```

---

### 批量更新邀请码（管理员）

**接口地址：** `POST /api/invitations/batch-update`

**权限要求：** 管理员

**请求参数：**

```json
{
  "codes": ["ABCD-EFGH-IJKL", "MNOP-QRST-UVWX"],
  "max_uses": 10,
  "expires_in_days": 30
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| codes | string[] | 是 | 要更新的邀请码列表 |
| max_uses | number \| null | 否 | 使用次数上限（-1表示无限次，null表示不更新） |
| expires_in_days | number \| null | 否 | 有效期天数（0表示永不过期，null表示不更新） |

**响应示例：**

```json
{
  "code": 0,
  "msg": "批量更新成功",
  "data": null
}
```

**错误响应：**

```json
{
  "code": -1,
  "msg": "部分邀请码不存在",
  "data": null
}
```

## 使用场景

### 单个编辑场景

#### 场景 1：修改特定邀请码的使用次数和备注
1. 找到需要修改的邀请码
2. 点击该行的"编辑"按钮
3. 修改使用次数为 20
4. 添加备注："重点客户专用"
5. 确认更新

#### 场景 2：延长特定邀请码的有效期
1. 找到即将过期的邀请码
2. 点击"编辑"按钮
3. 设置有效期为 30天（从当前时间重新计算）
4. 确认更新

### 批量更新场景

#### 场景 3：延长所有即将过期的邀请码
1. 筛选出即将过期的邀请码
2. 勾选需要延长的邀请码
3. 点击"批量更新"
4. 设置 `expires_in_days` 为 30（延长30天）
5. 留空 `max_uses`
6. 确认更新

#### 场景 4：限制所有无限使用邀请码的使用次数
1. 筛选出无限使用的邀请码（max_uses = -1）
2. 全选这些邀请码
3. 点击"批量更新"
4. 设置 `max_uses` 为 10
5. 留空 `expires_in_days`
6. 确认更新

#### 场景 5：将部分邀请码设为永不过期
1. 勾选需要设置为永不过期的邀请码
2. 点击"批量更新"
3. 设置 `expires_in_days` 为 0
4. 留空 `max_uses`
5. 确认更新

## 实现细节

### 后端实现

#### 单个更新
- 使用 `PUT /api/invitations/:code` 接口
- 支持更新 `max_uses`、`expires_in_days` 和 `note` 三个字段
- 使用事务确保更新的原子性
- 完整的数据验证和错误处理

#### 批量更新
- 使用 `POST /api/invitations/batch-update` 接口
- 检查所有邀请码是否存在
- 使用数据库事务确保批量更新的原子性
- 如果任何步骤失败，整个更新会回滚

#### 数据验证
- 验证 `max_uses` 必须为 -1（无限次）或大于 0
- 验证 `expires_in_days` 必须大于等于 0
- 确保至少有一个字段需要更新

### 前端实现

#### 单个编辑状态管理
- `editingInvitation`：存储正在编辑的邀请码对象
- `showEditModal`：控制编辑弹窗的显示
- `editForm`：存储编辑表单数据
- `editLoading`：控制编辑时的加载状态

#### 批量更新状态管理
- `selectedCodes`：存储已选择的邀请码列表
- `showBatchUpdateModal`：控制批量更新弹窗的显示
- `batchUpdateForm`：存储批量更新表单数据
- `batchUpdateLoading`：控制更新时的加载状态

#### 交互优化
- 编辑弹窗显示当前值，方便对比
- 选择邀请码后立即显示"批量更新"按钮
- 实时显示已选择的邀请码数量
- 更新成功后自动刷新列表

## 相关文件

### 后端
- `server/service/invitation/types.go` - 添加了 `UpdateInvitationRequest` 和 `BatchUpdateInvitationRequest` 类型
- `server/service/invitation/invitation_service.go` - 添加了 `UpdateInvitation` 和 `BatchUpdateInvitation` 方法
- `server/api/invitation/invitation.go` - 添加了 `UpdateInvitation` 和 `BatchUpdateInvitation` API处理函数
- `server/router/invitation.go` - 添加了单个更新和批量更新的路由

### 前端
- `web/src/types/invitation.ts` - 添加了 `UpdateInvitationRequest` 和 `BatchUpdateInvitationRequest` 类型
- `web/src/api/invitation.ts` - 添加了 `updateInvitation` 和 `batchUpdateInvitations` API调用
- `web/src/pages/admin/components/InvitationManagement.tsx` - 实现了单个编辑和批量更新的UI和逻辑

## 更新日志

**2025-10-26**
- ✅ 添加单个邀请码编辑功能
  - 支持修改使用次数上限
  - 支持修改过期时间
  - 支持修改备注信息
  - 显示当前值方便对比
- ✅ 添加批量更新邀请码功能
  - 支持批量修改使用次数上限
  - 支持批量修改过期时间
  - 添加全选/单选功能
  - 添加批量更新弹窗和表单验证

