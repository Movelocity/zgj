# Interview Review Frontend UI

## ADDED Requirements

### Requirement: Interview Review List Page

The system SHALL provide a list page at `/interview/reviews` displaying all interview review records for the authenticated user with table/card layout, status indicators, editable metadata fields, and navigation controls.

#### Scenario: Display user's review list

- **WHEN** authenticated user navigates to `/interview/reviews`
- **THEN** the system fetches reviews via `GET /api/interview/reviews` with pagination
- **AND** displays records in a responsive table/card layout
- **AND** each record shows: creation time, status badge, job position, target company
- **AND** status badges use color coding (blue=transcribing, yellow=analyzing, red=failed/timeout, green=completed)

#### Scenario: Pagination navigation

- **WHEN** user has more than 10 review records
- **THEN** the system displays pagination controls at the bottom
- **AND** defaults to page 1 with 10 items per page
- **AND** clicking page numbers loads the corresponding page
- **AND** maintains pagination state during navigation

#### Scenario: Create new review

- **WHEN** user clicks "新建面试复盘" button
- **THEN** the system navigates to `/interview/reviews` (without ID parameter)
- **AND** detail page opens in creation mode with step indicator at step 1

#### Scenario: Navigate to review detail

- **WHEN** user clicks on a review record in the list
- **THEN** the system navigates to `/interview/reviews?id={review_id}`
- **AND** detail page opens in view/retry mode

#### Scenario: Inline edit job position and company

- **WHEN** user clicks edit icon next to job position or target company field
- **THEN** the field becomes editable (inline input or modal)
- **WHEN** user saves changes
- **THEN** the system updates `metadata.job_position` or `metadata.target_company` via backend API
- **AND** displays success toast notification
- **AND** refreshes the list to show updated values

#### Scenario: Empty state

- **WHEN** user has no review records
- **THEN** the system displays empty state message with call-to-action
- **AND** shows "开始你的第一次面试复盘" button
- **AND** clicking button navigates to creation flow

### Requirement: Interview Review Detail Page - Creation Mode

The system SHALL provide a guided workflow at `/interview/reviews` (without ID parameter) with a horizontal step indicator, allowing users to upload audio, submit ASR tasks, create review records, and trigger analysis while persisting progress to metadata.

#### Scenario: Initialize creation workflow

- **WHEN** user navigates to `/interview/reviews` without `id` query parameter
- **THEN** the system displays step indicator showing 3 steps: "上传音频", "语音识别", "AI分析"
- **AND** highlights step 1 as current step
- **AND** displays audio file upload interface (drag-drop or file selector)
- **AND** no API calls are made until user uploads a file

#### Scenario: Step 1 - Upload audio to TOS

- **WHEN** user selects audio file (MP3, WAV, OGG, max 100MB)
- **THEN** the system validates file type and size
- **WHEN** validation passes
- **THEN** the system calls `tosAPI.uploadToTOS(file)` to upload to TOS
- **AND** displays upload progress bar
- **WHEN** upload completes
- **THEN** the system generates download URL via `tosAPI.generateDownloadURL(key)`
- **AND** stores audio URL and filename in local state
- **AND** enables "下一步" button to proceed to step 2
- **AND** displays "上一步" button (disabled on step 1)

#### Scenario: Step 2 - Submit ASR task and poll

- **WHEN** user clicks "下一步" from step 1
- **THEN** the system advances step indicator to step 2 "语音识别"
- **AND** automatically submits ASR task via `asrAPI.submitTask({ audio_url, audio_format })`
- **WHEN** ASR task created successfully
- **THEN** the system stores ASR task ID in local state
- **AND** starts polling via `asrAPI.pollUntilComplete(taskId)`
- **AND** displays progress indicator showing ASR status and percentage
- **WHEN** ASR task completes
- **THEN** the system parses result via `asrAPI.parseResult(task)`
- **AND** stores ASR result in local state
- **AND** enables "下一步" button to proceed to step 3

#### Scenario: Step 2 - ASR failure handling

- **WHEN** ASR task fails during polling
- **THEN** the system displays error message from task.error_message
- **AND** shows "重试" button to resubmit ASR task
- **AND** allows user to click "上一步" to return to step 1 and re-upload

#### Scenario: Step backward navigation

- **WHEN** user clicks "上一步" button on step 2 or 3
- **THEN** the system returns to previous step
- **AND** preserves uploaded audio file and ASR result (no re-processing)
- **AND** allows user to re-upload or proceed forward again

#### Scenario: Step 3 - Create review and trigger analysis

