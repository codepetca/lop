<script lang="ts">
	let { src, children }: { src?: string; children: any } = $props();
</script>

<div class="background-scene" style:background-image={src ? `url(${src})` : undefined}>
	{@render children()}
</div>

<style>
	.background-scene {
		position: relative;
		width: 100%;
		min-height: 400px;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	/* Fallback background for scenes without images */
	.background-scene:not([style*="background-image"]) {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
</style>