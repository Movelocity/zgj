## ADDED Requirements

### Requirement: 密码登录防暴力破解

系统SHALL实现基于IP地址的登录失败追踪和临时黑名单机制，以防止密码暴力破解攻击。

#### Scenario: 登录失败次数未达阈值
- **WHEN** 用户从某IP使用密码登录失败，且失败次数少于5次
- **THEN** 系统SHALL记录失败次数并返回"用户名或密码错误"
- **AND** 系统SHALL在内存缓存中更新该IP的失败计数（key: `login_fail:{ip}`）
- **AND** 系统SHALL允许用户继续尝试登录

#### Scenario: 登录失败达到阈值触发锁定
- **WHEN** 用户从某IP使用密码登录失败达到5次（含）
- **THEN** 系统SHALL将该IP锁定15分钟
- **AND** 系统SHALL返回错误消息"登录失败次数过多，请15分钟后再试"
- **AND** 系统SHALL记录锁定事件到日志

#### Scenario: 锁定期间尝试登录
- **WHEN** 某IP处于锁定期内尝试密码登录
- **THEN** 系统SHALL直接拒绝登录请求，不验证密码
- **AND** 系统SHALL返回错误消息"账号已被临时锁定，请X分钟后再试"（X为剩余锁定时间）
- **AND** 系统SHALL不增加失败计数（避免无限延长锁定）

#### Scenario: 成功登录清除失败记录
- **WHEN** 某IP用户密码登录成功
- **THEN** 系统SHALL清除该IP在内存缓存中的失败记录
- **AND** 系统SHALL解除该IP的锁定状态（如果存在）

#### Scenario: 黑名单记录自动过期
- **WHEN** 某IP的失败记录在内存缓存中超过15分钟未更新
- **THEN** 系统SHALL自动删除该记录（TTL机制）
- **AND** 该IP可重新开始登录尝试（失败计数归零）

### Requirement: 注册时密码设置支持

系统SHALL允许用户在注册时选择性设置密码，如果未设置则使用默认密码。

#### Scenario: 注册时提供自定义密码
- **WHEN** 用户注册时提供了 `password` 和 `confirm_password` 字段
- **AND** 两次密码输入一致
- **AND** 密码满足最小长度要求（6位）
- **THEN** 系统SHALL使用用户提供的密码创建账号
- **AND** 系统SHALL对密码进行bcrypt哈希后存储

#### Scenario: 注册时密码确认不一致
- **WHEN** 用户注册时提供了 `password` 和 `confirm_password` 字段
- **AND** 两次密码输入不一致
- **THEN** 系统SHALL返回错误"两次密码输入不一致"
- **AND** 系统SHALL不创建用户账号

#### Scenario: 注册时未提供密码
- **WHEN** 用户注册时未提供 `password` 字段或字段为空
- **THEN** 系统SHALL使用默认密码"123456"创建账号
- **AND** 系统SHALL对默认密码进行bcrypt哈希后存储

#### Scenario: 注册时密码不满足强度要求
- **WHEN** 用户注册时提供的密码少于6位
- **THEN** 系统SHALL返回错误"密码长度至少为6位"
- **AND** 系统SHALL不创建用户账号

### Requirement: 密码强度验证和提示

系统SHALL提供密码强度检查功能，并在前端给予实时反馈。

#### Scenario: 弱密码提示
- **WHEN** 用户输入的密码长度为6-7位且仅包含单一字符类型（纯数字或纯字母）
- **THEN** 前端SHALL显示黄色提示"密码强度：弱"
- **AND** 前端SHALL建议"建议使用8位以上并包含数字和字母"

#### Scenario: 中等强度密码提示
- **WHEN** 用户输入的密码长度为8-11位且包含至少两种字符类型（数字+字母）
- **THEN** 前端SHALL显示蓝色提示"密码强度：中"

#### Scenario: 强密码提示
- **WHEN** 用户输入的密码长度为12位及以上且包含数字、大小写字母或特殊字符
- **THEN** 前端SHALL显示绿色提示"密码强度：强"

### Requirement: 浏览器密码管理器支持

系统SHALL为所有认证相关的输入框添加正确的 `autocomplete` 属性，以支持浏览器密码管理器的自动填充功能。

