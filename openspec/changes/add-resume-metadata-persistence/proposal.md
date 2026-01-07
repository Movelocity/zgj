# Change: Add Resume Metadata Persistence

## Why
The backend has added a `metadata` JSONB field to the `ResumeRecord` model for storing page state information (e.g., current task type, modification frequency, archived tasks). The frontend currently uses `appTypeRef` to track the current editing target type (`jd`, `new-resume`, `normal`) but this state is lost on page reload. We need to persist this state to the database so users can resume their work context seamlessly across sessions.

## What Changes
- Add `metadata` field to backend API request/response types for resume operations
- Update resume update/create/get API endpoints to handle metadata persistence
- Frontend extracts `appTypeRef` state to metadata on save as `{currentTarget: "jd"|"new-resume"|"normal"}`
- Frontend restores `appTypeRef` from metadata on resume load
- Design metadata structure to be extensible for future state tracking (e.g., modification counts, archived tasks)

## Impact
- Affected specs: `resume-management` (new capability, no existing spec found)
- Affected code:
  - Backend: `server/model/resume.go`, `server/service/resume/types.go`, `server/service/resume/resume_service.go`, `server/api/resume/resume.go`
  - Frontend: `web/src/pages/editor/ResumeDetails.tsx`, `web/src/api/resume.ts`, `web/src/types/resume.ts`
- **Non-breaking**: Metadata is optional, existing API calls work without it

