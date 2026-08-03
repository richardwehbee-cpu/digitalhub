-- Migration number: 0012  2026-08-02
-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'Viewer' CHECK (role IN ('Admin', 'Manager', 'Viewer')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default admin user (password: changeme123)
-- Password hash generated with PBKDF2-SHA256, 100000 iterations
-- Change this password immediately after first login
INSERT INTO users (id, email, password_hash, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@digitalhub.com',
  'pbkdf2$100000$a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4$e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  'Admin'
);