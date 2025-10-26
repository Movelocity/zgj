# 邀请码系统使用指南

## 功能概述

邀请码系统允许管理员创建、管理和跟踪邀请码的使用情况。主要功能包括：

1. **创建邀请码**：支持单个创建和批量创建
2. **邀请码管理**：查看、激活、禁用邀请码
3. **使用追踪**：追踪每个邀请码的使用次数和使用者
4. **灵活配置**：支持设置使用次数限制和有效期

## 数据库表结构

### invitation_codes（邀请码表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键ID |
| code | VARCHAR(32) | 邀请码（唯一） |
| creator_id | VARCHAR(20) | 创建者用户ID |
| max_uses | INT | 最大使用次数（-1表示无限） |
| used_count | INT | 已使用次数 |
| expires_at | TIMESTAMP | 过期时间（NULL表示永不过期） |
| created_at | TIMESTAMP | 创建时间 |
| is_active | BOOLEAN | 是否激活 |
| note | VARCHAR(200) | 备注 |

### invitation_uses（邀请码使用记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键ID |
| invitation_code | VARCHAR(32) | 使用的邀请码 |
| used_by | VARCHAR(20) | 使用者用户ID |
| used_at | TIMESTAMP | 使用时间 |
| ip_address | VARCHAR(45) | 使用时的IP地址 |
| user_agent | TEXT | 用户代理信息 |

**注意**：`invitation_code` 和 `used_by` 字段组合构成唯一索引，确保每个用户只能使用同一邀请码一次。

## API 接口

### 1. 创建邀请码

**请求**
```http
POST /api/invitations
Authorization: Bearer {token}

{
  "max_uses": 50,           // 最大使用次数，-1表示无限
  "expires_in_days": null,  // 有效期（天），null表示永不过期
  "note": "给新员工使用"    // 备注（可选）
}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "code": "ABCD-EFGH-IJKL",
    "expires_at": "2024-01-01T00:00:00Z",
    "max_uses": 50,
    "used_count": 0,
    "created_at": "2023-12-01T00:00:00Z",
    "is_active": true,
    "note": "给新员工使用",
    "creator": "管理员"
  },
  "msg": "success"
}
```

### 2. 验证邀请码

**请求**
```http
POST /api/invitations/validate

{
  "code": "ABCD-EFGH-IJKL"
}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "is_valid": true,
    "max_uses": 50,
    "used_count": 2,
    "expires_at": "2024-01-01T00:00:00Z",
    "message": ""
  },
  "msg": "success"
}
```

### 3. 使用邀请码

**请求**
```http
POST /api/invitations/use

{
  "code": "ABCD-EFGH-IJKL",
  "user_id": "用户ID"
}
```

**响应**
```json
{
  "code": 0,
  "data": null,
  "msg": "邀请码使用成功"
}
```

### 4. 查询邀请码列表（管理员）

**请求**
```http
GET /api/invitations?page=1&limit=20
Authorization: Bearer {admin_token}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "data": [
      {
        "code": "ABCD-EFGH-IJKL",
        "max_uses": 50,
        "used_count": 2,
        "expires_at": "2024-01-01T00:00:00Z",
        "created_at": "2023-12-25T00:00:00Z",
        "is_active": true,
        "note": "给新员工使用",
        "creator": "管理员"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  },
  "msg": "success"
}
```

### 5. 获取邀请码详情（管理员）

**请求**
```http
GET /api/invitations/{code}
Authorization: Bearer {admin_token}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "code": "ABCD-EFGH-IJKL",
    "max_uses": 50,
    "used_count": 2,
    "expires_at": "2024-01-01T00:00:00Z",
    "created_at": "2023-12-25T00:00:00Z",
    "is_active": true,
    "note": "给新员工使用",
    "creator": "管理员"
  },
  "msg": "success"
}
```

### 6. 禁用邀请码（管理员）

**请求**
```http
POST /api/invitations/{code}/deactivate
Authorization: Bearer {admin_token}
```

**响应**
```json
{
  "code": 0,
  "data": null,
  "msg": "邀请码已禁用"
}
```

### 7. 激活邀请码（管理员）

**请求**
```http
POST /api/invitations/{code}/activate
Authorization: Bearer {admin_token}
```

**响应**
```json
{
  "code": 0,
  "data": null,
  "msg": "邀请码已激活"
}
```

## 前端管理界面

### 访问路径

管理员登录后，访问 `/admin` 页面，点击"邀请码管理"标签。

### 主要功能

