export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.name = "AppError";
  }
}

export function badRequest(message: string, code = "BAD_REQUEST"): AppError {
  return new AppError(message, 400, code);
}

export function unauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): AppError {
  return new AppError(message, 401, code);
}

export function forbidden(
  message = "You are not authorized to perform this action",
  code = "FORBIDDEN"
): AppError {
  return new AppError(message, 403, code);
}

export function notFound(message = "Resource not found", code = "NOT_FOUND"): AppError {
  return new AppError(message, 404, code);
}

export function conflict(message: string, code = "CONFLICT"): AppError {
  return new AppError(message, 409, code);
}
