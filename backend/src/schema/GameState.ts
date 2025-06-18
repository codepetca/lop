import { Schema, type, MapSchema } from '@colyseus/schema'

export class Player extends Schema {
  @type('string') sessionId: string = ''
  @type('string') name: string = ''
  @type('boolean') hasVoted: boolean = false
  @type('string') votedTarget: string = ''
}

export class GameRoomState extends Schema {
  @type('string') currentSceneId: string = ''
  @type('string') campaignId: string = ''
  @type('number') timeLeft: number = 30
  @type('boolean') isVoting: boolean = false
  @type('boolean') gameStarted: boolean = false
  @type('string') gameStatus: string = 'waiting' // waiting, voting, transitioning, ended
  @type({ map: Player }) players = new MapSchema<Player>()
  @type({ map: 'number' }) votes = new MapSchema<number>() // targetId -> vote count
}