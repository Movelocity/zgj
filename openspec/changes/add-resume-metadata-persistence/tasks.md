## 1. Backend API Definition
- [x] 1.1 Add `Metadata` field to `ResumeDetailInfo` and `UpdateResumeRequest` in `server/service/resume/types.go`
- [x] 1.2 Update `GetResumeByID` handler in `server/api/resume/resume.go` to include metadata in response
- [x] 1.3 Update `UpdateResume` handler in `server/api/resume/resume.go` to accept and save metadata
- [x] 1.4 Update `CreateTextResume` handler to accept initial metadata (optional)
- [x] 1.5 Update resume service methods to handle metadata field

## 2. Frontend Type Definitions
- [x] 2.1 Add `metadata` field to `ResumeDetail` interface in `web/src/types/resume.ts`
- [x] 2.2 Add `metadata` field to `ResumeUpdateRequest` interface
- [x] 2.3 Define `ResumeMetadata` TypeScript type with `currentTarget` field

## 3. Frontend State Management
- [x] 3.1 Extract `appTypeRef.current` to metadata when saving resume
- [x] 3.2 Restore `appTypeRef.current` from metadata when loading resume
- [x] 3.3 Initialize metadata with default value if not present
- [x] 3.4 Add metadata to `handleSaveResume` call in `ResumeDetails.tsx`

## 4. Validation
- [x] 4.1 Test saving resume with metadata and verify database persistence
- [x] 4.2 Test loading resume and verify appTypeRef restoration
- [x] 4.3 Test backward compatibility: old resumes without metadata load correctly
- [x] 4.4 Test metadata format extensibility for future fields

