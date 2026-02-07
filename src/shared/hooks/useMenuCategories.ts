import { useCallback, useEffect, useMemo, useState } from "react";
import { isMenuCategory, type MenuCategory } from "../../data/menuCategories";
import { type AppError } from "@/lib/errors";
import { fetchJson, isApiClientError } from "@/lib/apiClient";

export type MenuCategoryItem = {
  key: MenuCategory;
  label: string;
  fullLabel: string;
  imageUrl?: string;
  background: string;
  sort: number;
};

type UseMenuCategoriesResult = {
  categories: MenuCategoryItem[];
  error: AppError | null;
  reloadCategories: () => Promise<void>;
};

type MenuApiResponse = {
  categories?: Array<{
    key: string;
    label: string;
    fullLabel?: string;
    imageUrl?: string;
    background?: string;
  }>;
};

const MENU_API_URL = "/api/menu";

export function useMenuCategories(): UseMenuCategoriesResult {
  const [categories, setCategories] = useState<MenuCategoryItem[]>([]);
  const [error, setError] = useState<AppError | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      const payload = await fetchJson<MenuApiResponse>(MENU_API_URL, { timeoutMs: 8_000 });
      const next = (payload.categories ?? [])
        .filter((category) => isMenuCategory(category.key))
        .map(
          (category, idx) =>
            ({
              key: category.key,
              label: category.label,
              fullLabel: category.fullLabel?.trim() || category.label,
              imageUrl: category.imageUrl,
              background: category.background ?? "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
              sort: idx * 10 + 10,
            }) satisfies MenuCategoryItem,
        );

      setCategories(next);
    } catch (requestError) {
      if (isApiClientError(requestError)) {
        const diagnosticCode = `MENU_CATEGORIES_LOAD_FAILED:${requestError.code}`;
        console.error("MENU_CATEGORIES_LOAD_FAILED", {
          diagnosticCode,
          url: requestError.url,
          status: requestError.status,
          message: requestError.message,
        });

        const isConfigurationError = requestError.code === "HTTP_ERROR" && (requestError.status === 500 || requestError.status === 503);

        setError({
          code: diagnosticCode,
          message: isConfigurationError
            ? "Сервис категорий временно недоступен: ошибка конфигурации сервера."
            : "Ошибка загрузки с сервера. Категории временно недоступны.",
        });
      } else {
        console.error("MENU_CATEGORIES_LOAD_FAILED", requestError);
        setError({
          code: "MENU_CATEGORIES_LOAD_FAILED:UNKNOWN",
          message: "Ошибка загрузки с сервера. Категории временно недоступны.",
        });
      }

      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({ categories, error, reloadCategories: load }),
    [categories, error, load],
  );
}
