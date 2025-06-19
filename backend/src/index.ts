import 'dotenv/config'
import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import { GameRoom } from './rooms/GameRoom'
import { getAllCampaigns } from './database/queries'
import { getOrCreateGuestSession, validateSession, clearSessionCookie } from './auth/utils'

// Create HTTP server
const server = createServer()

const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
})

// Register room handlers
gameServer.define('game_room', GameRoom)

// Helper function to parse JSON body from Node.js request
async function parseJSONBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

// Helper function to set CORS headers
function setCORSHeaders(res: ServerResponse, req?: IncomingMessage) {
  // Allow specific origins for development
  const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:4173', // Vite preview
    'http://localhost:3000'  // Alternative port
  ]
  
  const origin = req?.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    // Fallback for development
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
}

// Helper function to send JSON response
function sendJSONResponse(res: ServerResponse, req: IncomingMessage, data: any, status = 200) {
  setCORSHeaders(res, req)
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = status
  res.end(JSON.stringify(data))
}

// HTTP route handlers - only handle specific routes, let Colyseus handle its own
server.on('request', async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const pathname = url.pathname
  const method = req.method

  // Only handle our custom routes, let Colyseus handle matchmaking and websocket routes
  const isOurRoute = pathname.startsWith('/auth') || pathname.startsWith('/campaigns')
  
  if (!isOurRoute) {
    // Let Colyseus handle this request
    return
  }

  // Handle CORS preflight for our routes
  if (method === 'OPTIONS') {
    setCORSHeaders(res, req)
    res.statusCode = 200
    res.end()
    return
  }

  try {
    // Auth routes
    if (method === 'POST' && pathname === '/auth/guest') {
      const { user, session, expressRes } = await getOrCreateGuestSession(req as any, res as any)
      
      // Set session cookie if available
      if (expressRes && expressRes.getHeaders()['Set-Cookie']) {
        res.setHeader('Set-Cookie', expressRes.getHeaders()['Set-Cookie'])
      }
      
      sendJSONResponse(res, req, {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          nickname: user.nickname,
          avatarSeed: user.avatar_seed
        },
        sessionId: session.id
      })
      return
    }

    if (method === 'GET' && pathname === '/auth/me') {
      const { user } = await validateSession(req as any)
      
      if (!user) {
        sendJSONResponse(res, req, { error: 'Not authenticated' }, 401)
        return
      }
      
      sendJSONResponse(res, req, {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          nickname: user.nickname,
          avatarSeed: user.avatar_seed
        }
      })
      return
    }

    if (method === 'POST' && pathname === '/auth/logout') {
      const expressRes = clearSessionCookie(res as any)
      
      if (expressRes && expressRes.getHeaders()['Set-Cookie']) {
        res.setHeader('Set-Cookie', expressRes.getHeaders()['Set-Cookie'])
      }
      
      sendJSONResponse(res, req, { success: true })
      return
    }

    // Campaign routes
    if (method === 'GET' && pathname === '/campaigns') {
      const campaigns = await getAllCampaigns()
      sendJSONResponse(res, req, campaigns)
      return
    }

    // 404 for unmatched routes
    sendJSONResponse(res, req, { error: 'Not found' }, 404)

  } catch (error) {
    console.error(`Error handling ${method} ${pathname}:`, error)
    sendJSONResponse(res, req, { 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500)
  }
})

const port = Number(process.env.PORT) || 2567

gameServer.listen(port)
console.log(`🎮 Game server listening on port ${port}`)
console.log(`📡 HTTP API available at http://localhost:${port}`)
console.log(`🔌 WebSocket available at ws://localhost:${port}`)

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...')
  gameServer.gracefullyShutdown()
  process.exit(0)
})