import { vi } from 'vitest'

// Mock Colyseus Client for frontend tests
export class MockColyseusClient {
  private rooms = new Map()
  
  async joinOrCreate(roomName: string, options: any) {
    const roomId = `mock-room-${Date.now()}`
    const room = new MockRoom(roomId, roomName, options)
    this.rooms.set(roomId, room)
    return room
  }
  
  async join(roomName: string, options: any) {
    return this.joinOrCreate(roomName, options)
  }
  
  async create(roomName: string, options: any) {
    return this.joinOrCreate(roomName, options)
  }
}

export class MockRoom {
  id: string
  name: string
  sessionId: string = `session-${Date.now()}`
  state: any = {}
  
  private messageHandlers = new Map<string, Function[]>()
  private stateChangeHandlers: Function[] = []
  private errorHandlers: Function[] = []
  private leaveHandlers: Function[] = []
  
  constructor(id: string, name: string, options: any) {
    this.id = id
    this.name = name
    
    // Initialize with mock game state
    this.state = {
      currentSceneId: '',
      campaignId: options.campaignId || '',
      timeLeft: 30,
      isVoting: false,
      gameStarted: false,
      gameStatus: 'waiting',
      players: new Map(),
      votes: new Map()
    }
  }
  
  send(messageType: string, data?: any) {
    // Mock sending message to server
    console.log(`[MockRoom] Sending ${messageType}:`, data)
    
    // Simulate server responses for specific messages
    if (messageType === 'vote') {
      this.simulateVoteResponse(data)
    } else if (messageType === 'start_game') {
      this.simulateGameStart()
    }
  }
  
  onMessage(messageType: string, handler: Function) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType)!.push(handler)
  }
  
  onStateChange(handler: Function) {
    this.stateChangeHandlers.push(handler)
  }
  
  onError(handler: Function) {
    this.errorHandlers.push(handler)
  }
  
  onLeave(handler: Function) {
    this.leaveHandlers.push(handler)
  }
  
  leave() {
    this.leaveHandlers.forEach(handler => handler(0))
  }
  
  // Simulate receiving messages from server
  simulateMessage(messageType: string, data: any) {
    const handlers = this.messageHandlers.get(messageType) || []
    handlers.forEach(handler => handler(data))
  }
  
  simulateStateChange(newState: any) {
    this.state = { ...this.state, ...newState }
    this.stateChangeHandlers.forEach(handler => handler(this.state))
  }
  
  simulateError(code: number, message: string) {
    this.errorHandlers.forEach(handler => handler(code, message))
  }
  
  // Helper methods for common test scenarios
  simulateSceneLoaded(scene: any) {
    this.simulateMessage('scene_loaded', { scene })
  }
  
  simulateVoteResponse(voteData: any) {
    // Simulate vote being processed
    setTimeout(() => {
      this.simulateStateChange({
        votes: new Map([[voteData.targetId, 1]])
      })
    }, 10)
  }
  
  simulateGameStart() {
    this.simulateStateChange({
      gameStarted: true,
      isVoting: true,
      gameStatus: 'voting'
    })
  }
}

// Mock the entire colyseus.js module
export const mockColyseusClient = new MockColyseusClient()

export const colyseusClientMock = {
  Client: vi.fn(() => mockColyseusClient),
  Room: vi.fn(() => new MockRoom('test', 'test', {}))
}