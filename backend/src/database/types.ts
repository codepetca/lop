export interface Database {
  campaigns: {
    id: string
    title: string
    description: string | null
    first_scene_id: string | null
    created_at: Date
  }
  scenes: {
    id: string
    campaign_id: string
    scene_order: number
    title: string
    image_url: string
    timer_seconds: number
    is_final_scene: boolean
    created_at: Date
  }
  scene_targets: {
    id: string
    scene_id: string
    label: string
    x_percent: number
    y_percent: number
    width_percent: number
    height_percent: number
    next_scene_id: string | null
    created_at: Date
  }
  users: {
    id: string
    username: string
    password_hash: string | null
    display_name: string | null
    nickname: string | null
    avatar_seed: string | null
    created_at: Date
  }
  sessions: {
    id: string
    user_id: string
    expires_at: Date
    created_at: Date
  }
}