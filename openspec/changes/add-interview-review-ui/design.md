# Design: Interview Review Frontend UI

## Context

This change implements the frontend interface for the interview review feature, building on the completed backend API (`add-interview-review-table`). The design must accommodate a multi-step workflow where users can navigate backward, persist intermediate progress, and recover from failures.

**Key Challenges:**
- State management across 3-step workflow with backward navigation
- URL-based mode switching (creation vs. view mode)
- Progress persistence to backend metadata
- Real-time status polling (ASR and Dify analysis)
- Graceful error recovery and retry mechanisms

**Stakeholders:**
- End users: Job seekers practicing interview skills
- Frontend developers: Implementing guided workflow UI
- Backend: Existing interview review API (no changes needed)

## Goals / Non-Goals

### Goals
- ✅ Guided 3-step workflow with clear progress indication
- ✅ Backward navigation preserving completed steps
- ✅ URL state synchronization (query param based)
- ✅ Progress persistence to backend metadata
- ✅ Real-time polling for ASR and analysis status
- ✅ Inline editing of job position and company
- ✅ Comprehensive error handling with retry options
- ✅ Mobile-responsive design

### Non-Goals
- ❌ Multi-file audio upload (single file only)
- ❌ Real-time audio playback/visualization
- ❌ Batch operations (delete multiple, bulk retry)
- ❌ Export analysis results to PDF/Word (future enhancement)
- ❌ Custom Dify workflow selection (uses site_variables config)
- ❌ ASR result editing (read-only display)

## Decisions

### Decision 1: Query Parameter for ID Instead of Path Parameter

**Choice:** Use `/interview/reviews?id=xxx` instead of `/interview/reviews/:id`

**Rationale:**
- Single route definition simplifies logic for mode detection
- URL can be updated without navigation when transitioning from creation → view mode
- Cleaner UX: creation mode has clean URL `/interview/reviews`, then ID appends seamlessly

**Alternatives Considered:**
- Path parameter (`/interview/reviews/:id`): Requires navigation/redirect after review creation, causes page reload
- Separate routes (`/interview/reviews/new` and `/interview/reviews/:id`): More routes to maintain, harder to share creation→view transition logic

### Decision 2: Local State + Backend Metadata for Progress Tracking

**Choice:** Maintain workflow state in component useState, persist critical progress to backend metadata

**Rationale:**
- Local state provides instant UI updates without API latency
- Backend metadata acts as source of truth for page reloads and cross-session recovery
- Hybrid approach balances performance and reliability

**State Storage Strategy:**
```typescript
// Local state (component)
- audioFile: File | null
- audioUrl: string
- asrTaskId: string
- asrResult: object
- currentStep: 1 | 2 | 3
- reviewId: number | null

// Backend metadata (persisted)
{
  "current_step": 3,
  "steps_completed": ["upload", "asr", "analyze"],
  "audio_filename": "interview.mp3",
  "job_position": "前端工程师",
  "target_company": "字节跳动"
}
```

**Alternatives Considered:**
- Zustand global store: Overkill for single-page workflow state
- Backend-only state: Requires API call for every step transition (slow UX)

### Decision 3: Step Indicator as Custom Component (Not Library)

**Choice:** Build custom `StepIndicator` component instead of using Ant Design Steps or similar

**Rationale:**
- Project uses minimal UI library philosophy (custom Button, Modal components)
- Custom component allows full styling control with Tailwind
- Avoids adding new dependency for single component
- Simple horizontal stepper doesn't justify library overhead

**Implementation:**
```tsx
<StepIndicator
  steps={[
    { label: '上传音频', key: 'upload' },
    { label: '语音识别', key: 'asr' },
    { label: 'AI分析', key: 'analyze' }
  ]}
  currentStep={currentStep}
  completedSteps={completedSteps}
  onStepClick={(step) => handleStepBack(step)}
/>
```

**Alternatives Considered:**
- Ant Design Steps: Adds ~500KB dependency, project avoids Ant Design
- Headless UI: Good library but still external dependency

### Decision 4: Markdown Rendering for Analysis Results

**Choice:** Reuse existing `@/components/ui/Markdown` component

