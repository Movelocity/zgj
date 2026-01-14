# Developer Guide: Interview Review UI

## Quick Start

### Running the Feature Locally

1. **Start the backend server:**
   ```bash
   cd /Users/hollway/projects/resume-polisher/server
   go run main.go
   ```

2. **Start the frontend dev server:**
   ```bash
   cd /Users/hollway/projects/resume-polisher/web
   pnpm dev
   ```

3. **Access the feature:**
   - Navigate to: `http://localhost:5173/interview/reviews`
   - Login required (use existing test account or create new)

### Test Data

To test the feature, you'll need:
- A test audio file (MP3, WAV, or OGG format, < 100MB)
- Configured site_variables for Dify workflow:
  - `interview_workflow_id` - Dify workflow ID
  - `interview_workflow_appid` - Dify app ID

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  InterviewReviews                       │
│                  (Route Wrapper)                        │
└──────────────────┬──────────────────┬───────────────────┘
                   │                  │
      ┌────────────▼────────┐  ┌─────▼──────────────────┐
      │ InterviewReviewList │  │ InterviewReviewDetail  │
      │                     │  │                        │
      │ - Table/Card View   │  │ Creation Mode:         │
      │ - Pagination        │  │   Step 1: Upload       │
      │ - Inline Editing    │  │   Step 2: ASR          │
      │ - Status Badges     │  │   Step 3: Analysis     │
      └──────────┬──────────┘  │                        │
                 │              │ View Mode:             │
                 │              │   - Display Results    │
                 │              │   - Polling            │
                 │              │   - Retry              │
                 │              └──────┬─────────────────┘
                 │                     │
        ┌────────▼─────────────────────▼─────────────┐
        │         Shared Components                   │
        │  - StepIndicator                           │
        │  - ReviewStatusBadge                       │
        │  - ASRResultViewer                         │
        │  - AnalysisMarkdownRenderer                │
        └────────────────────────────────────────────┘
                           │
        ┌──────────────────▼──────────────────────┐
        │         Custom Hooks                     │
        │  - useInterviewWorkflow                  │
        │  - useReviewPolling                      │
        └────────────────┬─────────────────────────┘
                         │
        ┌────────────────▼──────────────────────┐
        │         API Clients                   │
        │  - interviewAPI                       │
        │  - tosAPI                             │
        │  - asrAPI                             │
        └───────────────────────────────────────┘
```

## Component Hierarchy

### InterviewReviewList
```tsx
InterviewReviewList
├── Header (title + "New Review" button)
├── Loading Skeleton (if loading)
├── Empty State (if no reviews)
└── Content
    ├── Desktop Table
    │   └── Rows
    │       ├── ReviewStatusBadge
    │       ├── Editable Fields (job_position, target_company)
    │       └── Action Buttons
    └── Mobile Cards
        └── Card Items
            ├── ReviewStatusBadge
            └── Metadata Display
```

### InterviewReviewDetail (Creation Mode)
```tsx
InterviewReviewDetail
├── StepIndicator
└── Step Content
    ├── Step 1: Upload
    │   ├── File Input (drag-drop)
    │   ├── Validation Messages
    │   └── Progress Indicator
    ├── Step 2: ASR
    │   ├── Progress Display
    │   ├── Task Status
    │   └── Retry Button (if failed)
    └── Step 3: Analysis
        ├── Create Review Button
        └── Analysis Status
