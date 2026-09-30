<script lang="ts">
  import { onMount } from "svelte";
  import {
    MAX_QUERY_LENGTH,
    bindHistory,
    handleCategoryChange,
    handleLimitChange,
    handlePage,
    handlePickSuggestion,
    handleQueryInput,
    handleRetry,
    handleSortChange,
    handleSubmit,
    loadCategories,
    readUrl,
    searchState,
  } from "./lib/search-state.svelte";
  import SectionBoundary from "./components/section-boundary.svelte";
  import TextField from "./components/text-field.svelte";
  import Select from "./components/select.svelte";
  import SuggestionList from "./components/suggestion-list.svelte";
  import ResultCard from "./components/result-card.svelte";
  import PageControls from "./components/page-controls.svelte";
  import StatusMessage from "./components/status-message.svelte";
  import type { SortOption } from "@search/shared";

  onMount(() => {
    readUrl();
    bindHistory();
    void loadCategories();
    handleSubmit();
  });

  const remaining = $derived(
    MAX_QUERY_LENGTH - searchState.q.length,
  );

  const categoryOptions = $derived([
    { value: "", label: "All categories" },
    ...searchState.categories.map((row) => ({
      value: row.id,
      label: row.name,
    })),
  ]);

  const sortOptions = [
    { value: "popularity", label: "Popularity" },
    { value: "price", label: "Price" },
  ];

  function handleSort(value: string): void {
    handleSortChange(value as SortOption);
  }
</script>

<main>
  <h1>Search and discovery</h1>
  <p class="lead">
    Find catalog products and see price, stock, and delivery.
  </p>

  <form
    class="controls"
    onsubmit={(event) => {
      event.preventDefault();
      handleSubmit();
    }}
  >
    <SectionBoundary>
      <TextField
        id="q"
        label="Search"
        value={searchState.q}
        maxlength={MAX_QUERY_LENGTH}
        remaining={remaining}
        onInput={handleQueryInput}
        onSubmit={handleSubmit}
      />
    </SectionBoundary>
    <SectionBoundary>
      <Select
        id="category"
        label="Category"
        value={searchState.categoryId}
        options={categoryOptions}
        onChange={handleCategoryChange}
      />
    </SectionBoundary>
    <SectionBoundary>
      <Select
        id="sort"
        label="Sort"
        value={searchState.sort}
        options={sortOptions}
        onChange={handleSort}
      />
    </SectionBoundary>
    <button type="submit">Search</button>
  </form>

  <SectionBoundary>
    <SuggestionList
      items={searchState.suggestions}
      onPick={handlePickSuggestion}
    />
  </SectionBoundary>

  <SectionBoundary>
    <StatusMessage
      status={searchState.status}
      message={searchState.errorMessage}
      isBrowsing={searchState.q.length === 0}
      categoryName={
        searchState.categories.find(
          (row) => row.id === searchState.categoryId,
        )?.name ?? ""
      }
      onRetry={handleRetry}
    />
  </SectionBoundary>

  {#if searchState.status === "results"}
    <SectionBoundary>
      <PageControls
        offset={searchState.offset}
        limit={searchState.limit}
        total={searchState.total}
        onPage={handlePage}
        onLimit={handleLimitChange}
      />
    </SectionBoundary>
    <ul class="grid">
      {#each searchState.items as item (item.id)}
        <li>
          <SectionBoundary>
            <ResultCard {item} />
          </SectionBoundary>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  main {
    width: min(72rem, 100%);
    margin: 0 auto;
    padding: 1rem 0.85rem 2.5rem;
  }

  h1 {
    margin: 0 0 0.35rem;
    font-size: clamp(1.35rem, 4vw, 1.85rem);
  }

  .lead {
    margin: 0 0 1rem;
    color: #3d3d3d;
  }

  .controls {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    align-items: end;
  }

  button[type="submit"] {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.6rem 1rem;
    border: 1px solid #1f4b3a;
    background: #1f4b3a;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
  }

  .grid {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: 1fr;
  }

  .grid li {
    min-width: 0;
  }

  @media (min-width: 640px) {
    main {
      padding: 1.25rem 1.25rem 3rem;
    }

    .controls {
      grid-template-columns: minmax(0, 1fr) minmax(8rem, 10rem)
        minmax(8rem, 10rem) auto;
    }

    button[type="submit"] {
      width: auto;
    }

    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (min-width: 960px) {
    .grid {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
</style>
