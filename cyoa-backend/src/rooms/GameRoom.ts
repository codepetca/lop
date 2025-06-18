import { Room, Client } from '@colyseus/core'
import { GameRoomState, Player } from '../schema/GameState'
import { getSceneWithTargets } from '../database/queries'

export class GameRoom extends Room<GameRoomState> {
  maxClients = 30
  private votingTimer?: NodeJS.Timeout

  async onCreate(options: { campaignId: string }) {
    console.log('🎮 GameRoom onCreate with campaignId:', options.campaignId)
    this.setState(new GameRoomState())
    this.autoDispose = true
    
    this.state.campaignId = options.campaignId
    
    // Load initial scene
    console.log('📋 Getting campaign...')
    const campaign = await this.getCampaign(options.campaignId)
    console.log('📋 Campaign found:', !!campaign, campaign?.first_scene_id)
    if (campaign?.first_scene_id) {
      console.log('🎬 Loading initial scene:', campaign.first_scene_id)
      await this.loadScene(campaign.first_scene_id)
    } else {
      console.error('❌ No first_scene_id found for campaign')
    }

    // Handle messages
    this.onMessage('vote', (client, message: { targetId: string }) => {
      this.handleVote(client, message.targetId)
    })

    this.onMessage('start_game', (client) => {
      if (this.state.players.size >= 2 && !this.state.gameStarted) {
        this.startVoting()
      }
    })
  }

  async onJoin(client: Client, options: { name?: string }) {
    console.log('👤 Player joining:', client.sessionId, options.name)
    const player = new Player()
    player.sessionId = client.sessionId
    player.name = options.name || `Player ${this.state.players.size + 1}`
    player.hasVoted = false
    
    this.state.players.set(client.sessionId, player)
    
    console.log(`✅ ${player.name} joined game room (${this.state.players.size} total players)`)
    console.log('🎬 Current scene ID:', this.state.currentSceneId)
    console.log('🎮 Game status:', this.state.gameStatus)
    
    // Send current scene to the newly joined player
    if (this.state.currentSceneId) {
      console.log('📤 Sending current scene to new player:', this.state.currentSceneId)
      this.sendSceneToClient(client, this.state.currentSceneId)
    }
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId)
    if (player) {
      console.log(`${player.name} left game room`)
      this.state.players.delete(client.sessionId)
      
      // If player had voted, remove their vote
      if (player.hasVoted && player.votedTarget) {
        const currentVotes = this.state.votes.get(player.votedTarget) || 0
        if (currentVotes > 0) {
          this.state.votes.set(player.votedTarget, currentVotes - 1)
        }
      }
      
      // Check if all remaining players have voted
      this.checkAllVoted()
    }
  }

  onDispose() {
    if (this.votingTimer) {
      clearTimeout(this.votingTimer)
    }
  }

  private async getCampaign(campaignId: string) {
    try {
      const { getCampaign } = await import('../database/queries')
      return await getCampaign(campaignId)
    } catch (error) {
      console.error('Error fetching campaign:', error)
      return null
    }
  }

  private async loadScene(sceneId: string) {
    try {
      console.log('🎬 loadScene called with:', sceneId)
      const scene = await getSceneWithTargets(sceneId)
      console.log('🎬 Scene query result:', !!scene, scene?.title)
      if (!scene) {
        console.error('❌ Scene not found:', sceneId)
        return
      }

      console.log('🎬 Setting scene state...')
      this.state.currentSceneId = sceneId
      this.state.timeLeft = scene.timer_seconds
      this.state.gameStatus = scene.is_final_scene ? 'ended' : 'waiting'
      
      // Reset votes
      this.state.votes.clear()
      this.resetPlayerVotes()
      
      const sceneData = {
        scene: {
          id: scene.id,
          title: scene.title,
          image_url: scene.image_url,
          timer_seconds: scene.timer_seconds,
          is_final_scene: scene.is_final_scene,
          targets: scene.targets
        }
      }
      
      console.log('📡 Broadcasting scene_loaded:', sceneData.scene.title, 'with', sceneData.scene.targets.length, 'targets')
      this.broadcast('scene_loaded', sceneData)
      console.log('✅ Scene loaded successfully')
      
    } catch (error) {
      console.error('❌ Error loading scene:', error)
    }
  }

  private startVoting() {
    if (this.state.gameStatus === 'ended') return
    
    this.state.gameStarted = true
    this.state.isVoting = true
    this.state.gameStatus = 'voting'
    
    // Start countdown timer
    this.votingTimer = setInterval(() => {
      this.state.timeLeft -= 1
      
      if (this.state.timeLeft <= 0) {
        this.endVoting()
      }
    }, 1000)
  }

  private handleVote(client: Client, targetId: string) {
    if (!this.state.isVoting) return
    
    const player = this.state.players.get(client.sessionId)
    if (!player || player.hasVoted) return
    
    // Remove previous vote if exists
    if (player.votedTarget) {
      const prevVotes = this.state.votes.get(player.votedTarget) || 0
      if (prevVotes > 0) {
        this.state.votes.set(player.votedTarget, prevVotes - 1)
      }
    }
    
    // Add new vote
    const currentVotes = this.state.votes.get(targetId) || 0
    this.state.votes.set(targetId, currentVotes + 1)
    
    player.hasVoted = true
    player.votedTarget = targetId
    
    this.checkAllVoted()
  }

  private checkAllVoted() {
    const totalPlayers = this.state.players.size
    const votedPlayers = Array.from(this.state.players.values()).filter(p => p.hasVoted).length
    
    if (votedPlayers === totalPlayers && totalPlayers > 0) {
      this.endVoting()
    }
  }

  private async endVoting() {
    if (this.votingTimer) {
      clearTimeout(this.votingTimer)
      this.votingTimer = undefined
    }
    
    this.state.isVoting = false
    this.state.gameStatus = 'transitioning'
    
    // Find winning target
    let winningTarget = ''
    let maxVotes = 0
    
    this.state.votes.forEach((votes, targetId) => {
      if (votes > maxVotes) {
        maxVotes = votes
        winningTarget = targetId
      }
    })
    
    // Get next scene from winning target
    try {
      const scene = await getSceneWithTargets(this.state.currentSceneId)
      const target = scene?.targets.find(t => t.id === winningTarget)
      
      if (target?.next_scene_id) {
        // Transition to next scene after delay
        setTimeout(async () => {
          await this.loadScene(target.next_scene_id!)
          if (this.state.gameStatus !== 'ended') {
            this.startVoting()
          }
        }, 3000)
      } else {
        // Game ended
        this.state.gameStatus = 'ended'
      }
      
    } catch (error) {
      console.error('Error processing vote result:', error)
      this.state.gameStatus = 'ended'
    }
  }

  private resetPlayerVotes() {
    this.state.players.forEach(player => {
      player.hasVoted = false
      player.votedTarget = ''
    })
  }

  private async sendSceneToClient(client: Client, sceneId: string) {
    try {
      const scene = await getSceneWithTargets(sceneId)
      if (!scene) {
        console.error('❌ Scene not found for client:', sceneId)
        return
      }

      const sceneData = {
        scene: {
          id: scene.id,
          title: scene.title,
          image_url: scene.image_url,
          timer_seconds: scene.timer_seconds,
          is_final_scene: scene.is_final_scene,
          targets: scene.targets
        }
      }
      
      console.log('📤 Sending scene to client:', sceneData.scene.title)
      client.send('scene_loaded', sceneData)
      
    } catch (error) {
      console.error('❌ Error sending scene to client:', error)
    }
  }
}