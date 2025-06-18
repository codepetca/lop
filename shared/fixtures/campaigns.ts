export const testCampaigns = [
  {
    id: 'test-campaign-1',
    title: 'Test Forest Quest',
    description: 'A test adventure through an enchanted forest',
    first_scene_id: 'test-scene-1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-campaign-2', 
    title: 'Test Space Adventure',
    description: 'A test journey through the cosmos',
    first_scene_id: 'test-scene-4',
    created_at: '2024-01-02T00:00:00Z'
  }
] as const

export const testScenes = [
  {
    id: 'test-scene-1',
    campaign_id: 'test-campaign-1',
    scene_order: 1,
    title: 'Test Forest Entrance',
    image_url: 'https://example.com/forest1.jpg',
    timer_seconds: 30,
    is_final_scene: false,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-scene-2',
    campaign_id: 'test-campaign-1',
    scene_order: 2,
    title: 'Test Dark Path',
    image_url: 'https://example.com/forest2.jpg',
    timer_seconds: 25,
    is_final_scene: false,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-scene-3',
    campaign_id: 'test-campaign-1',
    scene_order: 3,
    title: 'Test Victory',
    image_url: 'https://example.com/forest3.jpg',
    timer_seconds: 15,
    is_final_scene: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-scene-4',
    campaign_id: 'test-campaign-2',
    scene_order: 1,
    title: 'Test Space Station',
    image_url: 'https://example.com/space1.jpg',
    timer_seconds: 45,
    is_final_scene: false,
    created_at: '2024-01-02T00:00:00Z'
  }
] as const

export const testSceneTargets = [
  {
    id: 'test-target-1',
    scene_id: 'test-scene-1',
    label: 'Go Left',
    x_percent: 25,
    y_percent: 70,
    width_percent: 15,
    height_percent: 15,
    next_scene_id: 'test-scene-2',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-target-2',
    scene_id: 'test-scene-1',
    label: 'Go Right',
    x_percent: 75,
    y_percent: 70,
    width_percent: 15,
    height_percent: 15,
    next_scene_id: 'test-scene-3',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-target-3',
    scene_id: 'test-scene-2',
    label: 'Continue Forward',
    x_percent: 50,
    y_percent: 80,
    width_percent: 20,
    height_percent: 15,
    next_scene_id: 'test-scene-3',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-target-4',
    scene_id: 'test-scene-3',
    label: 'Play Again',
    x_percent: 50,
    y_percent: 50,
    width_percent: 20,
    height_percent: 15,
    next_scene_id: null,
    created_at: '2024-01-01T00:00:00Z'
  }
] as const