# Change: Add Interview Review Database Table

## Why

The system needs to store interview review analysis results for users. This feature enables users to upload audio recordings of mock interviews, get ASR (Automatic Speech Recognition) transcriptions, and receive AI-powered interview analysis through Dify workflows. The `interview_reviews` table will persist the analysis results and track the complete workflow state from audio upload to final analysis.

## What Changes

- Add a new `interview_reviews` database table with GORM model
- Table structure includes:
  - Auto-increment ID (primary key)
  - User ID (foreign key reference to users table)
  - **Data field (JSONB)** - Stores the complete AI analysis results from Dify workflow
  - **Metadata field (JSONB)** - Stores workflow state and references:
    - `main_audio_id` (string) - References `asr_tasks.id` for the audio transcription
    - `workflow_id` (string) - The workflow ID retrieved from site_variables
    - `status` (string) - Processing status: pending, transcribing, analyzing, completed, failed
    - `asr_result` (object) - Cached ASR transcription result from client
    - `error_message` (string) - Error details if processing fails
  - Standard timestamps (created_at, updated_at)

### Business Flow
1. **Client-side**: User uploads audio → ASR task created → Client polls ASR result → Client creates interview_review with `main_audio_id` and ASR result in metadata
2. **Server-side**: Backend reads `interview-analysis-workflow` from site_variables table → Calls Dify API (non-streaming) with ASR text → Stores complete response in `data` field

### Data Relationships
- `interview_reviews.user_id` → `users.id`
- `interview_reviews.metadata.main_audio_id` → `asr_tasks.id`
- Workflow ID sourced from `site_variables` (key: `interview-analysis-workflow`)

## Impact

- Affected specs: New capability `interview-review` (data persistence, workflow integration, and REST API)
- Affected code:
  - `server/model/interview_review.go` - GORM model definition
  - `server/initialize/db.go` - Auto-migration registration
  - `server/service/interview_service.go` - Business logic (create, query, analyze)
  - `server/api/interview/interview.go` - API handlers (CRUD + analyze)
  - `server/router/interview.go` - Route registration
  - `server/router/router.go` - Router integration
- Database: New table `interview_reviews` will be created on next startup
- Dependencies: Integrates with existing `asr_tasks` table, `site_variables` table, and Dify workflow service
- API Endpoints:
  - `POST /api/interview/reviews` - Create review (requires ASR task ID)
  - `GET /api/interview/reviews/:id` - Get review details
  - `GET /api/interview/reviews` - List user's reviews (paginated)
  - `POST /api/interview/reviews/:id/analyze` - Trigger Dify analysis
