import type { Response } from "express";

export function success<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
}

export function fail(
  res: Response,
  statusCode: number,
  message: string,
  code: string,
  requestId?: string
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      ...(requestId ? { requestId } : {}),
    },
  });
}
