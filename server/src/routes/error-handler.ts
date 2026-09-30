import type { NextFunction, Request, Response } from "express";
import { AppError, internalError } from "../errors/app-error.js";
import type { Logger } from "../ports/index.js";
import { fail } from "./envelope.js";

export function errorHandler(logger: Logger) {
  return (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    if (err instanceof AppError) {
      const payload = fail(
        { code: err.code, message: err.message },
        err.status,
      );
      res.status(payload.status).json(payload.body);
      return;
    }
    logger.error("unhandled error", {
      name: err instanceof Error ? err.name : "unknown",
    });
    const fallback = internalError();
    const payload = fail(
      { code: fallback.code, message: fallback.message },
      fallback.status,
    );
    res.status(payload.status).json(payload.body);
  };
}

export function notFoundHandler(
  _req: Request,
  res: Response,
): void {
  const payload = fail(
    { code: "NOT_FOUND", message: "That product was not found." },
    404,
  );
  res.status(payload.status).json(payload.body);
}