#### Scenario: 密码登录页面自动填充
- **WHEN** 用户访问密码登录页面
- **AND** 浏览器已保存该手机号对应的密码
- **THEN** 浏览器SHALL自动填充手机号输入框（`autocomplete="username"`）
- **AND** 浏览器SHALL自动填充密码输入框（`autocomplete="current-password"`）

#### Scenario: 注册页面密码保存
- **WHEN** 用户在注册页面填写手机号和新密码并成功注册
- **AND** 密码输入框设置了 `autocomplete="new-password"`
- **THEN** 浏览器SHALL提示用户保存新密码
- **AND** 浏览器SHALL关联手机号和密码以便后续自动填充

#### Scenario: 重置密码页面识别
- **WHEN** 用户在重置密码页面输入新密码
- **AND** 密码输入框设置了 `autocomplete="new-password"`
- **THEN** 浏览器SHALL识别这是密码重置场景
- **AND** 浏览器SHALL提示更新已保存的密码

### Requirement: 密码登录前端入口

系统SHALL在登录页面提供密码登录入口，并支持手机号登录和密码登录之间的切换。

#### Scenario: 默认显示手机号登录
- **WHEN** 用户访问登录页面 `/auth`
- **THEN** 系统SHALL默认显示手机号+短信验证码登录界面
- **AND** 系统SHALL显示"密码登录"标签可供切换

#### Scenario: 切换到密码登录
- **WHEN** 用户在登录页面点击"密码登录"标签
- **THEN** 系统SHALL切换到密码登录界面
- **AND** 界面SHALL包含手机号输入框和密码输入框
- **AND** 界面SHALL包含"忘记密码"链接
- **AND** 界面SHALL不显示短信验证码输入框

#### Scenario: 密码登录成功
- **WHEN** 用户输入正确的手机号和密码并提交
- **AND** 该IP未被锁定
- **THEN** 系统SHALL返回JWT token和用户信息
- **AND** 前端SHALL跳转到首页或来源页面

#### Scenario: 密码登录失败显示错误
- **WHEN** 用户输入错误的密码并提交
- **THEN** 系统SHALL返回错误消息（不透露是手机号还是密码错误）
- **AND** 前端SHALL显示错误提示
- **AND** 前端SHALL清空密码输入框

### Requirement: 注册页面密码输入优化

系统SHALL在注册页面提供可选的密码设置功能，包含密码确认和强度提示。

#### Scenario: 注册页面显示密码字段
- **WHEN** 用户访问注册页面 `/register`
- **THEN** 页面SHALL显示手机号和短信验证码输入框（必填）
- **AND** 页面SHALL显示密码输入框（选填，placeholder提示"设置密码（选填，默认123456）"）
- **AND** 页面SHALL显示确认密码输入框（仅在密码框有内容时显示）
- **AND** 页面SHALL显示密码强度提示（实时更新）

#### Scenario: 注册时仅密码字段被填写显示确认框
- **WHEN** 用户在注册页面的密码框中输入内容
- **THEN** 系统SHALL自动显示确认密码输入框
- **AND** 系统SHALL显示密码强度提示

#### Scenario: 注册时密码和确认密码不一致
- **WHEN** 用户填写密码和确认密码
- **AND** 两次输入不一致
- **THEN** 系统SHALL在确认密码框下方显示红色提示"两次密码输入不一致"
- **AND** 系统SHALL禁用提交按钮直到输入一致

### Requirement: 黑名单锁定日志记录

系统SHALL记录所有登录失败和黑名单锁定事件到日志，以便监控和审计。

#### Scenario: 记录登录失败
- **WHEN** 用户密码登录失败
- **THEN** 系统SHALL记录日志包含：IP地址、手机号（如果提供）、失败时间、失败次数

#### Scenario: 记录黑名单锁定
- **WHEN** 某IP因失败次数过多被锁定
- **THEN** 系统SHALL记录警告级别日志包含：IP地址、锁定触发时间、锁定时长

#### Scenario: 记录锁定期间的登录尝试
- **WHEN** 处于锁定期的IP尝试登录
- **THEN** 系统SHALL记录日志包含：IP地址、尝试时间、剩余锁定时间

