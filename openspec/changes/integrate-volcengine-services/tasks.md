# Implementation Tasks - 火山引擎服务集成

## 1. 准备工作

- [ ] 1.1 在火山引擎控制台创建 TOS bucket
  - [ ] 配置 bucket 名称和区域
  - [ ] 配置 CORS 规则(允许前端跨域上传)
  - [ ] 配置生命周期规则(可选)
- [ ] 1.2 配置 IAM 用户和角色
  - [ ] 创建 IAM 用户,获取 AK/SK
  - [ ] 创建 IAM 角色,配置 TOS 权限策略
  - [ ] 配置信任关系,允许用户扮演角色
- [ ] 1.3 在火山引擎语音技术控制台创建 ASR 应用
  - [ ] 创建应用,获取 APP ID
  - [ ] 获取 Access Token
  - [ ] 开通录音文件识别服务
- [ ] 1.4 添加 Go 依赖包
  - [ ] 在 go.mod 中添加 TOS SDK: `github.com/volcengine/ve-tos-golang-sdk/v2/tos`
  - [ ] 在 go.mod 中添加火山引擎 SDK: `github.com/volcengine/volc-sdk-golang`
  - [ ] 运行 `go mod tidy`

## 2. 后端 - 配置管理

- [ ] 2.1 修改 `server/config/config.go`
  - [ ] 添加 `TOSConfig` 结构体(STS和TOS配置)
  - [ ] 添加 `ASRConfig` 结构体(语音识别配置)
  - [ ] 在 `Config` 结构体中添加 `TOS` 和 `ASR` 字段
- [ ] 2.2 更新 `config.yaml` 配置文件模板
  - [ ] 添加 TOS 配置示例
  - [ ] 添加 ASR 配置示例
  - [ ] 添加配置说明注释
- [ ] 2.3 在 `server/initialize/config.go` 中加载配置
  - [ ] 验证 TOS 配置读取
  - [ ] 验证 ASR 配置读取

## 3. 后端 - 数据模型

- [ ] 3.1 创建 `server/model/tos_upload.go`
  - [ ] 定义 `TOSUpload` 结构体
  - [ ] 实现 `TableName()` 方法
  - [ ] 定义索引标签
- [ ] 3.2 创建 `server/model/asr_task.go`
  - [ ] 定义 `ASRTask` 结构体
  - [ ] 实现 `TableName()` 方法
  - [ ] 定义索引标签
  - [ ] 定义任务状态常量(pending/processing/completed/failed)
- [ ] 3.3 在 `server/initialize/db.go` 中注册模型
  - [ ] 在 `AutoMigrate` 中添加 `model.TOSUpload{}`
  - [ ] 在 `AutoMigrate` 中添加 `model.ASRTask{}`
- [ ] 3.4 重启服务验证表创建成功

## 4. 后端 - TOS 服务层

- [ ] 4.1 创建 `server/service/tos/` 目录
- [ ] 4.2 创建 `server/service/tos/types.go`
  - [ ] 定义 `STSCredentials` 结构体(临时凭证)
  - [ ] 定义 `PresignRequest` 结构体(预签名请求)
  - [ ] 定义 `PresignResponse` 结构体(预签名响应)
  - [ ] 定义 `DownloadResponse` 结构体(下载链接响应)
  - [ ] 定义 `UploadListResponse` 结构体(上传记录列表)
- [ ] 4.3 创建 `server/service/tos/tos_service.go`
  - [ ] 定义 `TOSServiceInterface` 接口
  - [ ] 实现 `tosService` 结构体
  - [ ] 实现 `GetSTSCredentials` 方法(调用STS API)
  - [ ] 实现 `GeneratePresignedURL` 方法(生成上传URL)
  - [ ] 实现 `GenerateDownloadURL` 方法(生成下载URL)
  - [ ] 实现 `RecordUpload` 方法(记录上传到数据库)
  - [ ] 实现 `ListUploads` 方法(查询上传记录)
  - [ ] 实现 `NewTOSService` 构造函数
- [ ] 4.4 在 `server/global/global.go` 中添加服务实例
  - [ ] 添加 `TOSService TOSServiceInterface` 字段
- [ ] 4.5 在 `server/initialize/service.go` 中初始化服务
  - [ ] 初始化 TOS 服务: `global.TOSService = tos.NewTOSService()`

