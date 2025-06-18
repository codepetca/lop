import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import { Database } from './types'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
})

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool
  })
})