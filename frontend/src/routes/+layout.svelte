<script>
  import '../app.css'
</script>

<main>
  <slot />
</main>

<style>
  :global(html) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: #1a1a1a;
  }

  main {
    min-height: 100vh;
  }
</style>