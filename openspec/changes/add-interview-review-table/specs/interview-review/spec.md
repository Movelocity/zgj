# Interview Review Data Persistence

## ADDED Requirements

### Requirement: Interview Review Storage

The system SHALL provide persistent storage for interview review analysis results with the following schema:

- **Primary Key**: Auto-incrementing integer ID
- **User Reference**: String user ID (foreign key to users table)
- **Analysis Data**: JSONB field (`data`) for storing complete AI analysis results from Dify workflow
- **Metadata**: JSONB field for storing workflow state and references (see Metadata Structure requirement)
- **Timestamps**: CreatedAt and UpdatedAt for audit tracking

#### Scenario: Create interview review record

- **WHEN** client creates a new interview review after ASR transcription completes
- **THEN** the system creates a record with user ID, `main_audio_id` in metadata, and initial status
- **AND** the record is assigned a unique auto-incrementing ID
- **AND** timestamps are automatically set
- **AND** the `data` field is initially null until analysis completes

#### Scenario: Store analysis results

- **WHEN** Dify workflow analysis completes successfully
- **THEN** the system stores the complete response as JSONB in the `data` field
- **AND** updates metadata status to "completed"
- **AND** the data maintains its JSON structure for flexible querying

#### Scenario: Track processing status

- **WHEN** the review processing progresses through workflow stages
- **THEN** the system updates the `metadata.status` field (pending → transcribing → analyzing → completed/failed)
- **AND** the `updated_at` timestamp is automatically updated
- **AND** any errors are recorded in `metadata.error_message`

#### Scenario: User association

- **WHEN** querying interview reviews
- **THEN** the system can filter by `user_id` to retrieve all reviews for a specific user
- **AND** the user_id field is indexed for efficient queries

### Requirement: Metadata Structure

The `metadata` JSONB field MUST contain the following standardized structure:

```json
{
  "main_audio_id": "string (ASR task ID from asr_tasks table)",
  "workflow_id": "string (Workflow ID from site_variables)",
  "status": "string (pending|transcribing|analyzing|completed|failed)",
  "asr_result": "object (Cached ASR transcription result)",
  "error_message": "string (Error details if failed, optional)"
}
```

#### Scenario: Reference ASR task

- **WHEN** client creates interview review with ASR task ID
- **THEN** the system stores the ASR task ID in `metadata.main_audio_id`
- **AND** the client can use this ID to reference the original audio and transcription
- **AND** the field references a valid record in `asr_tasks` table

#### Scenario: Cache ASR result

- **WHEN** client obtains ASR transcription result
- **THEN** the system stores the complete ASR result in `metadata.asr_result`
- **AND** this cached data is available for workflow processing without re-querying ASR service

#### Scenario: Track workflow configuration

- **WHEN** backend initiates analysis workflow
- **THEN** the system retrieves workflow ID from `site_variables` table (key: `interview-analysis-workflow`)
- **AND** stores the workflow ID in `metadata.workflow_id` for audit and debugging

#### Scenario: Status progression

- **WHEN** processing status changes
- **THEN** the system updates `metadata.status` following the defined state machine
- **AND** valid transitions are: pending → transcribing → analyzing → completed/failed
- **AND** status can transition to "failed" from any state

#### Scenario: Error handling

- **WHEN** any processing step fails
- **THEN** the system sets `metadata.status` to "failed"
- **AND** records detailed error message in `metadata.error_message`
- **AND** preserves existing metadata for troubleshooting

### Requirement: Workflow Integration

The interview review workflow MUST integrate with existing system components:

- ASR service via `asr_tasks` table for audio transcription
- Site variables via `site_variables` table for workflow configuration
- Dify API for AI-powered interview analysis (non-streaming)

#### Scenario: ASR integration

- **WHEN** creating an interview review
- **THEN** the system expects a valid ASR task ID that exists in `asr_tasks` table
- **AND** the ASR task status MUST be "completed" before proceeding to analysis
- **AND** the ASR result text is used as input to the analysis workflow

#### Scenario: Workflow configuration lookup

- **WHEN** backend needs to start analysis
- **THEN** the system queries `site_variables` table for key `interview-analysis-workflow`
- **AND** uses the returned value as the workflow ID/configuration
- **AND** fails gracefully if the site variable is not found or invalid

