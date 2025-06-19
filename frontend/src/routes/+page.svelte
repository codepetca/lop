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

  async function joinGame() {
    if (!selectedCampaign || !userProfile) return

    joining = true
    error = null
    
    try {
      gameStore.setConnectionStatus('connecting')
      
      const room = await colyseusClient.joinRoom(selectedCampaign, userProfile.displayName || userProfile.username)
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

  function selectCampaign(campaignId: string) {
    selectedCampaign = campaignId
  }
</script>

<svelte:head>
  <title>Choose Your Own Adventure</title>
</svelte:head>

<div class="container">
  <header class="app-header">
    <h1>🎮 Lop Adventure</h1>
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
    <div class="join-game-section">
      <div class="card">
        
        {#if userProfile}
          <div class="profile-display">
            <h3>Your Player Profile</h3>
            <div class="profile-info">
              <Avatar 
                seed={userProfile.avatarSeed || userProfile.username} 
                size={60} 
                showName={true}
                name={userProfile.displayName ?? userProfile.username}
                nickname={userProfile.nickname ?? undefined}
              />
            </div>
          </div>
        {/if}

        {#if campaigns.length === 0}
          <div class="no-campaigns">
            <p>No campaigns available. Please check back later!</p>
          </div>
        {:else}
          <div class="campaigns-section">
            <div class="campaigns-grid">
              {#each campaigns as campaign (campaign.id)}
                <button
                  class="campaign-card"
                  class:selected={selectedCampaign === campaign.id}
                  onclick={() => selectCampaign(campaign.id)}
                  disabled={joining}
                >
                  <h4>{campaign.title}</h4>
                  {#if campaign.description}
                    <p>{campaign.description}</p>
                  {/if}
                </button>
              {/each}
            </div>
          </div>

          <div class="join-section">
            <button
              class="btn-primary join-button"
              onclick={joinGame}
              disabled={!selectedCampaign || !userProfile || joining}
            >
              {#if joining}
                Joining Game...
              {:else}
                Join Game
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>

    <div class="how-to-play">
      <div class="card">
        <h2>How to Play</h2>
        <ol>
          <li>Select a campaign to join</li>
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
  .app-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .app-header h1 {
    font-size: 3rem;
    margin-bottom: 16px;
    background: linear-gradient(45deg, #4CAF50, #2196F3);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .app-header p {
    font-size: 1.2rem;
    opacity: 0.8;
  }

  .join-game-section {
    margin-bottom: 40px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .form-group input {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
    border-radius: 6px;
    border: 1px solid #444;
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .form-group input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .campaigns-section {
    margin: 24px 0;
  }

  .campaigns-section h3 {
    margin-bottom: 16px;
  }

  .campaigns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .campaign-card {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    text-align: left;
    transition: all 0.2s ease;
    color: white;
  }

  .campaign-card:hover:not(:disabled) {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.1);
  }

  .campaign-card.selected {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
  }

  .campaign-card h4 {
    margin-bottom: 8px;
    font-size: 1.2rem;
  }

  .campaign-card p {
    margin: 0;
    opacity: 0.8;
    font-size: 0.9rem;
  }

  .join-section {
    text-align: center;
  }

  .join-button {
    font-size: 1.1rem;
    padding: 16px 32px;
    min-width: 150px;
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

  .profile-display {
    margin-bottom: 24px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .profile-display h3 {
    margin-bottom: 16px;
    color: white;
    text-align: center;
  }

  .profile-info {
    display: flex;
    justify-content: center;
  }

  @media (max-width: 768px) {
    .app-header h1 {
      font-size: 2rem;
    }
    
    .campaigns-grid {
      grid-template-columns: 1fr;
    }
  }
</style>