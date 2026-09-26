import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { fail } from "../utils/api-response.js";

export function notFoundHandler(req: Request, res: Response): void {
  fail(res, 404, `Route ${req.method} ${req.originalUrl} not found`, "NOT_FOUND", req.requestId);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? "Validation failed";
    fail(res, 422, message, "VALIDATION_ERROR", requestId);
    return;
  }

  if (err instanceof AppError) {
    fail(res, err.statusCode, err.message, err.code, requestId);
    return;
  }

  if (isMongoDuplicateError(err)) {
    fail(res, 409, "A record with this unique value already exists", "DUPLICATE", requestId);
    return;
  }

  if (env.NODE_ENV !== "production") {
    const message = err instanceof Error ? err.message : "Internal server error";
    fail(res, 500, message, "INTERNAL_ERROR", requestId);
    return;
  }

  fail(res, 500, "Internal server error", "INTERNAL_ERROR", requestId);
}

function isMongoDuplicateError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}
