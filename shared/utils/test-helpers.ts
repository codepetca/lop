import { vi } from 'vitest'
import { getTestDb } from './test-database'
import { testCampaigns, testScenes, testSceneTargets } from '../fixtures/campaigns'

/**
 * Seed the test database with sample data
 */
export async function seedTestData() {
  const testDb = getTestDb()
  
  // Insert campaigns
  for (const campaign of testCampaigns) {
    await testDb
      .insertInto('campaigns')
      .values({
        ...campaign,
        created_at: typeof campaign.created_at === 'string' ? campaign.created_at : campaign.created_at.toISOString()
      })
      .execute()
  }

  // Insert scenes
  for (const scene of testScenes) {
    await testDb
      .insertInto('scenes')
      .values({
        ...scene,
        is_final_scene: scene.is_final_scene ? 1 : 0, // Convert boolean to integer for SQLite
        created_at: typeof scene.created_at === 'string' ? scene.created_at : scene.created_at.toISOString()
      })
      .execute()
  }

  // Insert scene targets
  for (const target of testSceneTargets) {
    await testDb
      .insertInto('scene_targets')
      .values({
        ...target,
        created_at: typeof target.created_at === 'string' ? target.created_at : target.created_at.toISOString()
      })
      .execute()
  }
}

/**
 * Clear all test data from database
 */
export async function clearTestData() {
  const testDb = getTestDb()
  await testDb.deleteFrom('scene_targets').execute()
  await testDb.deleteFrom('scenes').execute()
  await testDb.deleteFrom('campaigns').execute()
}

/**
 * Create a minimal campaign for testing
 */
export async function createTestCampaign(overrides: Partial<typeof testCampaigns[0]> = {}) {
  const testDb = getTestDb()
  const campaign = {
    ...testCampaigns[0],
    id: `test-campaign-${Date.now()}`,
    ...overrides
  }
  
  await testDb
    .insertInto('campaigns')
    .values({ 
      ...campaign, 
      created_at: typeof campaign.created_at === 'string' ? campaign.created_at : campaign.created_at.toISOString()
    })
    .execute()
    
  return campaign
}

/**
 * Create a minimal scene for testing
 */
export async function createTestScene(overrides: Partial<typeof testScenes[0]> = {}) {
  const testDb = getTestDb()
  const scene = {
    ...testScenes[0],
    id: `test-scene-${Date.now()}`,
    ...overrides
  }
  
  await testDb
    .insertInto('scenes')
    .values({ 
      ...scene, 
      is_final_scene: scene.is_final_scene ? 1 : 0, // Convert boolean to integer for SQLite
      created_at: typeof scene.created_at === 'string' ? scene.created_at : scene.created_at.toISOString()
    })
    .execute()
    
  return scene
}

/**
 * Create test scene targets for a scene
 */
export async function createTestTargets(sceneId: string, count = 2) {
  const testDb = getTestDb()
  const targets = []
  
  for (let i = 0; i < count; i++) {
    const target = {
      id: `test-target-${Date.now()}-${i}`,
      scene_id: sceneId,
      label: `Test Option ${i + 1}`,
      x_percent: 25 + (i * 50),
      y_percent: 70,
      width_percent: 15,
      height_percent: 15,
      next_scene_id: null,
      created_at: new Date().toISOString()
    }
    
    await testDb
      .insertInto('scene_targets')
      .values(target)
      .execute()
      
    targets.push(target)
  }
  
  return targets
}

/**
 * Wait for a specified number of milliseconds (for async tests)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate a unique ID for testing
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const originalConsole = { ...console }
  
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
  
  return {
    restore: () => {
      Object.assign(console, originalConsole)
    },
    getLogCalls: () => (console.log as any).mock.calls,
    getErrorCalls: () => (console.error as any).mock.calls,
    getWarnCalls: () => (console.warn as any).mock.calls
  }
}