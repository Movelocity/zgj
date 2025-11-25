-- Migration: Add display_order to billing_packages
-- Description: Add display_order field for public package display ordering
-- Date: 2025-11-25

-- Add display_order column to billing_packages table
ALTER TABLE billing_packages ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- Create index for display_order
CREATE INDEX IF NOT EXISTS idx_billing_packages_display_order ON billing_packages(display_order);

-- Update comment
COMMENT ON COLUMN billing_packages.display_order IS 'Display order for public package listing (smaller first)';

-- Migrate existing sort_order to display_order
UPDATE billing_packages SET display_order = sort_order WHERE display_order = 0;

-- Rollback script (comment out, for reference):
-- DROP INDEX IF EXISTS idx_billing_packages_display_order;
-- ALTER TABLE billing_packages DROP COLUMN IF EXISTS display_order;
