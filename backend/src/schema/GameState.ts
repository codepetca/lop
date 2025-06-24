import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema'

export class Target extends Schema {
  @type('string') id: string = ''
  @type('string') label: string = ''
  @type('number') x_percent: number = 0
  @type('number') y_percent: number = 0
  @type('number') width_percent: number = 0
  @type('number') height_percent: number = 0
  @type('string') next_scene_id: string = ''
}

export class Scene extends Schema {
  @type('string') id: string = ''
  @type('string') title: string = ''
  @type('string') image_url: string = ''
  @type('number') timer_seconds: number = 30
  @type('boolean') is_final_scene: boolean = false
  @type([Target]) targets = new ArraySchema<Target>()
}

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
  @type(Scene) currentScene = new Scene()
  @type({ map: Player }) players = new MapSchema<Player>()
  @type({ map: 'number' }) votes = new MapSchema<number>() // targetId -> vote count
}