#### Scenario: Dify API invocation

- **WHEN** analysis workflow is triggered
- **THEN** the system calls Dify API in non-streaming mode with ASR transcription text
- **AND** waits for complete response before storing in `data` field
- **AND** updates status to "completed" only after successful API response
- **AND** stores raw Dify response without transformation

### Requirement: REST API Endpoints

The system SHALL provide REST API endpoints for managing interview reviews with JWT authentication:

- `POST /api/interview/reviews` - Create new interview review
- `GET /api/interview/reviews/:id` - Get review details
- `GET /api/interview/reviews` - List user's reviews (paginated)
- `POST /api/interview/reviews/:id/analyze` - Trigger analysis workflow

#### Scenario: Create interview review with ASR task ID

- **WHEN** authenticated user sends POST request with `main_audio_id` in request body
- **THEN** the system validates the ASR task exists in `asr_tasks` table
- **AND** validates the ASR task belongs to the requesting user
- **AND** validates the ASR task status is "completed"
- **AND** creates interview_review record with status "pending"
- **AND** returns HTTP 200 with created review ID and details

#### Scenario: Create review validation failure

- **WHEN** user attempts to create review without `main_audio_id`
- **THEN** the system returns HTTP 400 with error message "main_audio_id is required"
- **WHEN** user provides non-existent ASR task ID
- **THEN** the system returns HTTP 404 with error message "ASR task not found"
- **WHEN** user provides ASR task ID belonging to another user
- **THEN** the system returns HTTP 403 with error message "Access denied"
- **WHEN** ASR task status is not "completed"
- **THEN** the system returns HTTP 400 with error message "ASR task is not completed"

#### Scenario: Get review details

- **WHEN** authenticated user requests their own review by ID
- **THEN** the system returns review with all fields (id, user_id, data, metadata, timestamps)
- **WHEN** user requests review belonging to another user
- **THEN** the system returns HTTP 403 with error message "Access denied"
- **WHEN** review ID does not exist
- **THEN** the system returns HTTP 404 with error message "Interview review not found"

#### Scenario: List user reviews with pagination

- **WHEN** authenticated user requests review list with page and page_size parameters
- **THEN** the system returns paginated list of reviews ordered by created_at DESC
- **AND** response includes total count, current page, page size, and review array
- **AND** only returns reviews belonging to the requesting user
- **AND** defaults to page=1, page_size=10 if not specified

#### Scenario: Trigger analysis workflow

- **WHEN** authenticated user triggers analysis on review with status "pending"
- **THEN** the system queries site_variables for key "interview-analysis-workflow"
- **AND** retrieves ASR result text from metadata.asr_result
- **AND** calls Dify API (non-streaming) with ASR text as input
- **AND** updates review data field with complete Dify response
- **AND** updates metadata.status to "completed" and metadata.workflow_id
- **AND** returns HTTP 200 with updated review

#### Scenario: Analysis workflow failure handling

- **WHEN** site variable "interview-analysis-workflow" is not found
- **THEN** the system returns HTTP 500 with error message "Workflow configuration not found"
- **WHEN** Dify API call fails
- **THEN** the system updates metadata.status to "failed"
- **AND** records error details in metadata.error_message
- **AND** returns HTTP 500 with error message

### Requirement: Database Schema Conventions

The interview_reviews table MUST follow project database conventions:

- Use GORM struct tags for schema definition
- Include proper field types (int64 for ID, string/varchar(20) for user_id, JSON/jsonb for data fields)
- Add database comments in Chinese for field descriptions
- Create indexes on frequently queried fields (user_id, timestamps)
- Implement TableName() method returning "interview_reviews"

#### Scenario: GORM model definition

- **WHEN** the model is defined
- **THEN** it includes all GORM tags with types, indexes, and comments
- **AND** JSON fields use the project's JSON type ([]byte alias)
- **AND** the model follows existing project patterns (e.g., EventLog, ResumeRecord)

#### Scenario: Auto-migration registration

- **WHEN** the server initializes the database
- **THEN** the InterviewReview model is registered in the auto-migration list
- **AND** the table is created automatically if it doesn't exist
- **AND** schema changes are applied without data loss
