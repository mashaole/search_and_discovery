<script lang="ts">
  import type { Suggestion } from "@search/shared";

  interface Props {
    items: Suggestion[];
    onPick: (name: string) => void;
  }

  let { items, onPick }: Props = $props();
</script>

{#if items.length > 0}
  <ul class="list" role="listbox">
    {#each items as item (item.id)}
      <li>
        <button type="button" onclick={() => onPick(item.name)}>
          {item.name}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .list {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0;
    border: 1px solid #c9c2b6;
    background: #fff;
  }

  button {
    width: 100%;
    text-align: left;
    padding: 0.55rem 0.75rem;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  button:hover,
  button:focus-visible {
    background: #efe9df;
  }
</style>
