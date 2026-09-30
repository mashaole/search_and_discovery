export const ERROR_MESSAGES = {
  MISSING_FIELD:
    "Enter a search of at least 2 characters.",
  QUERY_TOO_SHORT:
    "Enter at least 2 letters or numbers.",
  QUERY_TOO_LONG:
    "Keep the search to 80 characters or fewer.",
  INVALID_QUERY:
    "Use only letters, numbers, and spaces between words.",
  NOT_FOUND: "That product was not found.",
  SEARCH_TIMEOUT: "The search took too long. Try again.",
  INTERNAL: "Something went wrong. Try again.",
} as const;

export type ErrorCode =
  | keyof typeof ERROR_MESSAGES
  | "UNKNOWN_FIELD";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function missingField(): AppError {
  return new AppError(
    "MISSING_FIELD",
    400,
    ERROR_MESSAGES.MISSING_FIELD,
  );
}

export function unknownField(
  field: string,
  allowed: readonly string[],
): AppError {
  const list = allowed.join(", ");
  return new AppError(
    "UNKNOWN_FIELD",
    400,
    `${field} is not allowed. Use: ${list}.`,
  );
}

export function queryTooShort(): AppError {
  return new AppError(
    "QUERY_TOO_SHORT",
    400,
    ERROR_MESSAGES.QUERY_TOO_SHORT,
  );
}

export function queryTooLong(): AppError {
  return new AppError(
    "QUERY_TOO_LONG",
    400,
    ERROR_MESSAGES.QUERY_TOO_LONG,
  );
}

export function invalidQuery(): AppError {
  return new AppError(
    "INVALID_QUERY",
    400,
    ERROR_MESSAGES.INVALID_QUERY,
  );
}

export function notFound(): AppError {
  return new AppError("NOT_FOUND", 404, ERROR_MESSAGES.NOT_FOUND);
}

export function searchTimeout(): AppError {
  return new AppError(
    "SEARCH_TIMEOUT",
    504,
    ERROR_MESSAGES.SEARCH_TIMEOUT,
  );
}

export function internalError(): AppError {
  return new AppError("INTERNAL", 500, ERROR_MESSAGES.INTERNAL);
}
