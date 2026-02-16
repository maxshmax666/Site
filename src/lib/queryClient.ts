import { QueryClient } from "@tanstack/react-query";

const DEFAULT_RETRY_LIMIT = 2;

type RetryErrorShape = {
  status?: number | null;
  code?: string;
};

export function defaultRetry(failureCount: number, error: unknown) {
  const typedError = error as RetryErrorShape | undefined;

  if (typedError?.status === 401 || typedError?.status === 403) {
    return false;
  }

  if (typedError?.code === "TIMEOUT") {
    return failureCount < DEFAULT_RETRY_LIMIT;
  }

  if (typeof typedError?.status === "number" && typedError.status >= 500) {
    return failureCount < DEFAULT_RETRY_LIMIT;
  }

  return failureCount < 1;
}

export const queryCachePolicy = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: defaultRetry,
} as const;

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: queryCachePolicy.staleTime,
      gcTime: queryCachePolicy.gcTime,
      retry: queryCachePolicy.retry,
      refetchOnWindowFocus: false,
    },
  },
});
