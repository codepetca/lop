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
function setCORSHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

// Helper function to send JSON response
function sendJSONResponse(res: ServerResponse, data: any, status = 200) {
  setCORSHeaders(res)
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = status
  res.end(JSON.stringify(data))
}

// HTTP route handlers
server.on('request', async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const pathname = url.pathname
  const method = req.method

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCORSHeaders(res)
    res.statusCode = 200
    res.end()
    return
  }

  try {
    // Auth routes
    if (method === 'POST' && pathname === '/auth/guest') {
      const { username } = await parseJSONBody(req)
      const { user, session, expressRes } = await getOrCreateGuestSession(req as any, res as any)
      
      // Set session cookie if available
      if (expressRes && expressRes.getHeaders()['Set-Cookie']) {
        res.setHeader('Set-Cookie', expressRes.getHeaders()['Set-Cookie'])
      }
      
      sendJSONResponse(res, {
        user: {
          id: user.id,
          username: user.username
        },
        sessionId: session.id
      })
      return
    }

    if (method === 'GET' && pathname === '/auth/me') {
      const { user } = await validateSession(req as any)
      
      if (!user) {
        sendJSONResponse(res, { error: 'Not authenticated' }, 401)
        return
      }
      
      sendJSONResponse(res, {
        user: {
          id: user.id,
          username: user.username
        }
      })
      return
    }

    if (method === 'POST' && pathname === '/auth/logout') {
      const expressRes = clearSessionCookie(res as any)
      
      if (expressRes && expressRes.getHeaders()['Set-Cookie']) {
        res.setHeader('Set-Cookie', expressRes.getHeaders()['Set-Cookie'])
      }
      
      sendJSONResponse(res, { success: true })
      return
    }

    // Campaign routes
    if (method === 'GET' && pathname === '/campaigns') {
      const campaigns = await getAllCampaigns()
      sendJSONResponse(res, campaigns)
      return
    }

    // 404 for unmatched routes
    sendJSONResponse(res, { error: 'Not found' }, 404)

  } catch (error) {
    console.error(`Error handling ${method} ${pathname}:`, error)
    sendJSONResponse(res, { 
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