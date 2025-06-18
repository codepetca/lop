import { describe, it, expect, beforeEach } from 'vitest'
import { testDb } from '@shared/utils/test-database'
import { seedTestData, clearTestData, createTestCampaign, createTestScene, createTestTargets } from '@shared/utils/test-helpers'
import { testCampaigns, testScenes } from '@shared/fixtures/campaigns'

// Import the functions we want to test
import { getCampaign, getScene, getSceneTargets, getSceneWithTargets, getAllCampaigns } from '../test-queries'

describe('Database Queries', () => {
  beforeEach(async () => {
    await clearTestData()
    await seedTestData()
  })

  describe('getCampaign', () => {
    it('should return a campaign by ID', async () => {
      const campaign = await getCampaign('test-campaign-1')
      
      expect(campaign).toBeDefined()
      expect(campaign?.id).toBe('test-campaign-1')
      expect(campaign?.title).toBe('Test Forest Quest')
      expect(campaign?.first_scene_id).toBe('test-scene-1')
    })

    it('should return undefined for non-existent campaign', async () => {
      const campaign = await getCampaign('non-existent-id')
      expect(campaign).toBeUndefined()
    })
  })

  describe('getScene', () => {
    it('should return a scene by ID', async () => {
      const scene = await getScene('test-scene-1')
      
      expect(scene).toBeDefined()
      expect(scene?.id).toBe('test-scene-1')
      expect(scene?.title).toBe('Test Forest Entrance')
      expect(scene?.campaign_id).toBe('test-campaign-1')
      expect(scene?.timer_seconds).toBe(30)
      expect(scene?.is_final_scene).toBe(0) // SQLite stores booleans as 0/1
    })

    it('should return undefined for non-existent scene', async () => {
      const scene = await getScene('non-existent-id')
      expect(scene).toBeUndefined()
    })
  })

  describe('getSceneTargets', () => {
    it('should return all targets for a scene', async () => {
      const targets = await getSceneTargets('test-scene-1')
      
      expect(targets).toHaveLength(2)
      expect(targets[0].scene_id).toBe('test-scene-1')
      expect(targets[0].label).toBe('Go Left')
      expect(targets[1].label).toBe('Go Right')
    })

    it('should return empty array for scene with no targets', async () => {
      const scene = await createTestScene({ id: 'scene-no-targets' })
      const targets = await getSceneTargets(scene.id)
      
      expect(targets).toHaveLength(0)
    })

    it('should return targets with correct positioning data', async () => {
      const targets = await getSceneTargets('test-scene-1')
      
      const leftTarget = targets.find(t => t.label === 'Go Left')
      expect(leftTarget?.x_percent).toBe(25)
      expect(leftTarget?.y_percent).toBe(70)
      expect(leftTarget?.width_percent).toBe(15)
      expect(leftTarget?.height_percent).toBe(15)
    })
  })

  describe('getSceneWithTargets', () => {
    it('should return scene with targets attached', async () => {
      const sceneWithTargets = await getSceneWithTargets('test-scene-1')
      
      expect(sceneWithTargets).toBeDefined()
      expect(sceneWithTargets?.id).toBe('test-scene-1')
      expect(sceneWithTargets?.title).toBe('Test Forest Entrance')
      expect(sceneWithTargets?.targets).toHaveLength(2)
      expect(sceneWithTargets?.targets[0].label).toBe('Go Left')
    })

    it('should return null for non-existent scene', async () => {
      const sceneWithTargets = await getSceneWithTargets('non-existent-id')
      expect(sceneWithTargets).toBeNull()
    })

    it('should include next_scene_id in targets', async () => {
      const sceneWithTargets = await getSceneWithTargets('test-scene-1')
      
      const leftTarget = sceneWithTargets?.targets.find(t => t.label === 'Go Left')
      expect(leftTarget?.next_scene_id).toBe('test-scene-2')
      
      const rightTarget = sceneWithTargets?.targets.find(t => t.label === 'Go Right')
      expect(rightTarget?.next_scene_id).toBe('test-scene-3')
    })
  })

  describe('getAllCampaigns', () => {
    it('should return all campaigns ordered by created_at desc', async () => {
      const campaigns = await getAllCampaigns()
      
      expect(campaigns).toHaveLength(2)
      expect(campaigns[0].title).toBe('Test Space Adventure') // Created later
      expect(campaigns[1].title).toBe('Test Forest Quest')
    })

    it('should return empty array when no campaigns exist', async () => {
      await clearTestData()
      const campaigns = await getAllCampaigns()
      
      expect(campaigns).toHaveLength(0)
    })

    it('should include all campaign properties', async () => {
      const campaigns = await getAllCampaigns()
      const campaign = campaigns[0]
      
      expect(campaign).toHaveProperty('id')
      expect(campaign).toHaveProperty('title')
      expect(campaign).toHaveProperty('description')
      expect(campaign).toHaveProperty('first_scene_id')
      expect(campaign).toHaveProperty('created_at')
    })
  })

  describe('Database Integration', () => {
    it('should handle complex scene relationships', async () => {
      // Test that we can navigate through a complete scene path
      const campaign = await getCampaign('test-campaign-1')
      expect(campaign?.first_scene_id).toBe('test-scene-1')
      
      const firstScene = await getSceneWithTargets(campaign!.first_scene_id!)
      expect(firstScene?.targets).toHaveLength(2)
      
      // Follow the "Go Left" path
      const leftTarget = firstScene?.targets.find(t => t.label === 'Go Left')
      const secondScene = await getSceneWithTargets(leftTarget!.next_scene_id!)
      expect(secondScene?.title).toBe('Test Dark Path')
      
      // Continue to final scene
      const continueTarget = secondScene?.targets[0]
      const finalScene = await getSceneWithTargets(continueTarget!.next_scene_id!)
      expect(finalScene?.title).toBe('Test Victory')
      expect(finalScene?.is_final_scene).toBe(1) // SQLite stores booleans as 0/1
    })

    it('should handle final scene with no next_scene_id', async () => {
      const finalScene = await getSceneWithTargets('test-scene-3')
      const playAgainTarget = finalScene?.targets.find(t => t.label === 'Play Again')
      
      expect(playAgainTarget?.next_scene_id).toBeNull()
    })
  })
})