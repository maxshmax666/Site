export type ApiClientErrorCode =
  | "HTTP_ERROR"
  | "INVALID_CONTENT_TYPE"
  | "INVALID_JSON"
  | "TIMEOUT"
  | "NETWORK_ERROR";

export type ApiClientErrorShape = {
  code: ApiClientErrorCode;
  message: string;
  status: number | null;
  url: string;
};

export class ApiClientError extends Error implements ApiClientErrorShape {
  code: ApiClientErrorCode;
  status: number | null;
  url: string;

  constructor({ code, message, status, url }: ApiClientErrorShape) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.url = url;
  }
}

type FetchJsonOptions = {
  init?: RequestInit;
  timeoutMs?: number;
  signal?: AbortSignal;
};

function buildAbortSignal(timeoutMs: number, signal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timeoutId),
  };
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { init, timeoutMs = 10_000, signal } = options;
  const { signal: mergedSignal, cleanup } = buildAbortSignal(timeoutMs, signal);

  try {
    const response = await fetch(url, {
      ...init,
      signal: mergedSignal,
    });

    if (!response.ok) {
      throw new ApiClientError({
        code: "HTTP_ERROR",
        message: `Request failed with status ${response.status}`,
        status: response.status,
        url,
      });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiClientError({
        code: "INVALID_CONTENT_TYPE",
        message: `Expected JSON but received '${contentType || "unknown"}'`,
        status: response.status,
        url,
      });
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiClientError({
        code: "INVALID_JSON",
        message: "Invalid JSON response payload",
        status: response.status,
        url,
      });
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiClientError({
        code: "TIMEOUT",
        message: `Request timed out after ${timeoutMs}ms`,
        status: null,
        url,
      });
    }

    throw new ApiClientError({
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network request failed",
      status: null,
      url,
    });
  } finally {
    cleanup();
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
