-- Seed workflow records so the existing Go backend calls the local LangChain
-- Dify-compatible service instead of a remote Dify instance.
--
-- Usage:
--   psql -d zgj -f scripts/seed_langchain_workflows.sql

WITH workflow_seed(id, api_url, api_key, name, description) AS (
  VALUES
    (
      'wf_lang_upload',
      'http://127.0.0.1:8890/v1/files/upload',
      'local-dev',
      'upload_file',
      'Local LangChain-compatible file upload endpoint'
    ),
    (
      'wf_lang_doc',
      'http://127.0.0.1:8890/v1/workflows/run?workflow=doc_extract',
      'local-dev',
      'doc_extract',
      'Extract resume text from uploaded document'
    ),
    (
      'wf_lang_struct',
      'http://127.0.0.1:8890/v1/workflows/run?workflow=resume_structure',
      'local-dev',
      'resume_structure',
      'Structure resume text into editor JSON'
    ),
    (
      'wf_lang_chat',
      'http://127.0.0.1:8890/v1/workflows/run?workflow=basic-chat',
      'local-dev',
      'basic-chat',
      'Resume editor chat assistant'
    ),
    (
      'wf_lang_analysis',
      'http://127.0.0.1:8890/v1/workflows/run?workflow=common-analysis',
      'local-dev',
      'common-analysis',
      'Whole-resume analysis and optimization advice'
    ),
    (
      'wf_lang_format',
      'http://127.0.0.1:8890/v1/workflows/run?workflow=smart-format-2',
      'local-dev',
      'smart-format-2',
      'Format resume edits into editor JSON'
    )
),
updated AS (
  UPDATE workflows w
  SET
    api_url = s.api_url,
    api_key = s.api_key,
    description = s.description,
    inputs = '[]'::jsonb,
    outputs = '[]'::jsonb,
    is_public = true,
    enabled = true,
    updated_at = NOW()
  FROM workflow_seed s
  WHERE w.name = s.name
  RETURNING w.name
)
INSERT INTO workflows (
  id, api_url, api_key, name, description, creator_id,
  inputs, outputs, used, is_public, enabled, created_at, updated_at
)
SELECT
  s.id,
  s.api_url,
  s.api_key,
  s.name,
  s.description,
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
  '[]'::jsonb,
  '[]'::jsonb,
  0,
  true,
  true,
  NOW(),
  NOW()
FROM workflow_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM updated u WHERE u.name = s.name
);