## 5. 后端 - TOS API 接口

- [ ] 5.1 创建 `server/api/tos/` 目录
- [ ] 5.2 创建 `server/api/tos/tos.go`
  - [ ] 实现 `GetSTSCredentials(c *gin.Context)` - 获取STS临时凭证
  - [ ] 实现 `GeneratePresignURL(c *gin.Context)` - 生成上传预签名URL
  - [ ] 实现 `GenerateDownloadURL(c *gin.Context)` - 生成下载预签名URL
  - [ ] 实现 `RecordUploadComplete(c *gin.Context)` - 上传完成回调
  - [ ] 实现 `ListUploads(c *gin.Context)` - 获取上传记录列表
  - [ ] 添加参数验证和错误处理
- [ ] 5.3 创建 `server/router/tos.go`
  - [ ] 注册公共路由(如果需要)
  - [ ] 注册私有路由(需要JWT认证)
    - `GET /api/tos/sts` - 获取STS凭证
    - `POST /api/tos/presign` - 生成上传URL
    - `GET /api/tos/presign/download` - 生成下载URL
    - `POST /api/tos/uploads/complete` - 上传完成
    - `GET /api/tos/uploads` - 查询记录
- [ ] 5.4 在 `server/router/enter.go` 中注册路由组
  - [ ] 添加 `TOSRouter` 路由组
- [ ] 5.5 在 `server/initialize/router.go` 中初始化路由
  - [ ] 调用 `router.TOSRouter.InitTOSRouter()`

## 6. 后端 - ASR 服务层

- [ ] 6.1 创建 `server/service/asr/` 目录
- [ ] 6.2 创建 `server/service/asr/types.go`
  - [ ] 定义 `SubmitTaskRequest` 结构体(提交任务请求)
  - [ ] 定义 `ASRTask` 结构体(任务信息)
  - [ ] 定义 `TaskListResponse` 结构体(任务列表响应)
  - [ ] 定义 `RecognitionResult` 结构体(识别结果)
  - [ ] 定义任务状态常量
- [ ] 6.3 创建 `server/service/asr/asr_service.go`
  - [ ] 定义 `ASRServiceInterface` 接口
  - [ ] 实现 `asrService` 结构体
  - [ ] 实现 `SubmitTask` 方法(调用ASR API提交任务)
  - [ ] 实现 `GetTask` 方法(从数据库获取任务)
  - [ ] 实现 `PollTask` 方法(查询ASR API并更新数据库)
  - [ ] 实现 `ListTasks` 方法(查询任务列表)
  - [ ] 实现 `DeleteTask` 方法(删除任务)
  - [ ] 实现 `RetryTask` 方法(重试失败任务)
  - [ ] 实现 `NewASRService` 构造函数
- [ ] 6.4 在 `server/global/global.go` 中添加服务实例
  - [ ] 添加 `ASRService ASRServiceInterface` 字段
- [ ] 6.5 在 `server/initialize/service.go` 中初始化服务
  - [ ] 初始化 ASR 服务: `global.ASRService = asr.NewASRService()`

## 7. 后端 - ASR API 接口

- [ ] 7.1 创建 `server/api/asr/` 目录
- [ ] 7.2 创建 `server/api/asr/asr.go`
  - [ ] 实现 `SubmitTask(c *gin.Context)` - 提交识别任务
  - [ ] 实现 `GetTask(c *gin.Context)` - 查询任务详情
  - [ ] 实现 `PollTask(c *gin.Context)` - 轮询任务结果
  - [ ] 实现 `ListTasks(c *gin.Context)` - 获取任务列表
  - [ ] 实现 `DeleteTask(c *gin.Context)` - 删除任务
  - [ ] 实现 `RetryTask(c *gin.Context)` - 重试任务
  - [ ] 添加参数验证和错误处理
- [ ] 7.3 创建 `server/router/asr.go`
  - [ ] 注册私有路由(需要JWT认证)
    - `POST /api/asr/tasks` - 提交任务
    - `GET /api/asr/tasks/:id` - 查询任务
    - `POST /api/asr/tasks/:id/poll` - 轮询结果
    - `GET /api/asr/tasks` - 任务列表
    - `DELETE /api/asr/tasks/:id` - 删除任务
    - `POST /api/asr/tasks/:id/retry` - 重试任务
