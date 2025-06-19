-- Initial database schema for Choose Your Own Adventure game
-- Migration: 001_initial_schema

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  first_scene_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  scene_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  timer_seconds INTEGER DEFAULT 30,
  is_final_scene BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clickable targets
CREATE TABLE IF NOT EXISTS scene_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  x_percent FLOAT NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent FLOAT NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
  width_percent FLOAT DEFAULT 15,
  height_percent FLOAT DEFAULT 15,
  next_scene_id UUID REFERENCES scenes(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint for first_scene_id
ALTER TABLE campaigns 
ADD CONSTRAINT fk_first_scene 
FOREIGN KEY (first_scene_id) REFERENCES scenes(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scenes_campaign_id ON scenes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order ON scenes(campaign_id, scene_order);
CREATE INDEX IF NOT EXISTS idx_targets_scene_id ON scene_targets(scene_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);