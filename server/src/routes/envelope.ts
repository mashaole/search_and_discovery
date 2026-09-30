import type { ApiEnvelope, ApiError, ApiMeta } from "@search/shared";

export function ok<T>(
  data: T,
  meta: ApiMeta | null = null,
): ApiEnvelope<T> {
  return { data, error: null, meta };
}

export function fail(
  error: ApiError,
  status: number,
): { body: ApiEnvelope<null>; status: number } {
  return {
    status,
    body: { data: null, error, meta: null },
  };
}
