import 'dotenv/config'
import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { GameRoom } from './rooms/GameRoom'
import { getAllCampaigns } from './database/queries'

const app = express()
app.use(cors())
app.use(express.json())

// REST API endpoints
app.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await getAllCampaigns()
    res.json(campaigns)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    res.status(500).json({ error: 'Failed to fetch campaigns' })
  }
})

const server = createServer(app)
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
})

// Register room handlers
gameServer.define('game_room', GameRoom)

const port = Number(process.env.PORT) || 2567

gameServer.listen(port)
console.log(`🎮 Game server listening on port ${port}`)

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...')
  gameServer.gracefullyShutdown()
  process.exit(0)
})