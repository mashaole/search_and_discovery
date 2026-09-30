<script lang="ts">
  interface Props {
    offset: number;
    limit: number;
    total: number;
    onPage: (delta: number) => void;
    onLimit: (limit: number) => void;
  }

  let { offset, limit, total, onPage, onLimit }: Props = $props();

  const start = $derived(total === 0 ? 0 : offset + 1);
  const end = $derived(Math.min(offset + limit, total));
  const canPrev = $derived(offset > 0);
  const canNext = $derived(offset + limit < total);

  function handleLimit(event: Event): void {
    const target = event.currentTarget as HTMLSelectElement;
    onLimit(Number.parseInt(target.value, 10));
  }
</script>

<div class="pager">
  <p aria-live="polite">{start}–{end} of {total}</p>
  <div class="actions">
    <label>
      Page size
      <select value={String(limit)} onchange={handleLimit}>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="40">40</option>
      </select>
    </label>
    <button type="button" disabled={!canPrev} onclick={() => onPage(-1)}>
      Previous
    </button>
    <button type="button" disabled={!canNext} onclick={() => onPage(1)}>
      Next
    </button>
  </div>
</div>

<style>
  .pager {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .pager p {
    margin: 0;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    align-items: center;
  }

  .actions label {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }

  button,
  select {
    min-height: 2.75rem;
    padding: 0.45rem 0.7rem;
    border: 1px solid #8a8378;
    border-radius: 4px;
    background: #fff;
  }

  button:disabled {
    opacity: 0.5;
  }

  @media (min-width: 640px) {
    .pager {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      width: auto;
    }

    .actions label {
      grid-column: auto;
    }
  }
</style>