```

### InterviewReviewDetail (View Mode)
```tsx
InterviewReviewDetail
├── Header
│   ├── Title + ReviewStatusBadge
│   └── Back Button
├── Metadata Card
│   ├── Job Position (editable)
│   ├── Target Company (editable)
│   └── Audio Filename
├── Status Display
│   ├── Processing (if in progress)
│   ├── Error (if failed)
│   └── Results (if completed)
├── AnalysisMarkdownRenderer
├── ASRResultViewer
└── Retry Button
```

## State Management

### Creation Workflow State (useInterviewWorkflow)
```typescript
{
  currentStep: 1 | 2 | 3,
  audioFile: File | null,
  audioUrl: string,
  audioKey: string,
  asrTaskId: string,
  asrResult: ASRResult | null,
  reviewId: number | null,
  completedSteps: string[]
}
```

**State Transitions:**
1. Initial: `currentStep=1`, all fields empty
2. After upload: `audioFile`, `audioUrl`, `audioKey` populated, `currentStep=2`
3. After ASR: `asrTaskId`, `asrResult` populated, `currentStep=3`
4. After creation: `reviewId` populated, URL updated

### View Mode State (useReviewPolling)
```typescript
{
  review: InterviewReview | null,
  status: ReviewStatus | null,
  isPolling: boolean,
  attempts: number,
  error: Error | null
}
```

**Polling Logic:**
- Starts automatically when review ID present
- Polls every 3 seconds
- Stops on terminal state (completed, failed, timeout)
- Max 100 attempts (5 minutes)

## API Endpoints Used

### Interview Review API
```typescript
POST   /api/interview/reviews           - Create review
GET    /api/interview/reviews/:id       - Get review details
GET    /api/interview/reviews           - List reviews (paginated)
POST   /api/interview/reviews/:id/analyze - Trigger analysis
PATCH  /api/interview/reviews/:id       - Update metadata
```

### TOS API
```typescript
POST   /api/tos/presign                 - Get presigned upload URL
GET    /api/tos/presign/download        - Get download URL
POST   /api/tos/uploads/complete        - Mark upload complete
```

### ASR API
```typescript
POST   /api/asr/tasks                   - Submit ASR task
POST   /api/asr/tasks/:id/poll          - Poll task status
```

## Common Development Tasks

### Adding a New Status
1. Update `REVIEW_STATUS` in `types/interview.ts`
2. Add configuration in `ReviewStatusBadge.tsx`:
   ```typescript
   newstatus: {
     label: '新状态',
     color: 'text-purple-700',
     bgColor: 'bg-purple-100',
     icon: <FiIcon />,
   }
   ```
3. Handle in view mode rendering logic

### Adding a New Metadata Field
1. Update `InterviewReviewMetadata` interface in `types/interview.ts`
2. Add to list view display in `InterviewReviewList.tsx`
3. Add to detail view display in `InterviewReviewDetail.tsx`
4. Add inline editing if needed

### Customizing the Workflow Steps
1. Update `WORKFLOW_STEPS` in `InterviewReviewDetail.tsx`
2. Add new step rendering function (e.g., `renderStep4()`)
3. Update `useInterviewWorkflow` to handle new step
4. Update `StepIndicator` if layout changes needed

### Changing Polling Intervals
```typescript
// In useReviewPolling.ts
const {
  interval = 5000,     // Change from 3000 to 5000ms
  maxAttempts = 60,    // Reduce from 100 to 60
} = options;
```

### Adding Toast Notifications
```typescript
import { showSuccess, showError, showInfo, showWarning } from '@/utils/toast';

// Success (3s duration)
showSuccess('操作成功');

// Error (5s duration)
showError('操作失败');

// Info (3s duration)
showInfo('正在处理...');

// Warning (4s duration)
showWarning('注意事项');

