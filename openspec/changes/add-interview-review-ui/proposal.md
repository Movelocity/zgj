# Change: Add Interview Review Frontend UI

## Why

With the backend API for interview review analysis complete (`add-interview-review-table`), users need a frontend interface to:
- Upload audio recordings of mock interviews
- Track ASR transcription progress through a guided workflow
- View AI-powered interview analysis results from Dify workflows
- Manage their interview review history

This change provides a complete user experience for the interview review feature, enabling users to improve their interview skills through AI-powered feedback.

## What Changes

### Frontend Pages
- **Interview Reviews List Page** (`/interview/reviews`)
  - Display all user's interview review records in a table/card view
  - Show status badges (transcribing, analyzing, timeout, failed, completed)
  - Display metadata: creation time, job position, target company (editable inline)
  - Navigation to detail page
  - "New Review" button to start workflow

- **Interview Review Detail Page** (`/interview/reviews?id=xxx`)
  - **Without ID** (New review creation mode):
    - Step indicator showing workflow progress
    - Step 1: Audio file upload to TOS
    - Step 2: ASR task submission and polling
    - Step 3: Analysis trigger
    - Allow stepping backward through the workflow
    - Record progress in metadata and persist to backend
    - On review creation, update URL with `?id=xxx` and reload
  - **With ID** (View/retry mode):
    - Load review from backend
    - Read completion stage from metadata
    - If analysis complete: Display formatted analysis results (Markdown)
    - If in progress: Show current step and poll status
    - If failed: Show error with "Retry Analysis" button
    - Display ASR transcription JSON for user inspection

### UI Components
- `InterviewReviewList` - Main list/table component with pagination
- `InterviewReviewDetail` - Detail page with step indicator
- `StepIndicator` - Reusable stepper component (horizontal progress indicator)
- `ASRResultViewer` - JSON viewer component for ASR results
- `AnalysisMarkdownRenderer` - Markdown renderer for analysis results

### Navigation
- Add "面试复盘" (Interview Review) link to top navigation bar (Header2.tsx)
- Position after existing resume-related links

### API Integration
Create `/web/src/api/interview.ts` with:
- `createReview(data)` - POST /api/interview/reviews
- `getReview(id)` - GET /api/interview/reviews/:id  
- `listReviews(params)` - GET /api/interview/reviews
- `triggerAnalysis(id)` - POST /api/interview/reviews/:id/analyze

### Type Definitions
Create `/web/src/types/interview.ts` with TypeScript interfaces matching backend model:
- `InterviewReview`
- `InterviewReviewMetadata`
- `InterviewReviewListResponse`
- Status constants

### Metadata Structure Extensions
Extend metadata JSONB field to include:
```json
{
  "main_audio_id": "asr_task_id",
  "workflow_id": "workflow_xxx",
  "status": "pending|transcribing|analyzing|completed|failed",
  "asr_result": {...},
  "error_message": "...",
  "current_step": 1,
  "steps_completed": ["upload", "asr"],
  "job_position": "前端工程师",
  "target_company": "字节跳动",
  "audio_filename": "interview_recording.mp3"
}
```

## Impact

### Affected Specs
- **New capability**: `interview-review-ui` (frontend user interface)
- **Integrates with**: `interview-review` backend (from `add-interview-review-table` change)

### Affected Code
#### New Files
- `web/src/pages/interview/InterviewReviewList.tsx` - List page
- `web/src/pages/interview/InterviewReviewDetail.tsx` - Detail page with stepper
- `web/src/components/interview/StepIndicator.tsx` - Step progress component
- `web/src/components/interview/ASRResultViewer.tsx` - JSON viewer
- `web/src/components/interview/AnalysisMarkdownRenderer.tsx` - Markdown display
- `web/src/api/interview.ts` - API client
- `web/src/types/interview.ts` - Type definitions

#### Modified Files
- `web/src/router/index.tsx` - Add interview review routes
- `web/src/components/layout/Header2.tsx` - Add navigation link

### Dependencies
- Existing TOS upload API (`@/api/tos`)
- Existing ASR API (`@/api/asr`)
- Existing Markdown component (`@/components/ui/Markdown`)
- Backend interview review API (completed in `add-interview-review-table`)

### User Flow
```mermaid
graph TD
    A[用户点击导航栏"面试复盘"] --> B[进入列表页 /interview/reviews]
    B --> C{操作选择}
    C -->|点击"新建"| D[进入详情页 无ID参数]
    C -->|点击记录| E[进入详情页 带ID参数]
    
    D --> F[步骤1: 上传音频到TOS]
    F --> G[步骤2: 提交ASR任务]
    G --> H[轮询ASR完成]
    H --> I[创建interview_review记录]
    I --> J[URL更新为 ?id=xxx]
    J --> K[步骤3: 触发Dify分析]
    K --> L[轮询分析完成]
    L --> M[显示分析结果]
    
    E --> N{检查metadata.status}
    N -->|completed| M
    N -->|analyzing| L
    N -->|failed| O[显示错误 + 重试按钮]
    O -->|点击重试| K
```

### API Endpoints Used
- `POST /api/tos/presign` - Get presigned upload URL
- `POST /api/tos/uploads/complete` - Mark upload complete
- `POST /api/asr/tasks` - Submit ASR task
- `POST /api/asr/tasks/:id/poll` - Poll ASR status
- `POST /api/interview/reviews` - Create review record
- `GET /api/interview/reviews/:id` - Get review details
- `GET /api/interview/reviews` - List reviews (paginated)
- `POST /api/interview/reviews/:id/analyze` - Trigger Dify analysis
