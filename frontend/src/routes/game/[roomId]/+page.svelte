<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { onMount, onDestroy } from 'svelte'
  import GameScene from '$lib/components/GameScene.svelte'
  import { gameStore } from '$lib/stores/game.svelte'

  let roomId = $derived($page.params.roomId)
  let isConnected = $derived(gameStore.isConnected)
  let error = $derived(gameStore.error)
  let connectionStatus = $derived(gameStore.connectionStatus)

  onMount(() => {
    if (!isConnected) {
      goto('/')
    }
  })

  onDestroy(() => {
    if (isConnected) {
      gameStore.disconnect()
    }
  })

  function goHome() {
    gameStore.disconnect()
    goto('/')
  }
</script>

<svelte:head>
  <title>Game Room {roomId} - Choose Your Own Adventure</title>
</svelte:head>

{#if error}
  <div class="error-container">
    <div class="card">
      <h2>Connection Error</h2>
      <p>{error}</p>
      <button class="btn-primary" onclick={goHome}>
        Return Home
      </button>
    </div>
  </div>
{:else if connectionStatus === 'connecting'}
  <div class="connecting-container">
    <div class="card">
      <h2>Connecting to Game...</h2>
      <div class="loading-spinner"></div>
    </div>
  </div>
{:else if !isConnected}
  <div class="disconnected-container">
    <div class="card">
      <h2>Not Connected</h2>
      <p>You need to join a game from the home page.</p>
      <button class="btn-primary" onclick={goHome}>
        Go Home
      </button>
    </div>
  </div>
{:else}
  <GameScene />
{/if}

<style>
  .error-container,
  .connecting-container,
  .disconnected-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
    padding: 20px;
  }

  .card {
    text-align: center;
    max-width: 400px;
    width: 100%;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-left: 4px solid #4CAF50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 20px auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>