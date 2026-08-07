-- Migration number: 0013  2026-08-04
-- Add profile fields to users table
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;