import { isApiClientError } from "@/lib/apiClient";
import { type AppError } from "@/lib/errors";

type SupabaseErrorLike = {
  message?: string;
  status?: number;
  code?: string;
};

export type QueryError = AppError & {
  status: number | null;
  kind: "unauthorized" | "server" | "timeout" | "unknown";
};

type NormalizeQueryErrorOptions = {
  baseCode: string;
  fallbackMessage: string;
  configurationMessage?: string;
};

function isSupabaseErrorLike(error: unknown): error is SupabaseErrorLike {
  return Boolean(error) && typeof error === "object" && ("message" in (error as object) || "status" in (error as object));
}

export function normalizeQueryError(error: unknown, options: NormalizeQueryErrorOptions): QueryError {
  const { baseCode, fallbackMessage, configurationMessage } = options;

  if (isApiClientError(error)) {
    const diagnosticCode = `${baseCode}:${error.code}`;
    const isServer = error.code === "HTTP_ERROR" && (error.status === 500 || error.status === 503);

    return {
      code: diagnosticCode,
      message: isServer
        ? (configurationMessage ?? fallbackMessage)
        : fallbackMessage,
      status: error.status,
      kind: error.status === 401 ? "unauthorized" : error.code === "TIMEOUT" ? "timeout" : isServer ? "server" : "unknown",
    };
  }

  if (isSupabaseErrorLike(error)) {
    const status = typeof error.status === "number" ? error.status : null;
    const rawCode = typeof error.code === "string" && error.code.trim() ? error.code.trim().toUpperCase() : "SUPABASE";
    const message = typeof error.message === "string" && error.message.trim() ? error.message.trim() : fallbackMessage;

    return {
      code: `${baseCode}:${rawCode}`,
      message,
      status,
      kind: status === 401 || status === 403 ? "unauthorized" : status && status >= 500 ? "server" : "unknown",
    };
  }

  return {
    code: `${baseCode}:UNKNOWN`,
    message: error instanceof Error && error.message.trim() ? error.message : fallbackMessage,
    status: null,
    kind: "unknown",
  };
}
