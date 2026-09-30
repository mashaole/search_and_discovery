export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  popularity: number;
};

export type Offer = {
  available: boolean;
  priceCents: number;
  currency: string;
  deliveryEstimate: string;
};

export type Enrichment = "ok" | "failed";

export type SortOption = "popularity" | "price";

export type SearchQuery = {
  q: string;
  categoryId?: string;
  sort: SortOption;
  limit: number;
  offset: number;
  fields: string[];
  failFirstOffer?: boolean;
};

export type SearchResult = {
  id: string;
  name?: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  available?: boolean | null;
  priceCents?: number | null;
  currency?: string | null;
  deliveryEstimate?: string | null;
  enrichment?: Enrichment;
};

export type SearchPage = {
  items: SearchResult[];
};

export type Suggestion = {
  id: string;
  name: string;
  distance: number;
};

export type ApiError = {
  code: string;
  message: string;
};

export type ApiMeta = {
  limit: number;
  offset: number;
  total: number;
  fields: string[];
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta | null;
};

export const SEARCH_RESULT_FIELDS = [
  "id",
  "name",
  "categoryId",
  "categoryName",
  "description",
  "available",
  "priceCents",
  "currency",
  "deliveryEstimate",
  "enrichment",
] as const;

export const DEFAULT_SEARCH_FIELDS = [
  "id",
  "name",
  "categoryId",
  "categoryName",
  "available",
  "priceCents",
  "currency",
  "deliveryEstimate",
  "enrichment",
] as const;

export const OFFER_FIELDS = [
  "available",
  "priceCents",
  "currency",
  "deliveryEstimate",
  "enrichment",
] as const;

export const SUGGEST_FIELDS = ["id", "name", "distance"] as const;

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 80;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 40;
export const SEARCH_TIMEOUT_MS = 4000;
export const OFFER_CACHE_MS = 5000;
export const QUERY_PATTERN = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

export function sanitizeQueryInput(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/ {2,}/g, " ")
    .replace(/^ +/, "")
    .slice(0, MAX_QUERY_LENGTH);
}
