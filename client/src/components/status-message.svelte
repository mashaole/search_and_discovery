<script lang="ts">
  import type { ListStatus } from "../lib/search-state.svelte";

  interface Props {
    status: ListStatus;
    message: string;
    isBrowsing: boolean;
    categoryName: string;
    onRetry: () => void;
  }

  let {
    status,
    message,
    isBrowsing,
    categoryName,
    onRetry,
  }: Props = $props();
</script>

<div class="status" role="status" aria-live="polite">
  {#if status === "idle"}
    <p>Type a search of at least 2 letters or numbers, then search.</p>
  {:else if status === "loading"}
    <p>Loading results…</p>
  {:else if status === "empty"}
    <p>No products match this search.</p>
  {:else if status === "results" && isBrowsing}
    <p>
      {categoryName
        ? `Showing ${categoryName}.`
        : "Showing products across all categories."}
    </p>
  {:else if status === "timeout" || status === "error"}
    <p>{message}</p>
    <button type="button" onclick={onRetry}>Retry</button>
  {/if}
</div>

<style>
  .status:empty {
    display: none;
  }

  .status {
    padding: 0.75rem 0 0;
  }

  p {
    margin: 0 0 0.5rem;
  }

  button {
    min-height: 2.75rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid #1f4b3a;
    background: #1f4b3a;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
