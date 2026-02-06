type DbErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export type AppError = {
  code: string;
  message: string;
  hint?: string;
};

const DEFAULT_SUPABASE_ERROR = "Не удалось выполнить запрос. Попробуйте ещё раз.";

export function formatSupabaseError(error: DbErrorLike | null | undefined, fallback = DEFAULT_SUPABASE_ERROR) {
  if (!error) return fallback;

  if (error.code === "22P02") {
    return `Ошибка данных (22P02). ${error.message ?? fallback}`;
  }

  if (error.code === "PGRST116") {
    return "Профиль пользователя не найден. Проверьте backfill/триггер profiles.";
  }

  if (error.message?.trim()) {
    return error.message.trim();
  }

  return fallback;
}

function detectTechnicalSuffix(error: DbErrorLike | null | undefined) {
  if (!error) return "UNKNOWN";

  if (error.code === "42501") {
    return "RLS";
  }

  if (error.code === "PGRST301") {
    return "UNAUTHORIZED";
  }

  if (error.code?.trim()) {
    return error.code.trim().toUpperCase();
  }

  if (error.message?.toLowerCase().includes("row-level security")) {
    return "RLS";
  }

  return "UNKNOWN";
}

export function normalizeSupabaseError(
  baseCode: string,
  userMessage: string,
  error?: DbErrorLike | null,
): AppError {
  const technical = detectTechnicalSuffix(error);

  return {
    code: `${baseCode}:${technical}`,
    message: userMessage,
    hint: error?.hint?.trim() || undefined,
  };
}