**Rationale:**
- Project already uses react-markdown (v10.1) for resume content
- Analysis results from Dify are likely Markdown formatted
- Consistent rendering style across application

**Fallback Strategy:**
- If `data` field is plain text: Display in `<pre>` tag
- If `data` field is JSON object: Pretty-print with syntax highlighting
- If `data` field is Markdown string: Render with Markdown component

### Decision 5: Polling Strategy with Exponential Backoff

**Choice:** Use `asrAPI.pollUntilComplete()` utility with 3-second intervals, max 60 attempts

**Rationale:**
- ASR tasks typically complete in 30-180 seconds
- 3-second interval balances responsiveness and server load
- 60 attempts × 3s = 3 minutes timeout (reasonable for user workflow)
- Existing ASR API already provides this utility

**Polling Implementation:**
```typescript
const task = await asrAPI.pollUntilComplete(
  taskId,
  (progressTask) => {
    setCurrentTask(progressTask);
    // Update UI with progress percentage
  },
  60,    // maxAttempts
  3000   // intervalMs
);
```

**Alternatives Considered:**
- WebSocket: Backend doesn't support WebSocket, requires significant infrastructure
- Server-Sent Events (SSE): Backend would need new endpoints
- Fixed 1-second polling: Higher server load, marginal UX improvement

### Decision 6: URL Update Without Navigation

**Choice:** Use `window.history.replaceState()` or `navigate(..., { replace: true })` to update URL with review ID

**Rationale:**
- Preserves component state during creation → view transition
- Avoids full page reload and re-mounting
- User can refresh page and return to same review state

**Implementation:**
```typescript
// After review created in step 3
const reviewId = response.data.id;
navigate(`/interview/reviews?id=${reviewId}`, { replace: true });
setReviewId(reviewId);
// Continue to trigger analysis without remounting
```

## Technical Patterns

### File Structure
```
web/src/
├── pages/interview/
│   ├── InterviewReviewList.tsx        # List page component
│   ├── InterviewReviewDetail.tsx      # Detail page with workflow
│   └── hooks/
│       ├── useInterviewWorkflow.ts    # Workflow state management hook
│       └── useReviewPolling.ts        # Polling logic hook
├── components/interview/
│   ├── StepIndicator.tsx              # Horizontal stepper
│   ├── ASRResultViewer.tsx            # JSON viewer with expand/collapse
│   ├── AnalysisMarkdownRenderer.tsx   # Markdown wrapper
│   └── ReviewStatusBadge.tsx          # Status badge with colors
├── api/
│   └── interview.ts                   # API client
└── types/
    └── interview.ts                   # TypeScript types
```

### Custom Hooks for Reusability

**useInterviewWorkflow Hook:**
Manages creation workflow state and transitions
```typescript
const useInterviewWorkflow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [asrTaskId, setAsrTaskId] = useState('');
  const [asrResult, setAsrResult] = useState(null);
  const [reviewId, setReviewId] = useState<number | null>(null);

  const goToStep = (step: number) => { /* ... */ };
  const handleUploadComplete = (url: string) => { /* ... */ };
  const handleAsrComplete = (result: any) => { /* ... */ };
  const handleReviewCreated = (id: number) => { /* ... */ };

  return { currentStep, goToStep, ... };
};
```

**useReviewPolling Hook:**
Handles polling logic for ASR and analysis status
```typescript
const useReviewPolling = (reviewId: number | null) => {
  const [polling, setPolling] = useState(false);
  const [status, setStatus] = useState<ReviewStatus>('pending');

  useEffect(() => {
    if (!reviewId || status === 'completed' || status === 'failed') return;
    
    const intervalId = setInterval(async () => {
      const review = await interviewAPI.getReview(reviewId);
      setStatus(review.metadata.status);
      if (review.metadata.status === 'completed' || review.metadata.status === 'failed') {
        clearInterval(intervalId);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [reviewId, status]);

  return { polling, status };
};
```

### Component Composition

