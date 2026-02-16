import { useQuery } from "@tanstack/react-query";
import { defaultMenuCategories, isMenuCategory, type MenuCategory } from "@/data/menuCategories";
import { fetchJson } from "@/lib/apiClient";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError, normalizeQueryError } from "@/lib/queryError";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/shared/queryKeys";

export type MenuCategoryItem = {
  key: MenuCategory;
  label: string;
  fullLabel: string;
  imageUrl?: string;
  background: string;
  sort: number;
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

const mapDefaultMenuCategories = (): MenuCategoryItem[] =>
  defaultMenuCategories.map(
    (category, idx) =>
      ({
        key: category.value,
        label: category.label,
        fullLabel: category.fullLabel,
        imageUrl: category.imageUrl,
        background: category.fallbackBackground,
        sort: idx * 10 + 10,
      }) satisfies MenuCategoryItem,
  );

export async function fetchMenuCategories(): Promise<MenuCategoryItem[]> {
  try {
    const payload = await fetchJson<MenuApiResponse>(MENU_API_URL, { timeoutMs: 8_000 });

    return (payload.categories ?? [])
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
  } catch (requestError) {
    if (supabase) {
      const { data, error: dbError } = await supabase
        .from("menu_categories")
        .select("key,label,full_label,image_url,fallback_background,sort")
        .eq("is_active", true)
        .order("sort", { ascending: true });

      if (!dbError) {
        return (Array.isArray(data) ? data : [])
          .map((category) => ({
            key: String(category.key ?? ""),
            label: String(category.label ?? "").trim(),
            fullLabel: String(category.full_label ?? "").trim(),
            imageUrl: typeof category.image_url === "string" ? category.image_url : undefined,
            background:
              typeof category.fallback_background === "string"
                ? category.fallback_background
                : "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
            sort: Number(category.sort ?? 100),
          }))
          .filter((category) => isMenuCategory(category.key) && category.label)
          .map((category) => ({
            key: category.key as MenuCategory,
            label: category.label,
            fullLabel: category.fullLabel || category.label,
            imageUrl: category.imageUrl,
            background: category.background,
            sort: Number.isFinite(category.sort) ? category.sort : 100,
          }));
      }
    }

    const normalizedError = normalizeQueryError(requestError, {
      baseCode: "MENU_CATEGORIES_LOAD_FAILED",
      fallbackMessage: "Ошибка загрузки с сервера. Категории временно недоступны.",
      configurationMessage: "Сервис категорий временно недоступен: ошибка конфигурации сервера.",
    });

    const fallbackCategories = mapDefaultMenuCategories();
    if (fallbackCategories.length > 0) {
      return fallbackCategories;
    }

    throw normalizedError;
  }
}

export function useMenuCategories() {
  const query = useQuery<MenuCategoryItem[], QueryError>({
    queryKey: queryKeys.menu.categories(),
    queryFn: fetchMenuCategories,
    ...queryCachePolicy,
  });

  return {
    categories: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}
