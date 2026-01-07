## 1. Type Definition Updates
- [x] 1.1 Update `TargetType` in `TargetSelector.tsx` to remove 'new-resume'
- [x] 1.2 Add `isNewResume?: boolean` to `ResumeMetadata` interface in `web/src/types/resume.ts`
- [x] 1.3 Update `currentTarget` type in `ResumeMetadata` to exclude 'new-resume'

## 2. UI Component Updates
- [x] 2.1 Remove "新简历分析" option from `targetOptions` array in `TargetSelector.tsx`
- [x] 2.2 Update `ChatPanel` `getChatConfig` to remove 'new-resume' case
- [x] 2.3 Update `ChatPanel` prop type to remove 'new-resume' from `currentTarget` union

## 3. Business Logic Refactoring
- [x] 3.1 Update `loadResumeDetail` in `ResumeDetails.tsx` to check `metadata?.isNewResume` instead of only hash
- [x] 3.2 When hash is `#new_resume` and `metadata.isNewResume` is undefined, set it to true and run analysis
- [x] 3.3 When hash is `#new_resume` and `metadata.isNewResume` is defined (true or false), skip analysis
- [x] 3.4 After analysis completes for new resume, update metadata to set `isNewResume: false`
- [x] 3.5 Remove `currentTargetRef.current = "new-resume"` assignments from executeStep3_AnalyzeResume

## 4. Validation
- [ ] 4.1 Test new resume upload with `#new_resume` hash triggers analysis once
- [ ] 4.2 Test reopening same resume doesn't trigger analysis again
- [ ] 4.3 Test backward compatibility: old resumes without `isNewResume` field work correctly
- [ ] 4.4 Test target selector doesn't show "新简历分析" option
- [ ] 4.5 Test switching between 'jd', 'normal', 'foreign' targets still works

