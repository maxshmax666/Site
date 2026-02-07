import { useCallback, useEffect, useMemo, useState } from "react";
import { type MenuItem } from "../../data/menu";
import { type AppError } from "@/lib/errors";
import { fetchJson, isApiClientError } from "@/lib/apiClient";
import { hasSupabaseEnv } from "@/lib/supabase";

type UseMenuItemsResult = {
  items: MenuItem[];
  loading: boolean;
  error: AppError | null;
  reload: () => Promise<void>;
  hasSupabaseEnv: boolean;
};

type MenuApiResponse = {
  items?: MenuItem[];
};

const MENU_API_URL = "/api/menu";

export function useMenuItems(): UseMenuItemsResult {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchJson<MenuApiResponse>(MENU_API_URL, { timeoutMs: 8_000 });
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (requestError) {
      if (isApiClientError(requestError)) {
        const diagnosticCode = `MENU_LOAD_FAILED:${requestError.code}`;
        console.error("MENU_LOAD_FAILED", {
          diagnosticCode,
          url: requestError.url,
          status: requestError.status,
          message: requestError.message,
        });

        const isConfigurationError = requestError.code === "HTTP_ERROR" && (requestError.status === 500 || requestError.status === 503);

        setError({
          code: diagnosticCode,
          message: isConfigurationError
            ? "Сервис меню временно недоступен: ошибка конфигурации сервера."
            : "Ошибка загрузки с сервера. Меню временно недоступно.",
        });
      } else {
        console.error("MENU_LOAD_FAILED", requestError);
        setError({
          code: "MENU_LOAD_FAILED:UNKNOWN",
          message: "Ошибка загрузки с сервера. Меню временно недоступно.",
        });
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedItems = useMemo(() => items, [items]);

  return {
    items: sortedItems,
    loading,
    error,
    reload: load,
    hasSupabaseEnv,
  };
}