- **WHEN** user clicks "下一步" from step 2 after ASR completion
- **THEN** the system advances to step 3 "AI分析"
- **AND** calls `interviewAPI.createReview({ main_audio_id, asr_result })` to create review record
- **WHEN** review created successfully
- **THEN** the system receives review ID from backend
- **AND** updates URL to `/interview/reviews?id={review_id}` without full page reload
- **AND** calls `interviewAPI.triggerAnalysis(reviewId)` to start Dify workflow
- **AND** displays analysis progress indicator
- **AND** disables "上一步" button (cannot go back after review created)

#### Scenario: Persist workflow progress to metadata

- **WHEN** each step completes successfully
- **THEN** the system updates metadata fields:
  - `current_step`: 1, 2, or 3
  - `steps_completed`: ["upload", "asr", "analyze"]
  - `audio_filename`: original file name
  - `job_position`: (optional, user-editable later)
  - `target_company`: (optional, user-editable later)
- **WHEN** review record is created (step 3)
- **THEN** metadata is persisted to backend via `POST /api/interview/reviews`

### Requirement: Interview Review Detail Page - View/Retry Mode

The system SHALL provide a detail view at `/interview/reviews?id=xxx` that loads existing review data, displays completion status from metadata, shows analysis results if completed, or allows retry if failed.

#### Scenario: Load existing review on mount

- **WHEN** user navigates to `/interview/reviews?id=xxx`
- **THEN** the system extracts review ID from query parameter
- **AND** calls `interviewAPI.getReview(id)` to fetch review data
- **WHEN** API call succeeds
- **THEN** the system reads `metadata.status` field
- **AND** determines UI mode based on status

#### Scenario: Display completed analysis

- **WHEN** loaded review has `metadata.status === 'completed'`
- **THEN** the system displays "分析完成" status badge
- **AND** renders analysis results from `data` field using Markdown renderer
- **AND** displays ASR transcription JSON in expandable section
- **AND** shows "重新分析" button (enabled if not currently analyzing)

#### Scenario: Display in-progress analysis

- **WHEN** loaded review has `metadata.status === 'transcribing' | 'analyzing'`
- **THEN** the system displays progress indicator with current status
- **AND** starts polling `interviewAPI.getReview(id)` every 3 seconds
- **WHEN** status changes to 'completed' or 'failed'
- **THEN** the system stops polling
- **AND** updates UI accordingly

#### Scenario: Display failed analysis

- **WHEN** loaded review has `metadata.status === 'failed'`
- **THEN** the system displays error badge "分析失败"
- **AND** shows error message from `metadata.error_message`
- **AND** displays "重新分析" button (enabled)
- **AND** clicking button triggers retry workflow

#### Scenario: Retry analysis

- **WHEN** user clicks "重新分析" button
- **THEN** the system checks current `metadata.status`
- **WHEN** status is 'completed' or 'failed'
- **THEN** the system calls `interviewAPI.triggerAnalysis(id)`
- **AND** updates status indicator to "分析中"
- **AND** starts polling for completion
- **AND** disables "重新分析" button until analysis finishes
- **WHEN** status is 'transcribing' or 'analyzing'
- **THEN** the system shows toast warning "任务进行中，无法重试"

#### Scenario: Display ASR transcription result

- **WHEN** review has `metadata.asr_result` populated
- **THEN** the system displays "语音识别结果" section with JSON viewer
- **AND** formats JSON with syntax highlighting and collapsible structure
- **AND** user can expand/collapse JSON nodes for inspection

#### Scenario: Edit job position and company in detail view

- **WHEN** user clicks edit icon next to "岗位" or "目标公司" field
- **THEN** the system displays inline input field
- **WHEN** user saves changes
- **THEN** the system updates `metadata.job_position` or `metadata.target_company`
- **AND** calls backend API to persist changes (update review metadata)
- **AND** displays success toast notification

### Requirement: Step Indicator Component

The system SHALL provide a reusable horizontal step indicator component showing workflow progress with visual states (pending, active, completed).

#### Scenario: Render step indicator

- **WHEN** StepIndicator component receives steps array and currentStep prop
- **THEN** the system renders horizontal timeline with step circles and connecting lines
- **AND** each step shows: number/icon, label text
- **AND** applies visual state based on position:
  - Completed steps: green checkmark icon, solid green line
  - Current step: blue circle with number, pulsing animation
  - Pending steps: gray circle with number, dashed gray line

#### Scenario: Interactive step navigation (optional)

- **WHEN** user clicks on a completed step circle
- **THEN** the system triggers onStepClick callback (if provided)
- **AND** parent component handles backward navigation logic

### Requirement: Navigation Integration

The system SHALL add "面试复盘" link to the top navigation bar for authenticated users.

#### Scenario: Display navigation link

