-- Database setup for Choose Your Own Adventure game
-- Run this against your Neon PostgreSQL database

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

-- Sample data for testing
INSERT INTO campaigns (id, title, description) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Forest Quest', 'A simple adventure through an enchanted forest');

INSERT INTO scenes (id, campaign_id, scene_order, title, image_url, timer_seconds, is_final_scene) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Forest Entrance', 'https://picsum.photos/800/600?random=1', 30, false),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Dark Path', 'https://picsum.photos/800/600?random=2', 25, false),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Victory!', 'https://picsum.photos/800/600?random=3', 15, true);

-- Update campaign with first scene
UPDATE campaigns SET first_scene_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Add clickable targets for each scene
INSERT INTO scene_targets (scene_id, label, x_percent, y_percent, next_scene_id) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Go Left', 25, 70, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Go Right', 75, 70, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Continue Forward', 50, 80, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Play Again', 50, 50, null);