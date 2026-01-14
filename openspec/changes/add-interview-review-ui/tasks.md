# Tasks: Interview Review Frontend UI Implementation

## 1. Setup and Type Definitions

- [x] 1.1 Create `/web/src/types/interview.ts` with TypeScript interfaces
  - [x] Define `InterviewReview` interface matching backend model
  - [x] Define `InterviewReviewMetadata` interface with all metadata fields
  - [x] Define `InterviewReviewListResponse` for paginated list
  - [x] Define `ReviewStatus` type union
  - [x] Define `CreateReviewRequest` and `TriggerAnalysisRequest` types
  - [x] Export status constants (PENDING, TRANSCRIBING, ANALYZING, COMPLETED, FAILED)

- [x] 1.2 Create `/web/src/api/interview.ts` API client
  - [x] Import apiClient and types
  - [x] Implement `createReview(data)` - POST /api/interview/reviews
  - [x] Implement `getReview(id)` - GET /api/interview/reviews/:id
  - [x] Implement `listReviews(params)` - GET /api/interview/reviews with pagination
  - [x] Implement `triggerAnalysis(id)` - POST /api/interview/reviews/:id/analyze
  - [x] Add JSDoc comments for each method
  - [x] Export as `interviewAPI` object

## 2. Reusable Components

- [x] 2.1 Create `/web/src/components/interview/StepIndicator.tsx`
  - [x] Define props interface: steps array, currentStep number, completedSteps array, onStepClick callback
  - [x] Render horizontal timeline with circles and connecting lines
  - [x] Apply color states: gray (pending), blue (active), green (completed)
  - [x] Add checkmark icon for completed steps, number for pending/active
  - [x] Implement click handler for backward navigation
  - [x] Add responsive styling for mobile (vertical stack if needed)
  - [x] Write TypeScript types for Step interface

- [x] 2.2 Create `/web/src/components/interview/ReviewStatusBadge.tsx`
  - [x] Define props: status (ReviewStatus), size (sm/md/lg)
  - [x] Create status config map with labels and colors
  - [x] Render badge with color-coded background (blue/yellow/green/red/gray)
  - [x] Add icons for each status (FiClock, FiRefreshCw, FiCheck, FiX)
  - [x] Ensure WCAG AA color contrast

- [x] 2.3 Create `/web/src/components/interview/ASRResultViewer.tsx`
  - [x] Define props: asrResult (object), defaultCollapsed (boolean)
  - [x] Use `useState` for expand/collapse state
  - [x] Render JSON with syntax highlighting (react-json-view or custom)
  - [x] Add "展开/收起" toggle button
  - [x] Limit initial display to 50 lines with "显示更多" button
  - [x] Handle empty/null result gracefully

- [x] 2.4 Create `/web/src/components/interview/AnalysisMarkdownRenderer.tsx`
  - [x] Import existing `@/components/ui/Markdown` component
  - [x] Define props: content (string | object), loading (boolean)
  - [x] Detect content type (Markdown string vs JSON object vs plain text)
  - [x] Render Markdown if string, pretty-print JSON if object, display text in `<pre>` if plain
  - [x] Add loading skeleton while analysis in progress
  - [x] Style with consistent typography (matching resume editor)

## 3. Custom Hooks

