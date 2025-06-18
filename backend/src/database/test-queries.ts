import { getTestDb } from '@shared/utils/test-database'

export async function getCampaign(campaignId: string) {
  const testDb = getTestDb()
  return await testDb
    .selectFrom('campaigns')
    .selectAll()
    .where('id', '=', campaignId)
    .executeTakeFirst()
}

export async function getScene(sceneId: string) {
  const testDb = getTestDb()
  return await testDb
    .selectFrom('scenes')
    .selectAll()
    .where('id', '=', sceneId)
    .executeTakeFirst()
}

export async function getSceneTargets(sceneId: string) {
  const testDb = getTestDb()
  return await testDb
    .selectFrom('scene_targets')
    .selectAll()
    .where('scene_id', '=', sceneId)
    .execute()
}

export async function getSceneWithTargets(sceneId: string) {
  const scene = await getScene(sceneId)
  if (!scene) return null
  
  const targets = await getSceneTargets(sceneId)
  return { ...scene, targets }
}

export async function getAllCampaigns() {
  const testDb = getTestDb()
  return await testDb
    .selectFrom('campaigns')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute()
}