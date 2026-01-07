## ADDED Requirements

### Requirement: New Resume Initialization State Tracking
The system SHALL track whether a resume has completed its initial analysis using a boolean metadata field rather than treating it as a target type.

#### Scenario: First-time resume analysis trigger
- **WHEN** user uploads a new resume with hash `#new_resume` and `metadata.isNewResume` is undefined
- **THEN** system sets `metadata.isNewResume = true` and runs initial analysis workflow

#### Scenario: Skip analysis for already-initialized resume
- **WHEN** user reopens a resume with hash `#new_resume` and `metadata.isNewResume` is already defined (true or false)
- **THEN** system skips the analysis workflow

#### Scenario: Mark initialization complete
- **WHEN** initial analysis workflow completes successfully
- **THEN** system updates `metadata.isNewResume = false` to prevent re-analysis

#### Scenario: Backward compatibility with undefined state
- **WHEN** user loads an old resume without `isNewResume` field and hash is `#new_resume`
- **THEN** system treats it as new resume and runs analysis once

### Requirement: Target Type Exclusivity
The system SHALL only allow 'jd', 'normal', and 'foreign' as selectable target types in the UI.

#### Scenario: Target selector options
- **WHEN** user views the target selector in resume editor
- **THEN** only three options are shown: "常规优化", "职位匹配", "英文简历"

#### Scenario: No new-resume in target type
- **WHEN** system defines or validates TargetType
- **THEN** 'new-resume' is not included in the union type

#### Scenario: Chat panel config without new-resume
- **WHEN** ChatPanel renders with current target
- **THEN** getChatConfig only handles 'jd', 'normal', 'foreign' cases

## MODIFIED Requirements

### Requirement: Resume Metadata Structure
The resume metadata SHALL include an optional `isNewResume` boolean field to track initialization state.

**Updated from**: `add-resume-metadata-persistence` change's metadata definition

#### Scenario: Metadata includes isNewResume field
- **WHEN** resume metadata is saved or retrieved
- **THEN** the structure includes `isNewResume?: boolean` field

#### Scenario: Type safety for metadata fields
- **WHEN** TypeScript compiles metadata usage
- **THEN** `currentTarget` type is `'jd' | 'normal' | 'foreign'` (not including 'new-resume')

