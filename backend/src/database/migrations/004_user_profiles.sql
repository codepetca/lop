-- User profile enhancement: display names, nicknames, and avatars
-- Migration: 004_user_profiles

-- Add profile columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(200);

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);