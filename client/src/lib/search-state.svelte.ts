import {
  DEFAULT_LIMIT,
  DEFAULT_SEARCH_FIELDS,
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  QUERY_PATTERN,
  SEARCH_TIMEOUT_MS,
  type Category,
  type SearchResult,
  type SortOption,
  type Suggestion,
} from "@search/shared";
import {
  ApiRequestError,
  fetchCategories,
  fetchSearch,
  fetchSuggest,
} from "./api";

export type ListStatus =
  | "idle"
  | "loading"
  | "results"
  | "empty"
  | "error"
  | "timeout";

const CARD_FIELDS = DEFAULT_SEARCH_FIELDS.join(",");

function isValidQuery(q: string): boolean {
  return (
    q.length >= MIN_QUERY_LENGTH &&
    q.length <= MAX_QUERY_LENGTH &&
    QUERY_PATTERN.test(q)
  );
}

export const searchState = $state({
  q: "",
  categoryId: "",
  sort: "popularity" as SortOption,
  limit: DEFAULT_LIMIT,
  offset: 0,
  categories: [] as Category[],
  suggestions: [] as Suggestion[],
  items: [] as SearchResult[],
  total: 0,
  fields: [...DEFAULT_SEARCH_FIELDS] as string[],
  status: "idle" as ListStatus,
  errorMessage: "",
  isSuggesting: false,
});

let searchAbort: AbortController | undefined;
let suggestAbort: AbortController | undefined;
let suggestTimer: ReturnType<typeof setTimeout> | undefined;
let writingUrl = false;

function canFetchResults(): boolean {
  return searchState.q.length === 0 || isValidQuery(searchState.q);
}

export function handleQueryInput(value: string): void {
  searchState.q = value.slice(0, MAX_QUERY_LENGTH);
  searchState.offset = 0;
  writeUrl();
  if (searchState.q.length === 0) {
    searchState.suggestions = [];
    runSearch();
    return;
  }
  if (!isValidQuery(searchState.q)) {
    searchState.suggestions = [];
    return;
  }
  scheduleSuggest();
}

export function handleSubmit(): void {
  searchState.offset = 0;
  searchState.suggestions = [];
  writeUrl();
  if (canFetchResults()) {
    runSearch();
  }
}

export function handleCategoryChange(value: string): void {
  searchState.categoryId = value;
  searchState.offset = 0;
  writeUrl();
  if (canFetchResults()) {
    runSearch();
  }
}

export function handleSortChange(value: SortOption): void {
  searchState.sort = value;
  searchState.offset = 0;
  writeUrl();
  if (canFetchResults()) {
    runSearch();
  }
}

export function handleLimitChange(value: number): void {
  searchState.limit = value;
  searchState.offset = 0;
  writeUrl();
  if (canFetchResults()) {
    runSearch();
  }
}

export function handlePage(delta: number): void {
  const next = searchState.offset + delta * searchState.limit;
  if (next < 0) {
    return;
  }
  if (next >= searchState.total && searchState.total > 0) {
    return;
  }
  searchState.offset = next;
  writeUrl();
  runSearch();
}

export function handlePickSuggestion(name: string): void {
  searchState.q = name.slice(0, MAX_QUERY_LENGTH);
  searchState.suggestions = [];
  searchState.offset = 0;
  writeUrl();
  runSearch();
}

export function handleRetry(): void {
  if (canFetchResults()) {
    runSearch();
  }
}

export async function loadCategories(): Promise<void> {
  try {
    searchState.categories = await fetchCategories();
  } catch {
    searchState.categories = [];
  }
}

