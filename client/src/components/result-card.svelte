<script lang="ts">
  import type { SearchResult } from "@search/shared";

  interface Props {
    item: SearchResult;
  }

  let { item }: Props = $props();

  const priceText = $derived.by(() => {
    if (item.enrichment === "failed" || item.priceCents == null) {
      return "Price unavailable";
    }
    return `R ${(item.priceCents / 100).toFixed(2)}`;
  });

  const availability = $derived(
    item.available === true
      ? "In stock"
      : item.available === false
        ? "Out of stock"
        : "Availability unknown",
  );
</script>

<article class="card">
  <h2>{item.name}</h2>
  <p class="meta">{item.categoryName}</p>
  <p class="price">{priceText}</p>
  <p>{availability}</p>
  {#if item.deliveryEstimate}
    <p>Delivery {item.deliveryEstimate}</p>
  {/if}
</article>

<style>
  .card {
    background: #fff;
    border: 1px solid #d7d0c5;
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    height: 100%;
  }

  h2 {
    margin: 0;
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }

  .meta,
  .price,
  p {
    margin: 0;
    font-size: 0.95rem;
  }

  .price {
    font-weight: 600;
  }
</style>
