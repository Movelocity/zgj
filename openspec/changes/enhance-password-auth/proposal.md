# Change: 完善账号密码认证支持

## Why

当前系统主要使用手机号+短信验证码进行认证，虽然安全便捷，但存在以下问题：
- 密码登录功能虽然在后端已实现，但前端入口已被注释，用户无法使用
- 用户注册时无法设置密码，也没有密码确认机制，容易导致输入错误
- 缺少浏览器自动填充支持，影响用户体验
- 密码登录没有防暴力破解机制，存在安全隐患
- 用户无法方便地在密码登录和短信登录之间切换

本提案旨在完善账号密码认证体系，提供更完整的认证选项，同时保持手机号登录作为主要认证方式的定位。

## What Changes

### 前端改进
- 恢复并优化密码登录入口，使其易于访问但不过于突出
- 新增密码注册功能，支持密码确认输入
- 为所有密码和手机号输入框添加正确的 `autocomplete` 属性，支持浏览器密码管理器
- 添加密码强度验证和实时提示
- 优化登录/注册页面布局，支持手机登录和密码登录方式切换

### 后端改进
- 实现登录失败缓存黑名单机制，防止密码暴力破解
  - 基于 IP 地址追踪失败次数
  - 5次失败锁定15分钟
  - 使用内存缓存存储，避免数据库频繁写入
- 为注册接口添加密码设置支持（可选）
- 增强密码复杂度验证（最小6位，建议8位以上）
- 添加密码强度检查工具函数

### 安全机制
- 密码登录失败计数和临时锁定
- 密码强度要求：最少6位（当前），建议8位及以上
- 密码哈希继续使用 bcrypt
- 登录失败记录到日志，便于监控

## Impact

### Affected specs
- `user-auth` (新capability)：用户认证和授权规范

### Affected code

**详细接口规范**: 见 `api-spec.md`

**后端（Go）**:
- `server/api/user/user.go` - 修改Login和Register函数（添加IP检查和密码验证）
- `server/service/user/user_service.go` - 新增3个黑名单函数，修改RegisterWithInvitation签名
- `server/service/user/types.go` - RegisterRequest添加password和confirm_password字段
- `server/utils/password_validator.go` - （可选）密码强度检查工具

**前端（React + TypeScript）**:
- `web/src/pages/auth/Auth.tsx` - 添加登录方式切换
- `web/src/pages/auth/components/` - 新增 `PasswordLogin.tsx` 组件
- `web/src/pages/auth/components/PhoneLogin.tsx` - 添加密码字段和autocomplete属性
- `web/src/api/auth.ts` - 修改RegisterData类型定义

**改动量统计**:
- 新增接口: 0个
- 修改接口: 2个（Login, Register）
- 新增函数: 3个（服务层）
- 新增组件: 1个（PasswordLogin.tsx）

### 数据库
- 无需新增表或字段（User表已包含password字段）

### 兼容性
- **向后兼容**：所有改动向后兼容
- 手机号短信登录保持主要入口
- 密码登录作为备选方案
- 现有用户（默认密码123456）可继续使用或修改密码

