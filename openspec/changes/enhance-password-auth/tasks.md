# Implementation Tasks

**参考文档**: 详细API接口规范见 `api-spec.md`

## 1. Backend - 密码登录防暴力破解机制
- [ ] 1.1 在 `server/service/user/user_service.go` 中定义 `LoginFailInfo` 结构体
  ```go
  type LoginFailInfo struct {
      Count        int
      FirstAttempt time.Time
      LockedUntil  time.Time
  }
  ```
- [ ] 1.2 在 `server/service/user/user_service.go` 中实现 `CheckLoginBlacklist(ip string) (bool, int)` 函数
  - 检查缓存key: `login_fail:{ip}`
  - 返回是否被锁定和剩余分钟数
- [ ] 1.3 在 `server/service/user/user_service.go` 中实现 `RecordLoginFailure(ip string)` 函数
  - 记录失败次数
  - 达到5次时设置锁定到期时间（15分钟）
  - 记录警告日志
- [ ] 1.4 在 `server/service/user/user_service.go` 中实现 `ClearLoginFailures(ip string)` 函数
  - 从缓存删除失败记录
- [ ] 1.5 修改 `server/api/user/user.go` 的 `Login` 函数
  - 获取客户端IP: `ipAddress := c.ClientIP()`
  - 调用 `CheckLoginBlacklist` 检查黑名单
  - 登录失败时调用 `RecordLoginFailure`
  - 登录成功时调用 `ClearLoginFailures`
  - 参考 `api-spec.md` 第1节

## 2. Backend - 注册时密码支持
- [ ] 2.1 修改 `server/service/user/types.go` 的 `RegisterRequest` 结构体
  - 添加 `Password string` 字段（json tag: `password`）
  - 添加 `ConfirmPassword string` 字段（json tag: `confirm_password`）
- [ ] 2.2 修改 `server/api/user/user.go` 的 `Register` 函数
  - 添加密码验证逻辑（如果提供密码）
  - 检查确认密码是否提供
  - 检查两次密码是否一致
  - 检查密码长度 >= 6
  - 参考 `api-spec.md` 第2节
- [ ] 2.3 修改 `server/service/user/user_service.go` 的 `RegisterWithInvitation` 函数签名
  - 添加 `password string` 参数
  - 根据password是否为空选择使用自定义密码或默认密码
  - 参考 `api-spec.md` 第2节

## 3. Frontend - 密码登录组件
- [ ] 3.1 创建 `web/src/pages/auth/components/PasswordLogin.tsx` 组件
  - [ ] 手机号输入框（`autocomplete="username"`）
  - [ ] 密码输入框（`autocomplete="current-password"`）
  - [ ] 忘记密码链接（跳转到重置密码）
  - [ ] 错误提示显示（包括黑名单锁定提示）
- [ ] 3.2 在 `PasswordLogin.tsx` 中实现密码登录逻辑
- [ ] 3.3 添加"显示/隐藏密码"功能（眼睛图标）

## 4. Frontend - 注册时密码设置
- [ ] 4.1 修改 `web/src/pages/auth/components/PhoneLogin.tsx`
  - [ ] 在注册模式下添加密码输入框（`autocomplete="new-password"`）
  - [ ] 添加密码确认输入框（`autocomplete="new-password"`）
  - [ ] 实现密码强度实时检查和提示（弱/中/强）
  - [ ] 验证两次密码输入一致性
- [ ] 4.2 修改注册API调用，包含密码字段

## 5. Frontend - 登录方式切换
- [ ] 5.1 修改 `web/src/pages/auth/Auth.tsx`
  - [ ] 添加标签页或切换按钮（手机登录 / 密码登录）
  - [ ] 根据选择显示对应登录组件（PhoneLogin 或 PasswordLogin）
  - [ ] 保持注册模式独立（仅使用PhoneLogin，但添加密码字段）
- [ ] 5.2 优化页面布局和交互流程

## 6. Frontend - Autocomplete 属性添加
- [ ] 6.1 为所有手机号输入框添加 `autocomplete="username"` 或 `autocomplete="tel"`
- [ ] 6.2 为登录密码框添加 `autocomplete="current-password"`
- [ ] 6.3 为注册/重置密码框添加 `autocomplete="new-password"`
- [ ] 6.4 测试主流浏览器的自动填充功能（Chrome, Safari, Firefox）

## 7. Frontend - 密码重置页面优化
- [ ] 7.1 检查现有重置密码功能是否完整（手机号+短信验证+新密码）
- [ ] 7.2 确保重置密码输入框有正确的autocomplete属性
- [ ] 7.3 添加密码确认输入和强度检查

## 8. Frontend - API 类型定义
- [ ] 8.1 修改 `web/src/api/auth.ts` 的 `RegisterData` 接口
  - 添加 `password?: string` 字段
  - 添加 `confirm_password?: string` 字段
  - 参考 `api-spec.md` 第4.2节
- [ ] 8.2 确认 `web/src/api/auth.ts` 中的 `login` 方法存在且正确
  - 应该已存在，无需修改
- [ ] 8.3 在前端处理API错误时，特殊处理 `code: 429`（黑名单锁定）
  - 参考 `api-spec.md` 第4.1节

## 9. 测试和验证
- [ ] 9.1 测试密码登录功能（正确密码、错误密码、黑名单锁定）
- [ ] 9.2 测试注册时设置密码（包含确认、强度验证）
- [ ] 9.3 测试浏览器自动填充功能
- [ ] 9.4 测试手机登录和密码登录切换
- [ ] 9.5 测试防暴力破解机制（5次失败后锁定）
- [ ] 9.6 测试忘记密码/重置密码流程
- [ ] 9.7 跨浏览器测试（Chrome, Safari, Firefox）

## 10. 文档更新
- [ ] 10.1 更新前端API文档，说明新增的密码认证功能
- [ ] 10.2 更新后端API文档，说明黑名单机制和密码强度要求
- [ ] 10.3 添加用户指南，说明如何使用密码登录和重置密码