export function readUrl(): void {
  const params = new URLSearchParams(window.location.search);
  searchState.q = (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH);
  searchState.categoryId = params.get("categoryId") ?? "";
  const sort = params.get("sort");
  searchState.sort =
    sort === "price" || sort === "popularity" ? sort : "popularity";
  const limit = Number.parseInt(params.get("limit") ?? "", 10);
  searchState.limit =
    limit === 10 || limit === 20 || limit === 40 ? limit : DEFAULT_LIMIT;
  const offset = Number.parseInt(params.get("offset") ?? "", 10);
  searchState.offset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
  const fields = params.get("fields");
  searchState.fields = fields
    ? fields.split(",")
    : [...DEFAULT_SEARCH_FIELDS];
}

export function bindHistory(): void {
  window.addEventListener("popstate", () => {
    readUrl();
    if (canFetchResults()) {
      runSearch();
    } else {
      searchState.status = "idle";
      searchState.items = [];
    }
  });
}

function writeUrl(): void {
  if (writingUrl) {
    return;
  }
  const params = new URLSearchParams();
  if (searchState.q) {
    params.set("q", searchState.q);
  }
  if (searchState.categoryId) {
    params.set("categoryId", searchState.categoryId);
  }
  if (searchState.sort !== "popularity") {
    params.set("sort", searchState.sort);
  }
  if (searchState.limit !== DEFAULT_LIMIT) {
    params.set("limit", String(searchState.limit));
  }
  if (searchState.offset > 0) {
    params.set("offset", String(searchState.offset));
  }
  params.set("fields", CARD_FIELDS);
  const next = params.toString();
  const url = next ? `?${next}` : window.location.pathname;
  writingUrl = true;
  history.replaceState(null, "", url);
  writingUrl = false;
}

function scheduleSuggest(): void {
  if (suggestTimer) {
    clearTimeout(suggestTimer);
  }
  suggestTimer = setTimeout(() => {
    runSuggest();
  }, 200);
}

function runSuggest(): void {
  suggestAbort?.abort();
  if (!isValidQuery(searchState.q)) {
    searchState.suggestions = [];
    return;
  }
  suggestAbort = new AbortController();
  const q = searchState.q;
  fetchSuggest(q, suggestAbort.signal)
    .then((rows) => {
      if (searchState.q === q) {
        searchState.suggestions = rows;
      }
    })
    .catch((err: unknown) => {
      if (isAbort(err)) {
        return;
      }
      searchState.suggestions = [];
    });
}

function runSearch(): void {
  cancelSearch();
  if (!canFetchResults()) {
    return;
  }
  searchAbort = new AbortController();
  const timeout = setTimeout(() => {
    searchAbort?.abort("timeout");
  }, SEARCH_TIMEOUT_MS);
  searchState.status = "loading";
  searchState.errorMessage = "";
  const params = new URLSearchParams();
  if (searchState.q) {
    params.set("q", searchState.q);
  }
  if (searchState.categoryId) {
    params.set("categoryId", searchState.categoryId);
  }
  params.set("sort", searchState.sort);
  params.set("limit", String(searchState.limit));
  params.set("offset", String(searchState.offset));
  params.set("fields", CARD_FIELDS);
  fetchSearch(params, searchAbort.signal)
    .then((body) => {
      searchState.items = body.data?.items ?? [];
      searchState.total = body.meta?.total ?? 0;
      searchState.fields = body.meta?.fields ?? searchState.fields;
      searchState.status =
        searchState.items.length === 0 ? "empty" : "results";
    })
    .catch((err: unknown) => {
      if (isAbort(err)) {
        const reason = searchAbort?.signal.reason;
        if (reason === "timeout") {
          searchState.status = "timeout";
          searchState.errorMessage =
            "The search took too long. Try again.";
          searchState.items = [];
        }
        return;
      }
      searchState.status = "error";
      searchState.items = [];
      searchState.errorMessage =
        err instanceof ApiRequestError
          ? err.message
          : "Something went wrong. Try again.";
    })
    .finally(() => {
      clearTimeout(timeout);
    });
}

function cancelSearch(): void {
  searchAbort?.abort();
  searchAbort = undefined;
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export { isValidQuery, MAX_QUERY_LENGTH };
