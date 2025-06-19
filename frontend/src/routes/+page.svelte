<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { colyseusClient } from '$lib/colyseus'
  import { gameStore } from '$lib/stores/game.svelte'
  import Avatar from '$lib/components/Avatar.svelte'
  import type { Campaign, UserProfile } from '$lib/stores/colyseus'

  let campaigns = $state<Campaign[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let userProfile = $state<UserProfile | null>(null)
  let selectedCampaign = $state<string | null>(null)
  let joining = $state(false)

  onMount(async () => {
    try {
      // Create guest session first
      const authResponse = await colyseusClient.createGuestSession()
      userProfile = authResponse.user
      gameStore.setUserProfile(authResponse.user)
      
      // Then load campaigns
      campaigns = await colyseusClient.getCampaigns()
      gameStore.setCampaigns(campaigns)
    } catch (err) {
      error = 'Failed to load game. Please try again later.'
      console.error('Error during initialization:', err)
    } finally {
      loading = false
    }
  })

  async function joinCampaign(campaignId: string) {
    if (!userProfile) return

    joining = true
    error = null
    
    try {
      console.log('🎯 Joining campaign:', campaignId)
      console.log('👤 User profile:', $state.snapshot(userProfile))
      console.log('🏷️ Player name will be:', userProfile.displayName || userProfile.username)
      
      gameStore.setConnectionStatus('connecting')
      
      const room = await colyseusClient.joinRoom(campaignId, userProfile.displayName || userProfile.username)
      gameStore.setRoom(room)
      
      goto(`/game/${room.id}`)
    } catch (err) {
      error = 'Failed to join game. Please try again.'
      gameStore.setConnectionStatus('disconnected')
      console.error('Error joining game:', err)
    } finally {
      joining = false
    }
  }
</script>

<svelte:head>
  <title>Choose Your Own Adventure</title>
</svelte:head>

<div class="container">
  <header class="app-header">
    <div class="header-content">
      <h1>🎮 Lop Adventure</h1>
      {#if userProfile}
        <div class="header-profile">
          <Avatar 
            seed={userProfile.avatarSeed || userProfile.username} 
            size={32} 
            showName={true}
            name={userProfile.displayName ?? userProfile.username}
            nickname={userProfile.nickname ?? undefined}
            class="responsive-avatar"
          />
        </div>
      {/if}
    </div>
  </header>

  {#if loading}
    <div class="loading">
      Loading campaigns...
    </div>
  {:else if error}
    <div class="error">
      {error}
    </div>
  {:else}
    {#if campaigns.length === 0}
      <div class="no-campaigns">
        <div class="card">
          <p>No campaigns available. Please check back later!</p>
        </div>
      </div>
    {:else}
      <div class="campaigns-section">
        <div class="campaigns-grid">
          {#each campaigns as campaign (campaign.id)}
            <button
              class="campaign-card card"
              onclick={() => joinCampaign(campaign.id)}
              disabled={joining}
            >
              <h3>{campaign.title}</h3>
              {#if campaign.description}
                <p>{campaign.description}</p>
              {/if}
              {#if joining}
                <div class="joining-indicator">Joining...</div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="how-to-play">
      <div class="card">
        <h2>How to Play</h2>
        <ol>
          <li>Click on a campaign to join instantly</li>
          <li>Wait for other players to join (2-30 players)</li>
          <li>View the story scene and click on targets to vote</li>
          <li>The choice with the most votes wins</li>
          <li>Continue through the story until the end</li>
        </ol>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 100vw;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .app-header {
    margin-bottom: clamp(20px, 5vw, 40px);
    width: 100%;
    box-sizing: border-box;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: clamp(8px, 2vw, 20px);
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .app-header h1 {
    font-size: clamp(1.5rem, 4vw, 3rem);
    margin: 0;
    background: linear-gradient(45deg, #4CAF50, #2196F3);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    min-width: 0;
    flex-shrink: 1;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .header-profile {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    min-width: 0;
    max-width: 50vw; /* Ensure profile never takes more than half screen */
  }

  .header-profile :global(.responsive-avatar) {
    max-width: 100%;
    overflow: hidden;
  }

  .header-profile :global(.avatar-name) {
    font-size: clamp(0.8rem, 1.5vw, 1rem);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 20vw;
  }

  .campaigns-section {
    margin: 24px 0 40px 0;
  }

  .campaigns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .campaign-card {
    position: relative;
    text-align: left;
    transition: all 0.2s ease;
    color: white;
    cursor: pointer;
  }

  .campaign-card:hover:not(:disabled) {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.1);
    transform: translateY(-2px);
  }

  .campaign-card:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .campaign-card h3 {
    margin-bottom: 12px;
    font-size: 1.3rem;
    color: #4CAF50;
  }

  .campaign-card p {
    margin: 0;
    opacity: 0.8;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .joining-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: #4CAF50;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .no-campaigns {
    text-align: center;
    padding: 40px;
    opacity: 0.7;
  }

  .how-to-play ol {
    padding-left: 20px;
  }

  .how-to-play li {
    margin-bottom: 8px;
    line-height: 1.5;
  }


  /* Force stacking when space is very tight */
  @media (max-width: 600px) {
    .header-content {
      flex-direction: column;
      text-align: center;
      justify-content: center;
    }
    
    .header-profile {
      max-width: 80vw;
    }
    
    .campaigns-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Additional breakpoint for very tight spaces (high zoom) */
  @media (max-width: 400px) {
    .header-profile {
      max-width: 90vw;
    }
    
    .header-profile :global(.avatar-name) {
      max-width: 30vw;
    }
  }
</style>