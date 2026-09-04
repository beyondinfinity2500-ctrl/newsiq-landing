/**
 * Centralized error types.
 * All application errors extend AppError so callers can distinguish
 * error categories without inspecting messages.
 */

export type ErrorCategory =
  | "validation"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "rate_limit"
  | "external"
  | "internal";

export class AppError extends Error {
  readonly category: ErrorCategory;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    category: ErrorCategory,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.category = category;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("validation", message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("not_found", message, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("unauthorized", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("forbidden", message, 403);
    this.name = "ForbiddenError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded", details?: Record<string, unknown>) {
    super("rate_limit", message, 429, details);
    this.name = "RateLimitError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super("external", `${service}: ${message}`, 502, details);
    this.name = "ExternalServiceError";
  }
}
