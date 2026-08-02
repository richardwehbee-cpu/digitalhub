-- Migration number: 0010  2026-08-02
-- Add city column to customers table
ALTER TABLE customers ADD COLUMN city TEXT;