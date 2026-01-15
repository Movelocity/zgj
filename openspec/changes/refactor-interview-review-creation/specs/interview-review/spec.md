# Interview Review Creation Flow

## MODIFIED Requirements

### Requirement: Interview Review Detail Page - Creation Mode

The system SHALL provide a guided workflow at `/interview/reviews` (without ID parameter) with a horizontal step indicator, allowing users to upload audio, **create review record immediately after upload**, submit ASR tasks, and trigger analysis while persisting progress to metadata.

#### Scenario: Initialize creation workflow

- **WHEN** user navigates to `/interview/reviews` without `id` query parameter
- **THEN** the system displays step indicator showing 3 steps: "上传音频", "语音识别", "AI分析"
- **AND** highlights step 1 as current step
- **AND** displays audio file upload interface (drag-drop or file selector)
- **AND** no API calls are made until user uploads a file

#### Scenario: Step 1 - Upload audio to TOS and create review

- **WHEN** user selects audio file (MP3, WAV, OGG, max 100MB)
- **THEN** the system validates file type and size
- **WHEN** validation passes
- **THEN** the system calls `tosAPI.uploadToTOS(file)` to upload to TOS
- **AND** displays upload progress bar
- **WHEN** upload completes
- **THEN** the system calls `interviewAPI.createReview({ tos_file_key, audio_filename })` to create review record
- **AND** updates URL to `/interview/reviews?id={review_id}` without full page reload
- **AND** loads the created review data
- **AND** advances to step 2 automatically

#### Scenario: Step 2 - Start ASR task

- **WHEN** user is on step 2 with a review record that has no `asr_result` in metadata
- **THEN** the system displays "开始识别" button
- **WHEN** user clicks "开始识别" button
- **THEN** the system calls `interviewAPI.startASR(reviewId)` to submit ASR task
- **AND** displays progress indicator showing ASR status
- **AND** starts polling via `asrAPI.pollUntilComplete(taskId)`
- **WHEN** ASR task completes
- **THEN** the system reloads review data to get updated `asr_result`
- **AND** enables "下一步" button to proceed to step 3

#### Scenario: Step 2 - ASR failure and retry

- **WHEN** ASR task fails during polling
- **THEN** the system displays error message from task.error_message
- **AND** shows "重试识别" button
- **WHEN** user clicks "重试识别" button
- **THEN** the system calls `interviewAPI.retryASR(reviewId)`
- **AND** backend generates fresh TOS download URL using stored `tos_file_key`
- **AND** submits new ASR task with fresh URL
- **AND** starts polling for new task completion

#### Scenario: Step backward navigation

- **WHEN** user clicks "上一步" button on step 2 or 3
- **THEN** the system returns to previous step
- **AND** preserves review record and any completed ASR results
- **AND** allows user to proceed forward again

#### Scenario: Step 3 - Trigger analysis

- **WHEN** user clicks "下一步" from step 2 after ASR completion
- **THEN** the system advances to step 3 "AI分析"
- **AND** displays "开始分析" button
- **WHEN** user clicks "开始分析" button
- **THEN** the system calls `interviewAPI.triggerAnalysis(reviewId)` to start Dify workflow
- **AND** displays analysis progress indicator

#### Scenario: Recover workflow from page refresh

- **WHEN** user navigates to `/interview/reviews?id=xxx` with existing review
- **AND** review has `tos_file_key` but no `asr_result`
- **THEN** the system displays step 2 with "开始识别" button
- **WHEN** review has `asr_result` but status is not `completed`
- **THEN** the system displays step 3 with "开始分析" button
- **WHEN** review status is `transcribing`
- **THEN** the system resumes polling for ASR task completion

### Requirement: Interview Review Detail Page - View/Retry Mode

The system SHALL provide a detail view at `/interview/reviews?id=xxx` that loads existing review data, displays completion status from metadata, shows analysis results if completed, or allows retry if failed.

#### Scenario: Display ASR failure with retry option

- **WHEN** loaded review has `metadata.status === 'failed'`
- **AND** `metadata.error_message` contains ASR-related error
- **THEN** the system displays error badge "识别失败"
- **AND** shows error message from metadata
- **AND** displays "重试识别" button (enabled)
- **WHEN** user clicks "重试识别" button
- **THEN** the system calls `interviewAPI.retryASR(reviewId)`
- **AND** updates status indicator to "识别中"
- **AND** starts polling for ASR completion