- **WHEN** user is authenticated
- **THEN** the system displays "面试复盘" link in Header2 component
- **AND** positions link after "我的简历" in navigation menu
- **WHEN** current route matches `/interview/reviews*`
- **THEN** the link appears with active styling (blue text, underline)

#### Scenario: Navigate to interview reviews

- **WHEN** user clicks "面试复盘" link
- **THEN** the system navigates to `/interview/reviews` (list page)
- **AND** loads user's review records

### Requirement: API Client Integration

The system SHALL provide TypeScript API client at `web/src/api/interview.ts` with methods for all interview review endpoints, following project conventions (axios, unified response format, error handling).

#### Scenario: Create review API call

- **WHEN** client calls `interviewAPI.createReview({ main_audio_id, asr_result })`
- **THEN** the system sends POST request to `/api/interview/reviews`
- **AND** includes JWT token in Authorization header
- **WHEN** response.code === 0
- **THEN** returns typed InterviewReview object
- **WHEN** response.code !== 0
- **THEN** throws error with response.msg

#### Scenario: Get review API call

- **WHEN** client calls `interviewAPI.getReview(id)`
- **THEN** the system sends GET request to `/api/interview/reviews/:id`
- **WHEN** response.code === 0
- **THEN** returns typed InterviewReview object with all fields

#### Scenario: List reviews API call

- **WHEN** client calls `interviewAPI.listReviews({ page, page_size })`
- **THEN** the system sends GET request to `/api/interview/reviews?page=X&page_size=Y`
- **WHEN** response.code === 0
- **THEN** returns typed InterviewReviewListResponse with pagination metadata

#### Scenario: Trigger analysis API call

- **WHEN** client calls `interviewAPI.triggerAnalysis(id)`
- **THEN** the system sends POST request to `/api/interview/reviews/:id/analyze`
- **WHEN** response.code === 0
- **THEN** returns updated InterviewReview object with analyzing status

### Requirement: Type Safety and Data Modeling

The system SHALL provide comprehensive TypeScript type definitions at `web/src/types/interview.ts` matching backend model structure and API responses.

#### Scenario: InterviewReview type definition

- **WHEN** TypeScript code references InterviewReview type
- **THEN** the system provides interface with fields:
  - `id: number` - Primary key
  - `user_id: string` - User identifier
  - `data: Record<string, any> | null` - AI analysis results (JSONB)
  - `metadata: InterviewReviewMetadata` - Workflow state
  - `created_at: string` - ISO timestamp
  - `updated_at: string` - ISO timestamp

#### Scenario: InterviewReviewMetadata type definition

- **WHEN** TypeScript code references InterviewReviewMetadata type
- **THEN** the system provides interface with fields:
  - `main_audio_id: string` - ASR task ID
  - `workflow_id?: string` - Dify workflow ID
  - `status: ReviewStatus` - Enum type
  - `asr_result?: Record<string, any>` - Cached ASR result
  - `error_message?: string` - Error details
  - `current_step?: number` - Current workflow step (1-3)
  - `steps_completed?: string[]` - Completed step names
  - `job_position?: string` - Job title (user editable)
  - `target_company?: string` - Company name (user editable)
  - `audio_filename?: string` - Original filename

#### Scenario: Status type safety

- **WHEN** TypeScript code uses ReviewStatus
- **THEN** the system provides enum or union type: 'pending' | 'transcribing' | 'analyzing' | 'completed' | 'failed'
- **AND** prevents assignment of invalid status strings at compile time

### Requirement: Responsive Design and UX Polish

The system SHALL implement responsive layouts, loading states, error handling, and accessibility features following project UI conventions.

#### Scenario: Mobile-responsive list view

- **WHEN** user accesses list page on mobile device (width < 640px)
- **THEN** the system switches from table to card layout
- **AND** stacks information vertically within cards
- **AND** maintains touch-friendly button sizes (min 44x44px)

#### Scenario: Loading states

- **WHEN** API calls are in progress
- **THEN** the system displays loading spinners or skeleton screens
- **AND** disables action buttons to prevent duplicate requests
- **WHEN** long-running operations (ASR polling, analysis) are active
- **THEN** the system shows progress indicators with percentage or status text

#### Scenario: Error handling and user feedback

- **WHEN** API calls fail with network errors
- **THEN** the system displays error toast with actionable message
- **AND** logs error details to console for debugging
- **WHEN** user actions succeed (create, update, analyze)
- **THEN** the system displays success toast with confirmation message

#### Scenario: Accessibility compliance

- **WHEN** page renders with interactive elements
- **THEN** the system includes proper ARIA labels, roles, and keyboard navigation
- **AND** status badges have sufficient color contrast (WCAG AA)
- **AND** form inputs have associated labels
- **AND** buttons have descriptive text or aria-label attributes