1. **邀请码列表**
   - 显示所有邀请码及其使用情况
   - 支持查看邀请码详情
   - 支持激活/禁用邀请码
   - 显示使用进度条和状态

2. **创建邀请码**
   - 点击"创建邀请码"按钮
   - 设置使用次数（-1表示无限次）
   - 设置有效期（留空表示永不过期）
   - 添加备注信息

3. **批量创建**
   - 点击"批量创建"按钮
   - 系统自动为所有没有邀请码的用户创建邀请码
   - 默认配置：每个邀请码可使用10次，永不过期

4. **邀请码统计**
   - 显示总邀请码数
   - 显示激活中的邀请码数
   - 显示已禁用的邀请码数
   - 显示总使用次数

5. **复制邀请码**
   - 点击邀请码旁边的复制图标
   - 邀请码自动复制到剪贴板

## 使用场景

### 场景1：为新用户创建邀请码

1. 管理员登录系统
2. 进入邀请码管理页面
3. 点击"创建邀请码"
4. 设置使用次数为1（一次性邀请码）
5. 设置有效期为7天
6. 添加备注"新员工邀请码"
7. 创建完成后，复制邀请码发送给新用户

### 场景2：批量为现有用户创建邀请码

1. 管理员登录系统
2. 进入邀请码管理页面
3. 点击"批量创建"按钮
4. 系统自动为所有没有邀请码的用户创建邀请码
5. 每个用户获得一个可使用10次的永久邀请码

### 场景3：禁用滥用的邀请码

1. 发现某个邀请码被滥用
2. 在邀请码列表中找到该邀请码
3. 点击"禁用"按钮
4. 该邀请码立即失效，无法再被使用

### 场景4：创建推广邀请码

1. 创建邀请码时设置：
   - 使用次数：-1（无限次）
   - 有效期：30天
   - 备注：春节推广活动
2. 将邀请码用于市场推广
3. 活动结束后，禁用邀请码

## 邀请码格式

邀请码格式为：`XXXX-XXXX-XXXX`（12位字符，使用Base32编码）

示例：
- `ABCD-EFGH-IJKL`
- `1234-5678-90AB`
- `QWER-TYUI-OPAS`

## 错误处理

### 常见错误

1. **邀请码不存在**
   ```json
   {
     "code": 1,
     "data": null,
     "msg": "邀请码不存在"
   }
   ```

2. **邀请码已过期**
   ```json
   {
     "code": 1,
     "data": null,
     "msg": "邀请码已过期"
   }
   ```

3. **邀请码使用次数已达上限**
   ```json
   {
     "code": 1,
     "data": null,
     "msg": "邀请码使用次数已达上限"
   }
   ```

4. **用户已使用过该邀请码**
   ```json
   {
     "code": 1,
     "data": null,
     "msg": "您已使用过此邀请码"
   }
   ```

5. **邀请码已被禁用**
   ```json
   {
     "code": 1,
     "data": null,
     "msg": "邀请码已被禁用"
   }
   ```

## 注意事项

1. **权限控制**
   - 创建邀请码需要登录用户权限
   - 查看和管理所有邀请码需要管理员权限（role = 888）

2. **使用限制**
   - 每个用户对同一邀请码只能使用一次
   - 邀请码使用记录包含IP地址和User Agent，便于追踪

3. **性能考虑**
   - 邀请码列表支持分页查询，默认每页20条
   - 建议定期清理过期的邀请码记录

4. **安全建议**
   - 不要在公开场合分享永久有效的邀请码
   - 定期检查邀请码使用情况，及时禁用异常邀请码
   - 重要活动使用专门的邀请码，活动结束后立即禁用

## 技术实现

### 后端技术栈

- Go + Gin框架
- GORM ORM
- PostgreSQL数据库
- JWT认证

### 前端技术栈

- React + TypeScript
- Tailwind CSS
- React Icons
- Axios

### 数据库迁移

系统使用GORM的AutoMigrate功能自动创建和更新数据库表结构，无需手动执行SQL脚本。

启动服务器时，系统会自动：
1. 检查并创建`invitation_codes`表
2. 检查并创建`invitation_uses`表
3. 创建必要的索引和约束

## 未来扩展

可能的扩展功能：

1. **邀请奖励系统**：用户成功邀请他人注册后获得奖励
2. **邀请统计报表**：显示每个用户的邀请成功率
3. **邀请码分组**：支持按活动或用途对邀请码分组管理
4. **邀请链接**：生成包含邀请码的专属邀请链接
5. **邀请排行榜**：显示邀请人数最多的用户

