## Context

The project now stores job opportunities in PostgreSQL and exposes them through Go APIs. The LangChain service already handles local workflow execution and uses DeepSeek for chat/resume generation. Semantic opportunity matching belongs in the LangChain service because it is the existing AI integration boundary and is already independently runnable on port `8890`.

## Goals / Non-Goals

- Goals:
  - Store published opportunity embeddings in ChromaDB.
  - Match a resume against the opportunity vector collection.
  - Keep embeddings usable for Chinese job descriptions and Chinese/English resumes.
  - Avoid requiring a second paid API key for embeddings.
  - Keep Go as the source of truth for opportunity CRUD and PostgreSQL persistence.
- Non-Goals:
  - Replace PostgreSQL opportunity listing/search.
  - Build a separate full recommendation center beyond the existing opportunity page.
  - Use DeepSeek chat completions as an embedding model.

## Decisions

- Decision: ChromaDB runs as a standalone local service.
  - Reason: The TypeScript Chroma client is HTTP-oriented and this keeps persistence outside the Node process.
  - Default URL: `http://127.0.0.1:8000`.

- Decision: Use local multilingual sentence embeddings by default.
  - Model family: `multilingual-e5-small`.
  - Reason: The current opportunity examples are Chinese, but users may upload Chinese or English resumes. E5-style multilingual embeddings are a better fit for query-to-document retrieval than the Chroma default English-oriented MiniLM model.
  - Prefixing: opportunity documents are embedded as `passage: ...`; resume queries are embedded as `query: ...`.
  - Dimensions: 384.

- Decision: Store one Chroma document per opportunity.
  - Document text combines company, title, category, location, cadence, summary, responsibilities, requirements, and note.
  - Metadata stores `opportunity_id`, `company`, `title`, `category`, `location`, `contact_email`, and `status`.
  - Chroma ID format: `job_opportunity:{id}`.

- Decision: Sync vectors after PostgreSQL writes.
  - Go remains the source of truth.
  - After create/update/batch, Go posts normalized opportunity data to LangChain service.
  - After archive, Go asks LangChain service to delete the Chroma document.
  - Sync errors are logged but do not fail the primary CRUD operation, because Chroma is a derived index.

- Decision: Provide a rebuild endpoint.
  - Admin or smoke scripts can rebuild the whole collection from the current PostgreSQL published list.
  - This recovers from Chroma downtime or model changes.

## API Shape

LangChain service endpoints:

- `POST /v1/opportunities/vector/upsert`
  - Body: one opportunity or an array of opportunities.
  - Effect: upsert Chroma documents and embeddings.

- `POST /v1/opportunities/vector/delete`
  - Body: `{ "ids": [1, 2, 3] }`
  - Effect: delete Chroma documents by opportunity IDs.

- `POST /v1/opportunities/vector/match`
  - Body: `{ "resume": string | object, "top_k": number }`
  - Output: ordered matches with opportunity metadata, distance, score, and optional reason.

Go backend endpoints:

- `POST /api/admin/opportunities/vector/rebuild`
  - Requires admin.
  - Lists published opportunities from PostgreSQL and sends them to LangChain service.

- `POST /api/opportunities/match`
  - Requires login.
  - Accepts resume text/JSON and returns Chroma matches.

## Risks / Trade-offs

- Local embedding model first load can be slower.
  - Mitigation: lazy-load once, cache the pipeline, and expose health metadata.

- ChromaDB service may be offline.
  - Mitigation: CRUD succeeds with logged sync warning; rebuild endpoint can restore index later.

- Semantic scores are model-relative.
  - Mitigation: return scores as ranking hints, not hard pass/fail labels.

## Migration Plan

1. Add ChromaDB and embedding dependencies to `langchain-service`.
2. Add environment variables:
   - `CHROMA_URL`
   - `CHROMA_COLLECTION`
   - `EMBEDDING_MODEL`
   - `VECTOR_SYNC_TIMEOUT_MS`
3. Implement LangChain vector endpoints.
4. Add Go client calls after opportunity writes.
5. Add rebuild and match APIs.
6. Document ChromaDB startup and rebuild command in README.

## Open Questions

- Should the first UI entry point be on the opportunity page, the resume editor, or both? The API will support either path.
