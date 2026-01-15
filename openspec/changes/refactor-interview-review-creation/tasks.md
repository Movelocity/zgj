# Tasks: 重构面试复盘创建流程

## 1. Backend: API 和 Service 修改

- [x] 1.1 修改 `CreateReviewRequest` 结构体，接收 `tos_file_key` 和 `audio_filename`
- [x] 1.2 修改 `CreateInterviewReview` service 方法，移除 ASR 任务验证逻辑
- [x] 1.3 更新 metadata 初始化逻辑，包含 `tos_file_key`、`audio_filename`、`status: pending`
- [x] 1.4 新增 `StartASR` API 端点 `POST /api/interview/reviews/:id/start-asr`
- [x] 1.5 实现 `StartASR` service 方法：从 metadata 读取 tos_file_key → 生成临时 URL → 提交 ASR 任务 → 更新 asr_task_id
- [x] 1.6 新增 `RetryASR` API 端点 `POST /api/interview/reviews/:id/retry-asr`
- [x] 1.7 实现 `RetryASR` service 方法：检查状态 → 生成新 URL → 提交新 ASR 任务 → 更新 metadata
- [x] 1.8 修改 `TriggerAnalysis` 方法，检查 asr_result 是否存在

## 2. Backend: TOS URL 生成

- [x] 2.1 在 interview service 中添加 TOS 客户端依赖或复用现有服务
- [x] 2.2 实现 `generateDownloadURL(fileKey string) (string, error)` 辅助方法

## 3. Frontend: API Client 更新

- [x] 3.1 修改 `interviewAPI.createReview` 参数类型：`{ tos_file_key, audio_filename }`
- [x] 3.2 新增 `interviewAPI.startASR(reviewId)` 方法
- [x] 3.3 新增 `interviewAPI.retryASR(reviewId)` 方法
- [x] 3.4 更新 `InterviewReviewMetadata` 类型定义，添加 `tos_file_key`、`asr_task_id` 字段

## 4. Frontend: 创建流程重构

- [x] 4.1 修改 `handleFileSelect`：上传完成后立即调用 `createReview` 并导航到详情页
- [x] 4.2 移除 `useInterviewWorkflow` hook 中的 creation-only 状态，改用 review 数据
- [x] 4.3 重构 Step 2 渲染逻辑：检查 review.metadata.asr_result 决定显示内容
- [x] 4.4 实现 `startAsrProcessing` 调用新的 `startASR` API
- [x] 4.5 实现 ASR 轮询逻辑（复用现有 pollUntilComplete，但从 review 获取 task_id）

## 5. Frontend: ASR 重试功能

- [x] 5.1 在 View 模式下添加"重试 ASR"按钮（当 status 为 failed 且 error 与 ASR 相关时显示）
- [x] 5.2 实现 `handleRetryASR` 调用 `retryASR` API
- [x] 5.3 重试后重新进入轮询逻辑

## 6. Frontend: 状态恢复

- [x] 6.1 修改 View 模式加载逻辑，根据 metadata.status 和 asr_result 决定显示界面
- [x] 6.2 支持从 `pending`（无 asr_result）状态恢复 → 显示"开始识别"
- [x] 6.3 支持从 `pending`（有 asr_result）状态恢复 → 显示"开始分析"
- [x] 6.4 支持从 `transcribing` 状态恢复 → 继续轮询

## 7. Validation

- [ ] 7.1 测试完整创建流程：上传 → 创建记录 → ASR → 分析
- [ ] 7.2 测试 ASR 失败后重试流程
- [ ] 7.3 测试页面刷新后恢复流程
- [ ] 7.4 测试错误边界情况：TOS 上传失败、ASR 超时、分析失败
