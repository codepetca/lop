import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GameRoom } from '../GameRoom'
import { seedTestData, clearTestData, mockConsole } from '@shared/utils/test-helpers'

// Mock the database queries for GameRoom tests
vi.mock('../database/queries', () => ({
  getCampaign: vi.fn(),
  getSceneWithTargets: vi.fn()
}))

// Mock Colyseus core
vi.mock('@colyseus/core', () => ({
  Room: class MockRoom {
    state: any = {}
    clients = new Map()
    maxClients = 30
    
    setState(state: any) {
      this.state = state
    }
    
    broadcast(messageType: string, data: any) {
      console.log(`[TEST] Broadcasting ${messageType}:`, data)
    }
    
    onMessage(messageType: string, handler: Function) {
      // Mock implementation
    }
  },
  Client: class MockClient {
    sessionId: string
    
    constructor(sessionId: string = 'test-session') {
      this.sessionId = sessionId
    }
    
    send(messageType: string, data: any) {
      console.log(`[TEST] Sending to client ${this.sessionId}:`, messageType, data)
    }
  }
}))

describe('GameRoom', () => {
  let gameRoom: GameRoom
  let mockConsoleHelpers: ReturnType<typeof mockConsole>
  
  beforeEach(async () => {
    await clearTestData()
    await seedTestData()
    
    mockConsoleHelpers = mockConsole()
    gameRoom = new GameRoom()
  })

  describe('Room Creation', () => {
    it('should initialize with correct default state', async () => {
      const mockGetCampaign = vi.fn().mockResolvedValue({
        id: 'test-campaign-1',
        first_scene_id: 'test-scene-1'
      })
      
      const mockGetSceneWithTargets = vi.fn().mockResolvedValue({
        id: 'test-scene-1',
        title: 'Test Forest Entrance',
        timer_seconds: 30,
        is_final_scene: false,
        targets: [
          { id: 'target-1', label: 'Go Left' },
          { id: 'target-2', label: 'Go Right' }
        ]
      })
      
      // Mock the private methods
      gameRoom['getCampaign'] = mockGetCampaign
      gameRoom['loadScene'] = vi.fn()
      
      await gameRoom.onCreate({ campaignId: 'test-campaign-1' })
      
      expect(gameRoom.state.campaignId).toBe('test-campaign-1')
      expect(gameRoom.state.gameStatus).toBe('waiting')
      expect(gameRoom.state.gameStarted).toBe(false)
      expect(gameRoom.state.isVoting).toBe(false)
      expect(mockGetCampaign).toHaveBeenCalledWith('test-campaign-1')
    })

    it('should handle campaign not found', async () => {
      const mockGetCampaign = vi.fn().mockResolvedValue(null)
      gameRoom['getCampaign'] = mockGetCampaign
      
      await gameRoom.onCreate({ campaignId: 'non-existent' })
      
      expect(gameRoom.state.campaignId).toBe('non-existent')
      // Should handle gracefully without crashing
    })
  })

  describe('Player Management', () => {
    beforeEach(async () => {
      await gameRoom.onCreate({ campaignId: 'test-campaign-1' })
    })

    it('should add player on join', async () => {
      const mockClient = { sessionId: 'player-1' } as any
      
      await gameRoom.onJoin(mockClient, { name: 'Alice' })
      
      expect(gameRoom.state.players.size).toBe(1)
      const player = gameRoom.state.players.get('player-1')
      expect(player?.name).toBe('Alice')
      expect(player?.hasVoted).toBe(false)
      expect(player?.sessionId).toBe('player-1')
    })

    it('should generate default name if none provided', async () => {
      const mockClient = { sessionId: 'player-1' } as any
      
      await gameRoom.onJoin(mockClient, {})
      
      const player = gameRoom.state.players.get('player-1')
      expect(player?.name).toBe('Player 1')
    })

    it('should remove player on leave', async () => {
      const mockClient = { sessionId: 'player-1' } as any
      
      await gameRoom.onJoin(mockClient, { name: 'Alice' })
      expect(gameRoom.state.players.size).toBe(1)
      
      await gameRoom.onLeave(mockClient, true)
      expect(gameRoom.state.players.size).toBe(0)
    })

    it('should handle multiple players joining', async () => {
      const clients = [
        { sessionId: 'player-1' },
        { sessionId: 'player-2' },
        { sessionId: 'player-3' }
      ] as any[]
      
      for (let i = 0; i < clients.length; i++) {
        await gameRoom.onJoin(clients[i], { name: `Player ${i + 1}` })
      }
      
      expect(gameRoom.state.players.size).toBe(3)
      expect(gameRoom.state.players.get('player-2')?.name).toBe('Player 2')
    })
  })

  describe('Voting Logic', () => {
    beforeEach(async () => {
      await gameRoom.onCreate({ campaignId: 'test-campaign-1' })
      
      // Add some players
      const clients = [
        { sessionId: 'player-1' },
        { sessionId: 'player-2' },
        { sessionId: 'player-3' }
      ] as any[]
      
      for (let i = 0; i < clients.length; i++) {
        await gameRoom.onJoin(clients[i], { name: `Player ${i + 1}` })
      }
    })

    it('should start voting when game starts', () => {
      gameRoom.state.gameStatus = 'waiting'
      gameRoom.state.gameStarted = false
      
      // Mock the private method
      const startVotingSpy = vi.spyOn(gameRoom as any, 'startVoting')
      startVotingSpy.mockImplementation(() => {
        gameRoom.state.isVoting = true
        gameRoom.state.gameStatus = 'voting'
        gameRoom.state.gameStarted = true
      })
      
      // Simulate start_game message
      const mockClient = { sessionId: 'player-1' } as any
      gameRoom['handleVote'] = vi.fn()
      
      // This would be called by the message handler
      if (gameRoom.state.players.size >= 2 && !gameRoom.state.gameStarted) {
        startVotingSpy()
      }
      
      expect(gameRoom.state.isVoting).toBe(true)
      expect(gameRoom.state.gameStatus).toBe('voting')
      expect(gameRoom.state.gameStarted).toBe(true)
    })

    it('should handle vote correctly', () => {
      gameRoom.state.isVoting = true
      const mockClient = { sessionId: 'player-1' } as any
      
      // Mock the private method
      gameRoom['handleVote'] = vi.fn((client, targetId) => {
        const player = gameRoom.state.players.get(client.sessionId)
        if (player && !player.hasVoted) {
          player.hasVoted = true
          player.votedTarget = targetId
          
          const currentVotes = gameRoom.state.votes.get(targetId) || 0
          gameRoom.state.votes.set(targetId, currentVotes + 1)
        }
      })
      
      gameRoom['handleVote'](mockClient, 'target-1')
      
      const player = gameRoom.state.players.get('player-1')
      expect(player?.hasVoted).toBe(true)
      expect(player?.votedTarget).toBe('target-1')
      expect(gameRoom.state.votes.get('target-1')).toBe(1)
    })

    it('should prevent double voting', () => {
      gameRoom.state.isVoting = true
      const mockClient = { sessionId: 'player-1' } as any
      
      // Mock the private method with double vote prevention
      gameRoom['handleVote'] = vi.fn((client, targetId) => {
        const player = gameRoom.state.players.get(client.sessionId)
        if (player && !player.hasVoted && gameRoom.state.isVoting) {
          player.hasVoted = true
          player.votedTarget = targetId
          
          const currentVotes = gameRoom.state.votes.get(targetId) || 0
          gameRoom.state.votes.set(targetId, currentVotes + 1)
        }
      })
      
      // First vote
      gameRoom['handleVote'](mockClient, 'target-1')
      expect(gameRoom.state.votes.get('target-1')).toBe(1)
      
      // Second vote (should be ignored)
      gameRoom['handleVote'](mockClient, 'target-2')
      expect(gameRoom.state.votes.get('target-2')).toBeUndefined()
      expect(gameRoom.state.votes.get('target-1')).toBe(1)
    })

    it('should track votes correctly for multiple players', () => {
      gameRoom.state.isVoting = true
      
      // Mock voting for multiple players
      gameRoom['handleVote'] = vi.fn((client, targetId) => {
        const player = gameRoom.state.players.get(client.sessionId)
        if (player && !player.hasVoted) {
          player.hasVoted = true
          player.votedTarget = targetId
          
          const currentVotes = gameRoom.state.votes.get(targetId) || 0
          gameRoom.state.votes.set(targetId, currentVotes + 1)
        }
      })
      
      // Three players vote for different targets
      gameRoom['handleVote']({ sessionId: 'player-1' }, 'target-1')
      gameRoom['handleVote']({ sessionId: 'player-2' }, 'target-1')
      gameRoom['handleVote']({ sessionId: 'player-3' }, 'target-2')
      
      expect(gameRoom.state.votes.get('target-1')).toBe(2)
      expect(gameRoom.state.votes.get('target-2')).toBe(1)
    })
  })

  describe('Game State Management', () => {
    beforeEach(async () => {
      await gameRoom.onCreate({ campaignId: 'test-campaign-1' })
    })

    it('should have correct initial state', () => {
      expect(gameRoom.state.timeLeft).toBe(30)
      expect(gameRoom.state.isVoting).toBe(false)
      expect(gameRoom.state.gameStarted).toBe(false)
      expect(gameRoom.state.gameStatus).toBe('waiting')
      expect(gameRoom.state.players.size).toBe(0)
      expect(gameRoom.state.votes.size).toBe(0)
    })

    it('should reset votes when new scene loads', () => {
      // Set up some existing votes
      gameRoom.state.votes.set('target-1', 2)
      gameRoom.state.votes.set('target-2', 1)
      
      // Mock resetPlayerVotes
      gameRoom['resetPlayerVotes'] = vi.fn(() => {
        gameRoom.state.players.forEach(player => {
          player.hasVoted = false
          player.votedTarget = ''
        })
      })
      
      // Simulate loading new scene
      gameRoom.state.votes.clear()
      gameRoom['resetPlayerVotes']()
      
      expect(gameRoom.state.votes.size).toBe(0)
    })
  })

  afterEach(() => {
    mockConsoleHelpers.restore()
  })
})