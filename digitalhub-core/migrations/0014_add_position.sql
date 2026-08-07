-- Migration number: 0014  2026-08-04
-- Add position column to users table
ALTER TABLE users ADD COLUMN position TEXT;