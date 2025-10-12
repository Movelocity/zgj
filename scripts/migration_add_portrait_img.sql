-- Migration: Add portrait_img column to resume_records table
-- Date: 2025-10-12
-- Description: Add portrait_img column to store profile picture URL for resumes

-- Add portrait_img column
ALTER TABLE resume_records ADD COLUMN IF NOT EXISTS portrait_img VARCHAR(512) DEFAULT '';

-- Add comment for the column
COMMENT ON COLUMN resume_records.portrait_img IS '证件照URL';