- [ ] 7.4 在 `server/router/enter.go` 中注册路由组
  - [ ] 添加 `ASRRouter` 路由组
- [ ] 7.5 在 `server/initialize/router.go` 中初始化路由
  - [ ] 调用 `router.ASRRouter.InitASRRouter()`

## 8. 后端 - 事件日志集成(可选)

- [ ] 8.1 在 TOS 服务中添加事件记录
  - [ ] 上传完成记录事件
  - [ ] 上传失败记录事件
- [ ] 8.2 在 ASR 服务中添加事件记录
  - [ ] 任务提交记录事件
  - [ ] 识别完成记录事件
  - [ ] 识别失败记录事件

## 9. 前端 - API 接口定义

- [ ] 9.1 创建 `web/src/types/api.ts` 中添加类型定义
  - [ ] 添加 TOS 相关类型(`STSCredentials`, `PresignResponse`等)
  - [ ] 添加 ASR 相关类型(`ASRTask`, `SubmitTaskRequest`等)
- [ ] 9.2 创建 `web/src/api/tos.ts`
  - [ ] 实现 `getSTSCredentials()` API调用
  - [ ] 实现 `generatePresignURL()` API调用
  - [ ] 实现 `generateDownloadURL()` API调用
  - [ ] 实现 `recordUploadComplete()` API调用
  - [ ] 实现 `listUploads()` API调用
- [ ] 9.3 创建 `web/src/api/asr.ts`
  - [ ] 实现 `submitTask()` API调用
  - [ ] 实现 `getTask()` API调用
  - [ ] 实现 `pollTask()` API调用
  - [ ] 实现 `listTasks()` API调用
  - [ ] 实现 `deleteTask()` API调用
  - [ ] 实现 `retryTask()` API调用

## 10. 前端 - TOS 上传组件

- [ ] 10.1 创建 `web/src/components/upload/TOSUploader.tsx`
  - [ ] 实现文件选择和预览
  - [ ] 实现获取预签名 URL
  - [ ] 实现直传到 TOS
  - [ ] 实现上传进度显示
  - [ ] 实现上传完成回调
  - [ ] 实现错误处理和重试
- [ ] 10.2 创建 `web/src/hooks/useTOSUpload.ts`
  - [ ] 封装上传逻辑为 Hook
  - [ ] 提供上传状态管理
  - [ ] 提供上传进度管理
- [ ] 10.3 集成到现有上传界面
  - [ ] 在简历上传页面集成
  - [ ] 在头像上传功能集成

## 11. 前端 - ASR 识别界面

- [ ] 11.1 创建 `web/src/pages/voice/VoiceUpload.tsx`
  - [ ] 实现录音文件上传(使用TOS)
  - [ ] 实现提交识别任务
  - [ ] 实现轮询识别结果
  - [ ] 实现识别结果展示
  - [ ] 实现说话人分离展示
  - [ ] 实现文本编辑和保存
- [ ] 11.2 创建 `web/src/hooks/useASRTask.ts`
  - [ ] 封装任务提交和轮询逻辑
  - [ ] 提供任务状态管理
  - [ ] 提供轮询控制(开始/停止)
- [ ] 11.3 创建 `web/src/pages/voice/TaskList.tsx`
  - [ ] 实现任务列表展示
  - [ ] 实现任务筛选
  - [ ] 实现任务删除
  - [ ] 实现失败任务重试
- [ ] 11.4 添加路由
  - [ ] 在 `router.tsx` 中添加语音上传路由
  - [ ] 在导航菜单中添加入口

## 12. 测试

- [ ] 12.1 后端单元测试
  - [ ] 测试 TOS 服务层方法
  - [ ] 测试 ASR 服务层方法
  - [ ] Mock 外部 API 调用
- [ ] 12.2 后端集成测试
  - [ ] 测试 TOS API 接口
  - [ ] 测试 ASR API 接口
  - [ ] 测试数据库操作
- [ ] 12.3 前端组件测试
  - [ ] 测试 TOSUploader 组件
  - [ ] 测试 VoiceUpload 页面
  - [ ] 测试上传流程
