import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'
import type { Database as DatabaseSchema } from '../../backend/src/database/types'

// In-memory SQLite database for testing
let testDbInstance: Kysely<DatabaseSchema> | null = null

export async function setupTestDatabase(): Promise<Kysely<DatabaseSchema>> {
  if (testDbInstance) {
    return testDbInstance
  }

  // Create in-memory SQLite database
  const sqlite = new Database(':memory:')
  
  testDbInstance = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqlite
    })
  })

  // Create tables with SQLite-compatible syntax
  await testDbInstance.schema
    .createTable('campaigns')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('first_scene_id', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
    .execute()

  await testDbInstance.schema
    .createTable('scenes')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('campaign_id', 'text', (col) => col.notNull().references('campaigns.id'))
    .addColumn('scene_order', 'integer', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('image_url', 'text', (col) => col.notNull())
    .addColumn('timer_seconds', 'integer', (col) => col.defaultTo(30))
    .addColumn('is_final_scene', 'boolean', (col) => col.defaultTo(false))
    .addColumn('created_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
    .execute()

  await testDbInstance.schema
    .createTable('scene_targets')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('scene_id', 'text', (col) => col.notNull().references('scenes.id'))
    .addColumn('label', 'text', (col) => col.notNull())
    .addColumn('x_percent', 'real', (col) => col.notNull())
    .addColumn('y_percent', 'real', (col) => col.notNull())
    .addColumn('width_percent', 'real', (col) => col.defaultTo(15))
    .addColumn('height_percent', 'real', (col) => col.defaultTo(15))
    .addColumn('next_scene_id', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo('CURRENT_TIMESTAMP'))
    .execute()

  return testDbInstance
}

export async function cleanupTestDatabase(): Promise<void> {
  if (testDbInstance) {
    await testDbInstance.destroy()
    testDbInstance = null
  }
}

export function getTestDb(): Kysely<DatabaseSchema> {
  if (!testDbInstance) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.')
  }
  return testDbInstance
}