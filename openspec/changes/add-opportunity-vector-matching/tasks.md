## 1. LangChain Service

- [x] 1.1 Add ChromaDB and local embedding dependencies.
- [x] 1.2 Add Chroma/vector environment variables to `config.ts` and `.env.example`.
- [x] 1.3 Implement opportunity text normalization for vector documents.
- [x] 1.4 Implement Chroma collection initialization and cached embedding pipeline.
- [x] 1.5 Add upsert/delete/match endpoints in `server.ts`.
- [x] 1.6 Add smoke script for upsert and match.

## 2. Go Backend

- [x] 2.1 Add LangChain vector config to `config.yaml` and `config.example.yaml`.
- [x] 2.2 Add service client for opportunity vector upsert/delete/match calls.
- [x] 2.3 Trigger vector upsert after create/update/batch create.
- [x] 2.4 Trigger vector delete after archive.
- [x] 2.5 Add admin rebuild API from PostgreSQL published opportunities.
- [x] 2.6 Add authenticated resume-to-opportunity match API.

## 3. Documentation and Validation

- [x] 3.1 Update README with ChromaDB startup, environment variables, and rebuild flow.
- [x] 3.2 Run `npm run typecheck` and smoke test in `langchain-service`.
- [x] 3.3 Run `go build -o server .` in `server`.
- [x] 3.4 Verify matching with the seeded opportunities and a sample resume.

## 4. Frontend

- [x] 4.1 Add TypeScript types and API wrapper for opportunity matching.
- [x] 4.2 Add resume paste and match controls to `/opportunities`.
- [x] 4.3 Display match scores and reasons in the list/detail views.
- [x] 4.4 Sort matched opportunities by descending score while preserving keyword filters.
- [x] 4.5 Add direct resume file upload matching on `/opportunities`.
- [x] 4.6 Hide embedding model and collection metadata from the user-facing UI/API response.