- [x] 3.1 Create `/web/src/pages/interview/hooks/useInterviewWorkflow.ts`
  - [x] Define state: currentStep, audioFile, audioUrl, asrTaskId, asrResult, reviewId
  - [x] Implement `goToStep(step)` function with validation
  - [x] Implement `handleUploadComplete(url, filename)` to store audio URL
  - [x] Implement `handleAsrComplete(taskId, result)` to store ASR data
  - [x] Implement `handleReviewCreated(id)` to update reviewId and URL
  - [x] Implement `canGoBack(step)` validation (can't go back after review created)
  - [x] Return state and handler functions

- [x] 3.2 Create `/web/src/pages/interview/hooks/useReviewPolling.ts`
  - [x] Define props: reviewId, enabled boolean
  - [x] Use `useEffect` to start polling when enabled and reviewId exists
  - [x] Poll `getReview(id)` every 3 seconds
  - [x] Stop polling when status is 'completed' or 'failed'
  - [x] Return current review data and polling status
  - [x] Clean up interval on unmount

## 4. Interview Review List Page

- [x] 4.1 Create `/web/src/pages/interview/InterviewReviewList.tsx`
  - [x] Import necessary components (Button, ReviewStatusBadge)
  - [x] Use `useState` for reviews, loading, pagination (page, pageSize, total)
  - [x] Implement `loadReviews(page)` function calling `interviewAPI.listReviews()`
  - [x] Use `useEffect` to load on mount and page change
  - [x] Render page header with title "面试复盘" and "新建" button
  - [x] Render empty state when no reviews exist
  - [x] Render loading skeleton while fetching

- [x] 4.2 Implement table/card layout in list page
  - [x] Create responsive table: desktop shows table, mobile shows cards
  - [x] Table columns: 创建时间, 状态, 岗位, 目标公司, 操作
  - [x] Format timestamps with `toLocaleString()` or date utility
  - [x] Render `ReviewStatusBadge` for status column
  - [x] Add click handler to navigate to detail page with `?id=xxx`
  - [x] Show placeholder text for empty job_position/target_company

- [x] 4.3 Add inline editing for job position and company
  - [x] Add edit icon (FiEdit) next to job position and company fields
  - [x] On click, show inline input field or modal dialog
  - [x] Implement save handler updating metadata via backend API
  - [x] Show success toast on save
  - [x] Refresh list or update local state after save
  - [x] Handle validation (max length 50 characters)

- [x] 4.4 Implement pagination controls
  - [x] Render pagination component at bottom (reuse existing or create new)
  - [x] Show page numbers, previous/next buttons
  - [x] Update page state on click
  - [x] Disable buttons at boundaries (first/last page)
  - [x] Display total count: "共 X 条记录"

## 5. Interview Review Detail Page - Structure

- [x] 5.1 Create `/web/src/pages/interview/InterviewReviewDetail.tsx`
  - [x] Import hooks, components, API client
  - [x] Use `useSearchParams` to read `id` query parameter
  - [x] Use `useState` for review data, loading, mode (creation vs view)
  - [x] Determine mode: if `id` exists, view mode; else creation mode
  - [x] Use `useEffect` to fetch review data when `id` present
  - [x] Use `useInterviewWorkflow` hook for creation mode state

- [x] 5.2 Implement mode switching logic
  - [x] If no `id` parameter: Render creation mode with StepIndicator
  - [x] If `id` parameter: Render view mode loading review data
  - [x] Handle loading state with skeleton
  - [x] Handle error state (review not found, unauthorized)

## 6. Creation Mode Implementation

- [x] 6.1 Implement Step 1: Audio Upload
  - [x] Render file input (drag-drop or button)
  - [x] Accept audio formats: .mp3, .wav, .ogg (max 100MB)
  - [x] Validate file type and size with toast warnings
  - [x] On file select, call `tosAPI.uploadToTOS(file)`
  - [x] Show upload progress bar during upload
  - [x] On success, generate download URL via `tosAPI.generateDownloadURL(key)`
  - [x] Store audio URL and filename in workflow state
  - [x] Enable "下一步" button after upload completes
  - [x] Disable "上一步" button on step 1

- [x] 6.2 Implement Step 2: ASR Processing
  - [x] On entering step 2, auto-submit ASR task via `asrAPI.submitTask()`
  - [x] Pass audio URL and format from step 1
  - [x] Store ASR task ID in workflow state
  - [x] Start polling with `asrAPI.pollUntilComplete(taskId, onProgress)`
  - [x] Display progress indicator showing percentage and status
  - [x] On completion, parse result with `asrAPI.parseResult(task)`
  - [x] Store ASR result in workflow state
  - [x] Enable "下一步" button after completion
  - [x] Enable "上一步" button to return to step 1 (preserves uploaded file)

- [x] 6.3 Handle ASR failure in Step 2
  - [x] If ASR task fails, display error message from `task.error_message`
  - [x] Show "重试" button to resubmit ASR task
  - [x] On retry, clear error state and resubmit with same audio URL
  - [x] Allow "上一步" to go back and re-upload different file

- [x] 6.4 Implement Step 3: Create Review and Trigger Analysis
  - [x] On entering step 3, call `interviewAPI.createReview({ main_audio_id, asr_result })`
  - [x] Include metadata fields: audio_filename, current_step, steps_completed
  - [x] On success, extract review ID from response
  - [x] Update URL to `/interview/reviews?id={reviewId}` using `navigate(..., { replace: true })`
  - [x] Store review ID in state
  - [x] Immediately call `interviewAPI.triggerAnalysis(reviewId)`
  - [x] Display "分析中..." status with spinner
  - [x] Disable "上一步" button (cannot go back after review created)
  - [x] Start polling analysis status via `useReviewPolling` hook

- [x] 6.5 Implement backward navigation
  - [x] Add "上一步" button on steps 2 and 3 (disabled on step 1 and after review created)
  - [x] On click, decrement currentStep in workflow state
  - [x] Preserve completed data (audio URL, ASR result) when going back
  - [x] Show confirmation dialog if going back would lose in-progress work (optional)

## 7. View Mode Implementation

- [x] 7.1 Load and display review data
  - [x] On mount with `id` parameter, call `interviewAPI.getReview(id)`
  - [x] Store review data in state
  - [x] Display review metadata: creation time, job position, company
  - [x] Render `ReviewStatusBadge` with current status

- [x] 7.2 Display completed analysis
  - [x] Check if `metadata.status === 'completed'`
  - [x] Render `AnalysisMarkdownRenderer` with `data` field
  - [x] Show section headers (评分, 优点, 改进建议, 总结) if structured
  - [x] Add "重新分析" button at bottom

- [x] 7.3 Display in-progress analysis
  - [x] Check if `metadata.status === 'transcribing' | 'analyzing'`
  - [x] Show progress indicator with status text
  - [x] Use `useReviewPolling` hook to poll for updates every 3 seconds
  - [x] Update UI when status changes to 'completed' or 'failed'
  - [x] Stop polling when terminal state reached

- [x] 7.4 Display failed analysis
  - [x] Check if `metadata.status === 'failed'`
  - [x] Show error badge and error message from `metadata.error_message`
  - [x] Display "重新分析" button
  - [x] Show troubleshooting tips (check site_variables, check Dify API)

- [x] 7.5 Display ASR transcription result
  - [x] Render "语音识别结果" section with `ASRResultViewer`
  - [x] Pass `metadata.asr_result` as prop
  - [x] Default to collapsed state
  - [x] Allow user to expand and inspect JSON structure

- [x] 7.6 Implement retry analysis
  - [x] Add "重新分析" button in view mode
  - [x] On click, validate `metadata.status` is not 'transcribing' or 'analyzing'
  - [x] If in progress, show toast: "任务进行中，无法重试"
  - [x] If completed or failed, call `interviewAPI.triggerAnalysis(id)`
  - [x] Update status to 'analyzing' and start polling
  - [x] Disable button while analysis in progress

- [x] 7.7 Implement inline editing in detail view
  - [x] Display job position and company with edit icons
  - [x] On click, show inline input fields
  - [x] On save, update metadata fields via API (same as list page)
  - [x] Show success toast and update local state

## 8. Navigation Integration

- [x] 8.1 Add route to router configuration
  - [x] Open `/web/src/router/index.tsx`
  - [x] Add lazy import: `const InterviewReviewList = lazy(() => import('@/pages/interview/InterviewReviewList'))`
  - [x] Add lazy import: `const InterviewReviewDetail = lazy(() => import('@/pages/interview/InterviewReviewDetail'))`
  - [x] Add route objects to routes array:
    ```typescript
    {
      path: '/interview/reviews',
      element: <InterviewReviewDetail />, // Handles both list and detail based on query param
    }
    ```
  - [x] Add route to `protectedRoutes` array (requires authentication)

- [x] 8.2 Update navigation header
  - [x] Open `/web/src/components/layout/Header2.tsx`
  - [x] Add new nav item to `NAV_ITEMS` array:
    ```typescript
    {
      path: '/interview/reviews',
      label: '面试复盘',
    }
    ```
  - [x] Position after "我的简历" (index 3)
  - [x] Test active state highlighting

## 9. Error Handling and UX Polish

- [x] 9.1 Implement comprehensive error handling
  - [x] Wrap all API calls in try-catch blocks
  - [x] Display error toasts using `showError()` for network failures
  - [x] Handle 401 unauthorized (redirect to login)
  - [x] Handle 403 forbidden (show access denied message)
  - [x] Handle 404 not found (show "记录不存在" message)
  - [x] Log errors to console with context for debugging

- [x] 9.2 Add loading states
  - [x] Show skeleton screens while loading list
  - [x] Show spinner in buttons during API calls (uploading, creating, analyzing)
  - [x] Disable form inputs during submission
  - [x] Display progress bars for long operations (upload, ASR)

- [x] 9.3 Add success feedback
  - [x] Show success toast after creating review: "面试复盘创建成功"
  - [x] Show success toast after triggering analysis: "分析任务已提交"
  - [x] Show success toast after updating metadata: "保存成功"
  - [x] Use `showSuccess()` from `@/utils/toast`

- [x] 9.4 Implement responsive design
  - [x] Test list page on mobile (< 640px): switch to card layout
  - [x] Test detail page on mobile: stack elements vertically
  - [x] Ensure StepIndicator is readable on small screens
  - [x] Test touch interactions on buttons (min 44x44px)
  - [x] Use Tailwind responsive classes (sm:, md:, lg:)

- [x] 9.5 Add accessibility features
  - [x] Add ARIA labels to buttons: `aria-label="上传音频文件"`
  - [x] Ensure form inputs have associated `<label>` elements
  - [x] Add `role="status"` to progress indicators
  - [x] Test keyboard navigation (Tab, Enter, Escape)
  - [x] Verify color contrast with browser dev tools (WCAG AA)

## 10. Testing and Validation

- [x] 10.1 Manual testing - Creation workflow
  - [x] Test full workflow: upload → ASR → analysis → completion
  - [x] Test backward navigation (step 3 → 2 → 1)
  - [x] Test file validation (wrong format, size > 100MB)
  - [x] Test ASR failure and retry
  - [x] Test analysis failure and retry
  - [x] Verify URL updates correctly after review creation
  - [x] Test page refresh during creation (expect loss of progress)

- [x] 10.2 Manual testing - View mode
  - [x] Test loading existing review with completed status
  - [x] Test loading review with in-progress status (verify polling)
  - [x] Test loading review with failed status
  - [x] Test retry analysis on completed review
  - [x] Test retry analysis on failed review
  - [x] Verify polling stops when terminal state reached
  - [x] Test inline editing of job position and company

- [x] 10.3 Manual testing - List page
  - [x] Test empty state (new user with no reviews)
  - [x] Test list with multiple reviews (pagination)
  - [x] Test status badges render correctly for all statuses
  - [x] Test navigation to detail page from list
  - [x] Test inline editing in list view
  - [x] Test mobile responsive layout

- [x] 10.4 Manual testing - Error scenarios
  - [x] Test network failure during upload
  - [x] Test network failure during ASR submission
  - [x] Test network failure during analysis trigger
  - [x] Test unauthorized access (no JWT token)
  - [x] Test accessing non-existent review ID
  - [x] Test accessing another user's review (403)

- [x] 10.5 Cross-browser testing
  - [x] Test on Chrome (latest)
  - [x] Test on Firefox (latest)
  - [x] Test on Safari (macOS/iOS)
  - [x] Test on Edge (latest)

- [x] 10.6 Validate with openspec
  - [x] Run `openspec validate add-interview-review-ui --strict`
  - [x] Fix any validation errors
  - [x] Ensure all requirements have scenarios
  - [x] Ensure all scenarios follow format

## 11. Documentation and Cleanup

- [x] 11.1 Add inline code comments
  - [x] Document complex logic in hooks
  - [x] Add JSDoc comments to exported functions
  - [x] Explain non-obvious state management decisions

- [x] 11.2 Update project documentation (optional)
  - [x] Add section to `/web/FRONTEND_API_DOC.md` about interview API
  - [x] Add user guide for interview review feature (if needed)

- [x] 11.3 Code review checklist
  - [x] Verify no `any` types used (strict TypeScript)
  - [x] Verify all imports use `@/` alias
  - [x] Verify error handling in all async functions
  - [x] Verify consistent naming conventions
  - [x] Verify no console.log statements (use proper logging)

- [x] 11.4 Performance optimization (if needed)
  - [x] Check bundle size impact (< 50KB added)
  - [x] Optimize re-renders with React.memo if needed
  - [x] Consider lazy loading ASRResultViewer if large JSON slows UI

## Completion Checklist

Before marking this change as complete:
- [x] All tasks above are checked off
- [x] `openspec validate add-interview-review-ui --strict` passes
- [x] Manual testing completed for all scenarios
- [x] No linter errors in modified files
- [x] Code review completed (self-review or peer review)
- [x] Feature deployed to staging/production
- [x] User acceptance testing passed
