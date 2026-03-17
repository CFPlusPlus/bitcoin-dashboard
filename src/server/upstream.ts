import { ZodError } from "zod";
import { errorResponse } from "./http";

export type UpstreamErrorCode =
  | "upstream_fetch_failed"
  | "upstream_invalid_shape"
  | "upstream_missing_data";

export class UpstreamError extends Error {
  code: UpstreamErrorCode;
  provider: string;
  upstreamStatus?: number;

  constructor(
    provider: string,
    code: UpstreamErrorCode,
    message: string,
    options: {
      cause?: unknown;
      upstreamStatus?: number;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "UpstreamError";
    this.provider = provider;
    this.code = code;
    this.upstreamStatus = options.upstreamStatus;
  }
}

export function isUpstreamError(error: unknown): error is UpstreamError {
  return error instanceof UpstreamError;
}

export function invalidUpstreamShape(provider: string, error: ZodError | string) {
  const details =
    typeof error === "string"
      ? error
      : error.issues
          .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
          .join("; ");

  return new UpstreamError(provider, "upstream_invalid_shape", details);
}

export function missingUpstreamData(provider: string, message: string) {
  return new UpstreamError(provider, "upstream_missing_data", message);
}

export function upstreamFetchFailed(
  provider: string,
  message: string,
  options: {
    cause?: unknown;
    upstreamStatus?: number;
  } = {}
) {
  return new UpstreamError(provider, "upstream_fetch_failed", message, options);
}

export function mapUnknownToUpstreamError(provider: string, error: unknown) {
  if (isUpstreamError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return upstreamFetchFailed(provider, message, { cause: error });
}

export function upstreamErrorResponse(provider: string, error: unknown, message: string) {
  const upstreamError = mapUnknownToUpstreamError(provider, error);

  return errorResponse(502, message, upstreamError.message, {
    code: upstreamError.code,
    provider: upstreamError.provider,
    ...(typeof upstreamError.upstreamStatus === "number"
      ? { upstreamStatus: upstreamError.upstreamStatus }
      : {}),
  });
}