- [ ] 12.4 端到端测试
  - [ ] 测试完整上传流程(前端→TOS)
  - [ ] 测试完整识别流程(上传→提交→轮询→结果)
  - [ ] 测试错误场景(网络失败、超时等)

## 13. 文档

- [ ] 13.1 更新后端 API 文档
  - [ ] 添加 TOS 接口文档
  - [ ] 添加 ASR 接口文档
  - [ ] 添加请求/响应示例
- [ ] 13.2 创建配置指南
  - [ ] 编写火山引擎配置步骤
  - [ ] 编写 config.yaml 配置说明
  - [ ] 添加常见问题 FAQ
- [ ] 13.3 创建使用文档
  - [ ] 编写前端集成指南
  - [ ] 编写语音上传使用说明
  - [ ] 添加最佳实践建议
- [ ] 13.4 更新 INTEGRATION_GUIDE.md
  - [ ] 添加部署说明
  - [ ] 添加故障排查指南

## 14. 部署

- [ ] 14.1 开发环境验证
  - [ ] 配置开发环境的 TOS 和 ASR
  - [ ] 验证所有功能正常
  - [ ] 验证错误处理
- [ ] 14.2 配置生产环境
  - [ ] 在生产环境配置 TOS bucket
  - [ ] 配置生产环境的 IAM 和 STS
  - [ ] 配置生产环境的 ASR 应用
  - [ ] 配置 CORS 规则
- [ ] 14.3 生产环境部署
  - [ ] 更新 config.yaml 配置
  - [ ] 部署后端服务
  - [ ] 部署前端资源
  - [ ] 验证服务可用性
- [ ] 14.4 监控和告警
  - [ ] 配置外部服务调用监控
  - [ ] 配置错误告警
  - [ ] 配置用量监控

## 实现顺序建议

### Phase 1: 基础设施(P0)
**目标**: 搭建配置和数据模型
- 任务 1: 准备工作
- 任务 2: 配置管理
- 任务 3: 数据模型

### Phase 2: TOS 服务(P0)
**目标**: 实现文件上传功能
- 任务 4: TOS 服务层
- 任务 5: TOS API 接口
- 任务 12.1: 单元测试
- 任务 12.2: 集成测试(TOS部分)

### Phase 3: ASR 服务(P1)
**目标**: 实现语音识别功能
- 任务 6: ASR 服务层
- 任务 7: ASR API 接口
- 任务 12.1: 单元测试
- 任务 12.2: 集成测试(ASR部分)

### Phase 4: 前端集成(P1)
**目标**: 实现前端上传和识别界面
- 任务 9: API 接口定义
- 任务 10: TOS 上传组件
- 任务 11: ASR 识别界面
- 任务 12.3: 组件测试
- 任务 12.4: 端到端测试

### Phase 5: 文档和部署(P1)
**目标**: 完善文档并部署上线
- 任务 13: 文档
- 任务 14: 部署
- 任务 8: 事件日志集成(可选)

## 依赖关系

```
1 (准备工作)
  ↓
2 (配置管理) + 3 (数据模型)
  ↓
4 (TOS 服务层)
  ↓
5 (TOS API 接口)
  ↓
6 (ASR 服务层)
  ↓
7 (ASR API 接口)
  ↓
9 (前端 API 定义)
  ↓
10 (TOS 上传组件) + 11 (ASR 识别界面)
  ↓
12 (测试)
  ↓
13 (文档) + 14 (部署)
```

## 里程碑

- **M1 (基础设施)**: 完成 Phase 1,配置和数据模型就绪
- **M2 (TOS 服务)**: 完成 Phase 2,TOS 文件上传功能可用
- **M3 (ASR 服务)**: 完成 Phase 3,ASR 语音识别功能可用
- **M4 (前端集成)**: 完成 Phase 4,前端界面完整可用
- **M5 (上线部署)**: 完成 Phase 5,生产环境上线

## 时间估算

- Phase 1: 0.5-1 天(配置和准备)
- Phase 2: 2-3 天(TOS 服务开发和测试)
- Phase 3: 2-3 天(ASR 服务开发和测试)
- Phase 4: 3-4 天(前端开发和集成)
- Phase 5: 1-2 天(文档和部署)

**总计**: 8.5-13 天(约 2 周)