**InterviewReviewDetail Page Structure:**
```tsx
<InterviewReviewDetail>
  {!reviewId ? (
    // Creation Mode
    <>
      <StepIndicator currentStep={currentStep} />
      {currentStep === 1 && <AudioUploadStep />}
      {currentStep === 2 && <ASRProcessingStep />}
      {currentStep === 3 && <AnalysisStep />}
    </>
  ) : (
    // View Mode
    <>
      <ReviewStatusBadge status={metadata.status} />
      {metadata.status === 'completed' && (
        <AnalysisMarkdownRenderer content={data} />
      )}
      <ASRResultViewer result={metadata.asr_result} />
      <Button onClick={handleRetry}>重新分析</Button>
    </>
  )}
</InterviewReviewDetail>
```

### Status Badge Styling
```typescript
const STATUS_CONFIG = {
  pending: { label: '待处理', color: 'gray' },
  transcribing: { label: '识别中', color: 'blue' },
  analyzing: { label: '分析中', color: 'yellow' },
  completed: { label: '已完成', color: 'green' },
  failed: { label: '失败', color: 'red' },
};
```

## Risks / Trade-offs

### Risk 1: State Synchronization Issues

**Risk:** Local component state and backend metadata could desync if user opens multiple tabs or API calls fail silently.

**Mitigation:**
- Always fetch fresh data from backend when mounting with `id` parameter
- Use `useEffect` dependencies carefully to avoid stale closures
- Display "数据已更新，请刷新页面" toast if backend returns newer `updated_at` timestamp

### Risk 2: Polling Performance Impact

**Risk:** Multiple users polling simultaneously could increase backend load.

**Mitigation:**
- Use reasonable polling interval (3 seconds, not 1 second)
- Stop polling immediately when terminal state reached
- Consider rate limiting on backend (already exists for ASR endpoints)
- Future enhancement: Replace with WebSocket if load becomes issue

### Risk 3: Large ASR Result JSON Display

**Risk:** ASR results with long audio files could be 100KB+ JSON, causing browser lag.

**Mitigation:**
- Use collapsible JSON viewer (default collapsed)
- Limit initial render to first 50 lines with "Show More" button
- Consider JSON virtualization library (react-window) if performance issues arise

### Risk 4: URL State Loss on Refresh During Creation

**Risk:** User refreshes page during creation workflow (step 1 or 2) loses all progress.

**Mitigation:**
- Display warning toast on page load if user has incomplete workflow in localStorage
- Consider storing temporary workflow state in localStorage with TTL
- Document this limitation (expected behavior: creation workflow doesn't survive refresh)

**Trade-off Accepted:** Full persistence of creation workflow would require creating review record at step 1 (before ASR completes), polluting database with incomplete records. Current approach prioritizes data quality over crash recovery.

## Migration Plan

### Phase 1: Core Implementation (Week 1)
1. Create API client and types
2. Build InterviewReviewList page (read-only)
3. Build StepIndicator and basic detail page structure
4. Implement creation workflow (steps 1-3)

### Phase 2: Polish and Integration (Week 2)
5. Add view mode with polling
6. Implement retry logic
7. Add inline editing for job position/company
8. Integrate navigation link in Header2

### Phase 3: Testing and Refinement (Week 3)
9. Manual testing of all workflows
10. Error handling edge cases
11. Mobile responsive testing
12. Accessibility audit

### Rollback Strategy
- Feature is additive (new routes, no modifications to existing code)
- If critical issues found, remove navigation link and disable routes
- No database migrations required (uses existing backend API)

## Open Questions

1. **Analysis Result Format:** What is the expected structure of `data` field from Dify workflow?
   - Assumption: Markdown string with sections (评分、优点、改进建议、总结)
   - Need sample response to finalize AnalysisMarkdownRenderer

2. **Audio File Retention:** Should we store audio file key in metadata for future playback?
   - Current design: No, only ASR result stored
   - Alternative: Add `audio_key` to metadata for TOS file reference

3. **List Sorting:** Default sort order for review list?
   - Recommendation: `created_at DESC` (newest first)
   - Alternative: Add sort dropdown (by date, by status)

4. **Batch Delete:** Should users be able to delete old reviews?
   - Current design: No delete functionality
   - Recommendation: Add delete API and button in future iteration

5. **Notification on Analysis Complete:** Should we show browser notification when analysis finishes?
   - Current design: User must be on page to see completion
   - Alternative: Use Web Push API or email notification (requires backend support)
