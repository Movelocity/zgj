## ADDED Requirements

### Requirement: Resume Metadata Storage
The system SHALL store resume editing state metadata in the `metadata` JSONB field of the `resume_records` table to enable state persistence across user sessions.

#### Scenario: Save current task type
- **WHEN** user saves resume with `currentTarget` set to "jd"
- **THEN** metadata is persisted as `{"currentTarget": "jd"}` in the database

#### Scenario: Load persisted task type
- **WHEN** user reopens a resume with metadata `{"currentTarget": "jd"}`
- **THEN** the frontend restores `appTypeRef.current` to "jd"

#### Scenario: Handle missing metadata gracefully
- **WHEN** user loads an old resume without metadata field
- **THEN** the system defaults `currentTarget` to "normal" without errors

### Requirement: Metadata API Support
The resume API SHALL accept and return metadata in get/update/create operations.

#### Scenario: Get resume with metadata
- **WHEN** client calls `GET /api/user/resumes/:id`
- **THEN** response includes `metadata` field in JSON (e.g., `{"currentTarget": "jd"}`)

#### Scenario: Update resume with metadata
- **WHEN** client calls `PUT /api/user/resumes/:id` with request body containing `metadata: {"currentTarget": "new-resume"}`
- **THEN** the system persists the metadata to the database

#### Scenario: Create text resume with initial metadata
- **WHEN** client calls `POST /api/user/resumes/create_text` with optional `metadata` field
- **THEN** the system stores the provided metadata or null if omitted

### Requirement: Metadata Format Extensibility
The metadata structure SHALL be extensible to support future state tracking fields without schema changes.

#### Scenario: Add new metadata field
- **WHEN** a new field like `modificationCount` is added to metadata
- **THEN** existing code handles it without breaking (JSONB flexibility)

#### Scenario: Partial metadata updates
- **WHEN** client updates only `currentTarget` in metadata
- **THEN** other metadata fields (if present) are preserved or merged

### Requirement: Frontend State Synchronization
The frontend editor SHALL synchronize `appTypeRef` state with the metadata field on save and load operations.

#### Scenario: Save state to metadata
- **WHEN** user clicks "Save" button in `ResumeDetails.tsx`
- **THEN** the current value of `appTypeRef.current` is included in the update request as `metadata.currentTarget`

#### Scenario: Restore state from metadata
- **WHEN** user navigates to resume editor and resume data is loaded
- **THEN** `appTypeRef.current` is set to `metadata.currentTarget` (or "normal" if undefined)

#### Scenario: State changes during editing
- **WHEN** user changes task context (e.g., from "normal" to "jd" mode)
- **THEN** next save operation captures the updated `appTypeRef.current` value

