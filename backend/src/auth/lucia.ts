import { Lucia } from "lucia"
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql"
import { Pool } from "pg"

// Create a separate pool for Lucia Auth
const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
})

// Note: This is a basic setup. You may need to adjust based on your specific needs
// For now, we'll create a simple user system for game sessions

export const lucia = new Lucia(
  new NodePostgresAdapter(authPool, {
    user: "users",
    session: "sessions"
  }),
  {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === "production"
      }
    },
    getUserAttributes: (attributes) => {
      return {
        username: attributes.username,
        display_name: attributes.display_name,
        nickname: attributes.nickname,
        avatar_seed: attributes.avatar_seed,
        created_at: attributes.created_at
      }
    }
  }
)

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      username: string
      display_name: string | null
      nickname: string | null
      avatar_seed: string | null
      created_at: Date
    }
  }
}