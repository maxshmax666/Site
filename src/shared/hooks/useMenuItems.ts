import { useQuery } from "@tanstack/react-query";
import { type MenuItem } from "@/data/menu";
import { fetchJson } from "@/lib/apiClient";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError, normalizeQueryError } from "@/lib/queryError";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { mapLegacyCategoryToUi } from "@/shared/map/menuCategoryLegacy";
import { queryKeys, type MenuItemsFilters } from "@/shared/queryKeys";

type MenuApiResponse = {
  items?: MenuItem[];
};

const MENU_API_URL = "/api/menu";

export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const payload = await fetchJson<MenuApiResponse>(MENU_API_URL, { timeoutMs: 8_000 });
    return Array.isArray(payload.items) ? payload.items : [];
  } catch (requestError) {
    if (supabase) {
      const { data, error: dbError } = await supabase
        .from("menu_items")
        .select("id,title,description,category,price,image_url")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("sort", { ascending: true })
        .order("created_at", { ascending: false });

      if (!dbError) {
        return (Array.isArray(data) ? data : [])
          .map((row) => {
            const rawCategory = String(row.category ?? "").trim();
            const uiCategory = mapLegacyCategoryToUi(rawCategory) ?? rawCategory;

            return {
              id: String(row.id ?? ""),
              title: String(row.title ?? ""),
              desc: String(row.description ?? ""),
              category: uiCategory,
              priceFrom: Number(row.price ?? 0),
              image: typeof row.image_url === "string" ? row.image_url : undefined,
            } satisfies MenuItem;
          })
          .filter((item) => item.id && item.title && item.category && Number.isFinite(item.priceFrom));
      }
    }

    throw normalizeQueryError(requestError, {
      baseCode: "MENU_LOAD_FAILED",
      fallbackMessage: "Ошибка загрузки с сервера. Меню временно недоступно.",
      configurationMessage: "Сервис меню временно недоступен: ошибка конфигурации сервера.",
    });
  }
}

export function useMenuItems(filters?: MenuItemsFilters) {
  const query = useQuery<MenuItem[], QueryError>({
    queryKey: queryKeys.menu.items(filters),
    queryFn: fetchMenuItems,
    ...queryCachePolicy,
  });

  return {
    items: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
    hasSupabaseEnv,
  };
}
