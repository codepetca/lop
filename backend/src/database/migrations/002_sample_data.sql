-- Sample data for development and testing
-- Migration: 002_sample_data

-- Insert sample campaign
INSERT INTO campaigns (id, title, description) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Forest Quest', 'A simple adventure through an enchanted forest')
ON CONFLICT (id) DO NOTHING;

-- Insert sample scenes
INSERT INTO scenes (id, campaign_id, scene_order, title, image_url, timer_seconds, is_final_scene) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Forest Entrance', 'https://picsum.photos/800/600?random=1', 30, false),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Dark Path', 'https://picsum.photos/800/600?random=2', 25, false),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Victory!', 'https://picsum.photos/800/600?random=3', 15, true)
ON CONFLICT (id) DO NOTHING;

-- Update campaign with first scene
UPDATE campaigns SET first_scene_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Insert sample scene targets
INSERT INTO scene_targets (scene_id, label, x_percent, y_percent, next_scene_id) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Go Left', 25, 70, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Go Right', 75, 70, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Continue Forward', 50, 80, 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Play Again', 50, 50, null)
ON CONFLICT DO NOTHING;