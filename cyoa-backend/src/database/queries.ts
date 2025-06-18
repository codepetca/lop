import { db } from './connection'

export async function getCampaign(campaignId: string) {
  return await db
    .selectFrom('campaigns')
    .selectAll()
    .where('id', '=', campaignId)
    .executeTakeFirst()
}

export async function getScene(sceneId: string) {
  return await db
    .selectFrom('scenes')
    .selectAll()
    .where('id', '=', sceneId)
    .executeTakeFirst()
}

export async function getSceneTargets(sceneId: string) {
  return await db
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
  return await db
    .selectFrom('campaigns')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute()
}