## ADDED Requirements

### Requirement: Opportunity Vector Index

The system SHALL maintain a ChromaDB vector index for published job opportunities.

#### Scenario: Upsert opportunity vector
- **WHEN** an opportunity is created or updated with status `published`
- **THEN** the system SHALL store or update one vector document in ChromaDB using the opportunity's company, title, category, location, cadence, summary, responsibilities, requirements, and note
- **AND** the vector metadata SHALL include the opportunity ID, company, title, category, location, contact email, and status

#### Scenario: Remove archived opportunity vector
- **WHEN** an opportunity is archived
- **THEN** the system SHALL remove the corresponding ChromaDB vector document

#### Scenario: Preserve primary write when vector sync fails
- **WHEN** PostgreSQL opportunity creation, update, or archive succeeds but ChromaDB sync fails
- **THEN** the system SHALL keep the PostgreSQL write successful
- **AND** the system SHALL log the vector sync failure for later rebuild

### Requirement: Multilingual Embedding Method

The system SHALL use a configurable multilingual sentence embedding method for opportunity and resume vectors.

#### Scenario: Default embedding provider
- **WHEN** no custom embedding provider is configured
- **THEN** the system SHALL use a local multilingual MiniLM sentence embedding model suitable for Chinese and English text
- **AND** the system SHALL NOT require a separate embedding API key

#### Scenario: Consistent vector space
- **WHEN** matching a resume against opportunities
- **THEN** the system SHALL embed both the resume query and opportunity documents with the same embedding method

### Requirement: Resume Opportunity Matching

The system SHALL match a resume against the opportunity vector index and return ranked opportunities.

#### Scenario: Match resume text
- **WHEN** an authenticated user submits resume text or structured resume JSON with `top_k`
- **THEN** the system SHALL return up to `top_k` opportunity matches ordered by semantic similarity
- **AND** each match SHALL include opportunity metadata, distance, and normalized score

#### Scenario: Match uploaded resume file
- **WHEN** an authenticated user uploads a supported resume file for matching
- **THEN** the system SHALL extract text from the file through the LangChain service
- **AND** return ranked opportunity matches using the extracted resume text

#### Scenario: Empty resume rejected
- **WHEN** the submitted resume content is empty
- **THEN** the system SHALL reject the request with a clear validation error

### Requirement: Rebuild Opportunity Vector Index

The system SHALL provide an admin rebuild flow for the opportunity vector index.

#### Scenario: Rebuild from PostgreSQL
- **WHEN** an administrator triggers vector rebuild
- **THEN** the system SHALL read all published opportunities from PostgreSQL
- **AND** upsert them into the ChromaDB opportunity collection

#### Scenario: Rebuild after Chroma downtime
- **WHEN** ChromaDB was unavailable during previous opportunity writes
- **THEN** an administrator SHALL be able to run rebuild to restore the vector index from PostgreSQL

### Requirement: Frontend Resume Matching Display

The system SHALL expose resume-to-opportunity matching on the public opportunity page.

#### Scenario: User matches pasted resume
- **GIVEN** a logged-in user is viewing `/opportunities`
- **WHEN** the user pastes resume content and starts matching
- **THEN** the page SHALL call the resume opportunity matching API
- **AND** the opportunity list SHALL display match scores and reasons for returned matches
- **AND** matched opportunities SHALL be ordered ahead of unmatched opportunities by descending score

#### Scenario: User matches uploaded resume
- **GIVEN** a logged-in user is viewing `/opportunities`
- **WHEN** the user selects a supported resume file and starts matching
- **THEN** the page SHALL upload the file through the backend matching API
- **AND** display the returned match scores and reasons without exposing embedding model or collection names

#### Scenario: Match failure is visible
- **WHEN** the matching request fails because the user is not logged in or the vector service returns an error
- **THEN** the page SHALL show a clear error message without clearing the existing opportunity list
