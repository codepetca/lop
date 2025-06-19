import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'

// Create a simple migration tracking table
const MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
  );
`

export async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  })

  try {
    console.log('📁 Setting up migrations table...')
    await pool.query(MIGRATIONS_TABLE_SQL)

    // Get list of executed migrations
    const { rows: executedMigrations } = await pool.query(
      'SELECT filename FROM migrations ORDER BY filename'
    )
    const executedFiles = new Set(executedMigrations.map(row => row.filename))

    // Get all migration files
    const migrationsDir = join(__dirname, 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    console.log(`📋 Found ${migrationFiles.length} migration files`)

    let executed = 0
    for (const filename of migrationFiles) {
      if (executedFiles.has(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`)
        continue
      }

      console.log(`🚀 Running migration: ${filename}`)
      const filePath = join(migrationsDir, filename)
      const sql = readFileSync(filePath, 'utf-8')

      // Execute migration in a transaction
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        )
        await client.query('COMMIT')
        console.log(`✅ Completed migration: ${filename}`)
        executed++
      } catch (error) {
        await client.query('ROLLBACK')
        console.error(`❌ Failed migration ${filename}:`, error)
        throw error
      } finally {
        client.release()
      }
    }

    console.log(`🎉 Migration complete! Executed ${executed} new migrations.`)
  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// CLI usage
if (require.main === module) {
  runMigrations().catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}