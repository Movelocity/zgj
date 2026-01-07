# Change: Refactor New Resume State from Target Type to Metadata Boolean

## Why
Currently, "new-resume" is treated as a target type alongside "jd", "normal", and "foreign", but it's fundamentally different: it represents a one-time initialization state rather than an ongoing task mode. This creates confusion in the UI and code, as users can select "new-resume" as a target but it should only trigger once when a resume is first uploaded.

## What Changes
- Remove 'new-resume' from `TargetType` union (frontend type)
- Add `isNewResume?: boolean` field to `ResumeMetadata` interface
- Update hash reading logic to check `metadata.isNewResume` before running analysis
- Set `metadata.isNewResume = false` after initial analysis completes
- Remove "新简历分析" option from `TargetSelector` UI component
- Update `ChatPanel` to remove 'new-resume' case from config logic
- Preserve backward compatibility: undefined `isNewResume` triggers the flow once

## Impact
- Affected specs: resume-editor (new capability spec)
- Affected code:
  - `web/src/pages/editor/components/TargetSelector.tsx` (remove option)
  - `web/src/pages/editor/ResumeDetails.tsx` (update hash logic)
  - `web/src/pages/editor/components/ChatPanel.tsx` (remove case)
  - `web/src/types/resume.ts` (update types)
- Breaking: No breaking changes - backward compatible with existing resumes

