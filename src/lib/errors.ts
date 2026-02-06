type DbErrorLike = {
  code?: string;
  message?: string;
  details?: string;
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

