import { lucia } from "./lucia"
import { db } from "../database/connection"
import { createExpressRequest, createExpressResponse } from "./colyseus-compat"
import { IncomingMessage, ServerResponse } from "http"

export interface User {
  id: string
  username: string
  created_at: Date
}

export interface Session {
  id: string
  user_id: string
  expires_at: Date
}

/**
 * Create a guest user for anonymous game sessions
 */
export async function createGuestUser(username?: string): Promise<User> {
  const guestUsername = username || `Guest_${Date.now()}`
  
  const user = await db
    .insertInto('users')
    .values({
      username: guestUsername,
      password_hash: null as any, // Guest users don't have passwords
      created_at: new Date(),
      id: undefined as any // Let DB generate UUID
    })
    .returning(['id', 'username', 'created_at'])
    .executeTakeFirstOrThrow()

  return user
}

/**
 * Create a session for a user
 */
export async function createSession(userId: string): Promise<Session> {
  const session = await lucia.createSession(userId, {})
  return {
    id: session.id,
    user_id: session.userId,
    expires_at: session.expiresAt
  }
}

/**
 * Validate a session from request
 */
export async function validateSession(req: IncomingMessage): Promise<{ user: User | null, session: Session | null }> {
  const expressReq = createExpressRequest(req)
  const sessionId = lucia.readSessionCookie(expressReq.headers.cookie ?? "")
  if (!sessionId) {
    return { user: null, session: null }
  }

  const result = await lucia.validateSession(sessionId)
  
  const session = result.session ? {
    id: result.session.id,
    user_id: result.session.userId,
    expires_at: result.session.expiresAt
  } : null

  return {
    user: result.user,
    session
  }
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(res: ServerResponse, session: Session) {
  const expressRes = createExpressResponse()
  const sessionCookie = lucia.createSessionCookie(session.id)
  expressRes.setHeader('Set-Cookie', sessionCookie.serialize())
  return expressRes
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(res: ServerResponse) {
  const expressRes = createExpressResponse()
  const sessionCookie = lucia.createBlankSessionCookie()
  expressRes.setHeader('Set-Cookie', sessionCookie.serialize())
  return expressRes
}

/**
 * Get or create a guest session for anonymous users
 */
export async function getOrCreateGuestSession(req: IncomingMessage, res: ServerResponse): Promise<{ user: User, session: Session, expressRes?: any }> {
  // Try to validate existing session
  const { user, session } = await validateSession(req)
  
  if (user && session) {
    return { user, session }
  }

  // Create new guest user and session
  const newUser = await createGuestUser()
  const newSession = await createSession(newUser.id)
  
  const expressRes = setSessionCookie(res, newSession)
  
  return { user: newUser, session: newSession, expressRes }
}