// Custom duration
showSuccess('已保存', 2000); // 2 seconds
```

## Debugging Tips

### Enable API Logging
The API client includes a debug logger. In development mode, API calls are automatically logged to console.

To view detailed logs:
```javascript
// In browser console
window.__debugLogger?.getLogs()
```

### Inspect Workflow State
Add temporary logging in `useInterviewWorkflow`:
```typescript
useEffect(() => {
  console.log('Workflow state:', {
    currentStep,
    audioFile: audioFile?.name,
    asrTaskId,
    reviewId,
    completedSteps,
  });
}, [currentStep, audioFile, asrTaskId, reviewId, completedSteps]);
```

### Debug Polling
Add logging in `useReviewPolling`:
```typescript
useEffect(() => {
  console.log('Polling state:', {
    reviewId,
    status,
    isPolling,
    attempts,
  });
}, [reviewId, status, isPolling, attempts]);
```

### Test ASR Failures
To simulate ASR failure:
1. Submit task with invalid audio URL
2. Or modify backend to return error for testing

### Test Analysis Failures
To simulate analysis failure:
1. Configure invalid Dify workflow ID in site_variables
2. Or trigger analysis when Dify API is down

## Testing Checklist

### Unit Testing (Future)
- [ ] Test `useInterviewWorkflow` hook
- [ ] Test `useReviewPolling` hook
- [ ] Test API client methods
- [ ] Test component rendering

### Integration Testing
- [ ] Upload audio file
- [ ] Navigate backward in workflow
- [ ] Complete full workflow
- [ ] Inline edit metadata
- [ ] Retry failed analysis
- [ ] Pagination controls

### Edge Cases
- [ ] Upload invalid file format
- [ ] Upload file > 100MB
- [ ] Network disconnection during upload
- [ ] ASR task timeout
- [ ] Analysis task timeout
- [ ] Multiple tabs open (state sync)
- [ ] Page refresh during workflow

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast (WCAG AA)
- [ ] Focus indicators
- [ ] ARIA labels

### Responsive Design
- [ ] Mobile (< 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (> 1024px)
- [ ] Touch interactions

## Performance Optimization

### Current Optimizations
- Lazy loading of route components
- Debounced inline editing
- Collapsible ASR viewer
- Limited initial JSON display
- Efficient polling cleanup

### Potential Improvements
```typescript
// Memoize expensive computations
const sortedReviews = useMemo(() => {
  return reviews.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}, [reviews]);

// Debounce search/filter
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    // Search logic
  }, 300),
  []
);
```

## Troubleshooting

### Issue: Audio upload fails
**Check:**
- TOS credentials configured in backend
- File size < 100MB
- Valid audio format
- Network connectivity

### Issue: ASR never completes
**Check:**
- ASR service is running
- API keys configured in backend
- Audio file is valid
- Check backend logs for errors

### Issue: Analysis never completes
**Check:**
- Dify workflow configured in site_variables
- Dify API is accessible
- Workflow ID is correct
- Check backend logs for Dify API errors

### Issue: Polling doesn't stop
**Check:**
- Terminal state detection logic
- `isTerminalStatus()` function
- Component unmounting cleanup
- Max attempts reached

### Issue: Navigation broken
**Check:**
- Routes configured correctly
- Query parameters preserved
- Browser history state
- React Router version compatibility

## Code Style Guidelines

### TypeScript
- Use explicit return types for functions
- Avoid `any` type (use `unknown` if needed)
- Use type unions over enums when appropriate
- Document complex types with JSDoc

### React
- Use functional components
- Use custom hooks for complex logic
- Destructure props at function parameter
- Use `React.FC` type for components
- Keep components under 300 lines

### Naming Conventions
- Components: PascalCase (e.g., `InterviewReviewList`)
- Functions: camelCase (e.g., `loadReviews`)
- Constants: UPPER_SNAKE_CASE (e.g., `REVIEW_STATUS`)
- Types: PascalCase (e.g., `InterviewReview`)

### File Organization
```
feature/
├── ComponentName.tsx          # Main component
├── ComponentName.module.css   # CSS modules (if needed)
├── hooks/
│   └── useFeatureHook.ts
├── utils/
│   └── helperFunctions.ts
└── types.ts                   # Local types
```

## Environment Variables

None required for this feature. Configuration is pulled from backend site_variables:
- `interview_workflow_id`
- `interview_workflow_appid`

## Browser Support

### Supported Browsers
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions

### Known Issues
- File drag-drop may not work in older Safari versions
- Polling may be throttled in background tabs (browser behavior)

## Resources

### Related Documentation
- [Backend API Spec](/openspec/changes/add-interview-review-table/specs/interview-review/spec.md)
- [Design Document](./design.md)
- [Proposal Document](./proposal.md)

### External References
- [React Router Docs](https://reactrouter.com/)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)

## Support

For questions or issues:
1. Check this guide first
2. Review the design document
3. Check backend API documentation
4. Review related code in similar features (resume management)
