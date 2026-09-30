import type {
  ApiEnvelope,
  Category,
  SearchPage,
  Suggestion,
} from "@search/shared";
import { SEARCH_TIMEOUT_MS } from "@search/shared";

export class ApiRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function fetchSearch(
  params: URLSearchParams,
  signal: AbortSignal,
): Promise<ApiEnvelope<SearchPage>> {
  return getJson(`/api/search?${params.toString()}`, signal);
}

export async function fetchSuggest(
  q: string,
  signal: AbortSignal,
): Promise<Suggestion[]> {
  const params = new URLSearchParams({ q });
  const body = await getJson<{ items: Suggestion[] }>(
    `/api/suggest?${params.toString()}`,
    signal,
  );
  return body.data?.items ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const body = await getJson<{ items: Category[] }>(
    "/api/categories",
    AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  );
  return body.data?.items ?? [];
}

async function getJson<T>(
  url: string,
  signal: AbortSignal,
): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, { signal });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (body.error) {
    throw new ApiRequestError(body.error.code, body.error.message);
  }
  return body;
}