#### Scenario: Retry analysis (unchanged)

- **WHEN** user clicks "重新分析" button
- **THEN** the system checks current `metadata.status`
- **WHEN** status is 'completed' or 'failed' (analysis failure, not ASR)
- **THEN** the system calls `interviewAPI.triggerAnalysis(id)`
- **AND** updates status indicator to "分析中"
- **AND** starts polling for completion

## ADDED Requirements

### Requirement: Create Review API with TOS File Key

The system SHALL accept TOS file key when creating interview review records, storing file information in metadata for later ASR processing.

#### Scenario: Create review with TOS file key

- **WHEN** client calls `POST /api/interview/reviews` with body `{ tos_file_key, audio_filename }`
- **THEN** the system creates new interview review record
- **AND** initializes metadata with:
  - `tos_file_key`: the provided TOS file key
  - `audio_filename`: the original filename
  - `status`: "pending"
- **AND** returns the created review with ID

#### Scenario: Validation failure

- **WHEN** `tos_file_key` is empty or missing
- **THEN** the system returns error code with message "TOS文件key不能为空"

### Requirement: Start ASR API Endpoint

The system SHALL provide an endpoint to start ASR processing for an existing interview review, using stored TOS file key to generate fresh download URL.

#### Scenario: Start ASR for pending review

- **WHEN** client calls `POST /api/interview/reviews/:id/start-asr`
- **AND** review exists and belongs to current user
- **AND** review status is "pending" with no `asr_result`
- **THEN** the system reads `tos_file_key` from metadata
- **AND** generates temporary download URL via TOS service
- **AND** submits ASR task with generated URL
- **AND** updates metadata with `asr_task_id` and `status: transcribing`
- **AND** returns updated review

#### Scenario: ASR already completed

- **WHEN** client calls `POST /api/interview/reviews/:id/start-asr`
- **AND** review already has `asr_result` in metadata
- **THEN** the system returns error "ASR已完成，无需重复识别"

### Requirement: Retry ASR API Endpoint

The system SHALL provide an endpoint to retry ASR processing, generating fresh TOS URL and submitting new ASR task.

#### Scenario: Retry ASR for failed review

- **WHEN** client calls `POST /api/interview/reviews/:id/retry-asr`
- **AND** review status is "failed" or ASR task failed
- **THEN** the system reads `tos_file_key` from metadata
- **AND** generates new temporary download URL via TOS service
- **AND** submits new ASR task with fresh URL
- **AND** updates metadata with new `asr_task_id` and `status: transcribing`
- **AND** returns updated review

#### Scenario: Retry not allowed

- **WHEN** client calls `POST /api/interview/reviews/:id/retry-asr`
- **AND** review status is "transcribing" or "analyzing"
- **THEN** the system returns error "任务正在进行中，无法重试"

### Requirement: Updated Metadata Type Definition

The system SHALL update TypeScript type definitions to reflect new metadata structure with TOS file information.

#### Scenario: InterviewReviewMetadata type definition

- **WHEN** TypeScript code references InterviewReviewMetadata type
- **THEN** the system provides interface with fields:
  - `tos_file_key: string` - TOS storage key for audio file
  - `audio_filename?: string` - Original filename
  - `asr_task_id?: string` - Current ASR task ID (may change on retry)
  - `asr_result?: Record<string, any>` - Cached ASR result
  - `status: ReviewStatus` - Current processing status
  - `error_message?: string` - Error details
  - `job_position?: string` - Job title (user editable)
  - `target_company?: string` - Company name (user editable)

## REMOVED Requirements

### Requirement: ASR Task Validation on Create

**Reason**: Review creation no longer depends on completed ASR task. Records are created after TOS upload, before ASR processing.

**Migration**: Remove ASR task validation logic from `CreateInterviewReview` service method.

### Requirement: main_audio_id as ASR Task ID

**Reason**: The `main_audio_id` field was used to store ASR task ID. This is replaced by `tos_file_key` for file storage and `asr_task_id` for ASR task tracking.

**Migration**: Update API and type definitions. No backward compatibility required.
