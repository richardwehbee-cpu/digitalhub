-- Migration number: 0015  2026-08-04
-- Add username column to users table (without UNIQUE constraint first)
ALTER TABLE users ADD COLUMN username TEXT;