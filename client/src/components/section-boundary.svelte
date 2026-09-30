<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<svelte:boundary>
  {@render children()}
  {#snippet failed(_error, reset)}
    <div class="fallback" role="alert">
      <p>This section could not be shown.</p>
      <button type="button" onclick={reset}>Retry</button>
    </div>
  {/snippet}
</svelte:boundary>

<style>
  .fallback {
    padding: 0.75rem;
    border: 1px solid #c9c2b6;
    background: #fff;
  }
</style>
