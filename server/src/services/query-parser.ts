import {
  DEFAULT_LIMIT,
  DEFAULT_SEARCH_FIELDS,
  MAX_LIMIT,
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  QUERY_PATTERN,
  SEARCH_RESULT_FIELDS,
  SUGGEST_FIELDS,
  type SearchQuery,
  type SortOption,
} from "@search/shared";
import {
  invalidQuery,
  missingField,
  queryTooLong,
  queryTooShort,
  unknownField,
} from "../errors/app-error.js";

const SEARCH_KEYS = [
  "q",
  "categoryId",
  "sort",
  "limit",
  "offset",
  "fields",
] as const;

const SUGGEST_KEYS = ["q", "fields"] as const;

export function parseSearchQuery(
  query: Record<string, unknown>,
  knownCategoryIds: Set<string>,
): SearchQuery {
  rejectUnknownKeys(query, SEARCH_KEYS);
  const q = readString(query.q) ?? "";
  if (q.length > 0) {
    validateQueryText(q);
  }
  const categoryId = readOptionalString(query.categoryId);
  if (categoryId && !knownCategoryIds.has(categoryId)) {
    throw unknownField("categoryId", [...knownCategoryIds]);
  }
  const sort = parseSort(query.sort);
  const limit = parseLimit(query.limit);
  const offset = parseOffset(query.offset);
  const fields = parseFields(
    query.fields,
    SEARCH_RESULT_FIELDS,
    DEFAULT_SEARCH_FIELDS,
  );
  return { q, categoryId, sort, limit, offset, fields };
}

export function parseSuggestQuery(
  query: Record<string, unknown>,
): { q: string; fields: string[] } {
  rejectUnknownKeys(query, SUGGEST_KEYS);
  const q = readString(query.q);
  if (q === undefined) {
    throw missingField();
  }
  validateQueryText(q);
  const fields = parseFields(
    query.fields,
    SUGGEST_FIELDS,
    SUGGEST_FIELDS,
  );
  return { q, fields };
}

export function validateQueryText(q: string): void {
  if (q.length < MIN_QUERY_LENGTH) {
    throw queryTooShort();
  }
  if (q.length > MAX_QUERY_LENGTH) {
    throw queryTooLong();
  }
  if (!QUERY_PATTERN.test(q)) {
    throw invalidQuery();
  }
}

function rejectUnknownKeys(
  query: Record<string, unknown>,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(query)) {
    if (!allowed.includes(key)) {
      throw unknownField(key, allowed);
    }
  }
}

function readString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim();
  }
  return String(value).trim();
}

function readOptionalString(value: unknown): string | undefined {
  const text = readString(value);
  if (!text) {
    return undefined;
  }
  return text;
}

function parseSort(value: unknown): SortOption {
  if (value === undefined) {
    return "popularity";
  }
  const text = readString(value);
  if (text === "popularity" || text === "price") {
    return text;
  }
  throw unknownField("sort", ["popularity", "price"]);
}

function parseLimit(value: unknown): number {
  if (value === undefined) {
    return DEFAULT_LIMIT;
  }
  const n = parseIntParam(value, "limit");
  if (n < 1) {
    throw unknownField("limit", ["1 to 40"]);
  }
  return Math.min(n, MAX_LIMIT);
}

function parseOffset(value: unknown): number {
  if (value === undefined) {
    return 0;
  }
  const n = parseIntParam(value, "offset");
  if (n < 0) {
    throw unknownField("offset", ["0 or more"]);
  }
  return n;
}

function parseIntParam(value: unknown, name: string): number {
  const text = readString(value);
  if (text === undefined || !/^[0-9]+$/.test(text)) {
    throw unknownField(name, ["a whole number"]);
  }
  return Number.parseInt(text, 10);
}

function parseFields(
  value: unknown,
  allowList: readonly string[],
  defaults: readonly string[],
): string[] {
  if (value === undefined) {
    return [...defaults];
  }
  const text = readString(value);
  if (!text) {
    return [...defaults];
  }
  const requested = text.split(",").map((part) => part.trim());
  const selected = new Set<string>(["id"]);
  for (const name of requested) {
    if (name === "") {
      continue;
    }
    if (!allowList.includes(name)) {
      throw unknownField(name, allowList);
    }
    selected.add(name);
  }
  return allowList.filter((name) => selected.has(name));
}
