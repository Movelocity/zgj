# Implementation Tasks

## 1. Database Schema
- [x] 1.1 Create `server/model/interview_review.go` with GORM model definition
- [x] 1.2 Define struct fields:
  - `ID` (int64, auto-increment, primary key)
  - `UserID` (string, varchar 20, indexed, not null)
  - `Data` (JSON/jsonb, nullable) - Stores Dify analysis response
  - `Metadata` (JSON/jsonb, not null) - Stores workflow state
  - `CreatedAt`, `UpdatedAt` (time.Time, auto-managed)
- [x] 1.3 Add GORM tags with types, indexes, and Chinese comments following project conventions
- [x] 1.4 Implement `TableName()` method returning `"interview_reviews"`
- [x] 1.5 Add constants for status values (pending, transcribing, analyzing, completed, failed)

## 2. Database Migration
- [x] 2.1 Register `InterviewReview` model in `server/initialize/db.go` auto-migration list
- [x] 2.2 Verify migration runs successfully on server startup
- [x] 2.3 Confirm table is created with correct schema in PostgreSQL

## 3. Documentation
- [x] 3.1 Document metadata JSON structure in code comments with example
- [x] 3.2 Document the relationship with `asr_tasks` and `site_variables` tables
- [x] 3.3 Document status state machine: pending → transcribing → analyzing → completed/failed

## 4. Validation
- [x] 4.1 Start server and check logs for successful migration
- [x] 4.2 Verify table exists in database: `\d interview_reviews` in psql
- [x] 4.3 Confirm all columns, types, indexes, and constraints are correct
- [x] 4.4 Verify JSONB fields are properly typed as `jsonb` in PostgreSQL

## 5. Service Layer Implementation
- [x] 5.1 Create `server/service/interview_service.go`
- [x] 5.2 Implement `CreateInterviewReview(userID, mainAudioID, asrResult)` - Validates ASR task exists and is completed
- [x] 5.3 Implement `GetInterviewReview(id, userID)` - Get single review with permission check
- [x] 5.4 Implement `ListInterviewReviews(userID, page, pageSize)` - Paginated list
- [x] 5.5 Implement `TriggerAnalysis(id, userID)` - Get workflow from site_variables, call Dify API, update data field
- [x] 5.6 Add helper method `getWorkflowConfig()` - Queries site_variables for `interview-analysis-workflow`
- [x] 5.7 Add helper method `callDifyWorkflow(workflowID, asrText)` - Non-streaming API call to Dify

## 6. API Layer Implementation
- [x] 6.1 Create `server/api/interview/interview.go`
- [x] 6.2 Implement `CreateReview` handler - POST /api/interview/reviews (requires main_audio_id in body)
- [x] 6.3 Implement `GetReview` handler - GET /api/interview/reviews/:id
- [x] 6.4 Implement `ListReviews` handler - GET /api/interview/reviews (with pagination)
- [x] 6.5 Implement `TriggerAnalysis` handler - POST /api/interview/reviews/:id/analyze
- [x] 6.6 Add request/response structs for all endpoints
- [x] 6.7 Add proper error handling and validation (ASR task ID is required)

## 7. Router Configuration
- [x] 7.1 Create `server/router/interview.go` with route group setup
- [x] 7.2 Register all interview routes under `/api/interview` prefix
- [x] 7.3 Add JWT authentication middleware to all routes
- [x] 7.4 Integrate interview router in `server/router/enter.go`

## 8. Integration Testing
- [x] 8.1 Test create review with valid ASR task ID
- [x] 8.2 Test create review fails without ASR task ID
- [x] 8.3 Test create review fails with invalid/non-existent ASR task ID
- [x] 8.4 Test list reviews returns only current user's reviews
- [x] 8.5 Test trigger analysis workflow end-to-end
- [x] 8.6 Test permission checks (users can only access their own reviews)

## 9. Configuration
- [x] 9.1 Verify site_variables table has `interview-analysis-workflow` entry
- [x] 9.2 Document required workflow configuration format
- [x] 9.3 Add error handling if workflow configuration is missing
