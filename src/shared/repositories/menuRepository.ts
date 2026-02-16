import { type MenuItem } from "@/data/menu";
import { fetchJson } from "@/lib/apiClient";
import { normalizeQueryError } from "@/lib/queryError";
import { supabase } from "@/lib/supabase";
import {
  mapDefaultMenuCategories,
  mapMenuApiCategoriesToUi,
  mapMenuDbCategoriesToUi,
  mapMenuDbItemsToUi,
  type MenuCategoryItem,
} from "@/shared/repositories/mappers/menuMapper";

export type { MenuCategoryItem };

type MenuApiResponse = {
  categories?: Array<{
    key: string;
    label: string;
    fullLabel?: string;
    imageUrl?: string;
    background?: string;
  }>;
  items?: MenuItem[];
};

type MenuRequestTarget = "categories" | "items";

const MENU_API_URL = "/api/menu";

/**
 * Source-of-truth policy:
 * - primary source: HTTP API (/api/menu)
 * - fallback to Supabase is allowed only for public menu data when API request fails
 * - if both API and Supabase fail for categories, return static defaults
 * - no fallback to Supabase for user-scoped or protected datasets (handled in dedicated repositories)
 */
export async function fetchFromApi(target: "categories"): Promise<MenuCategoryItem[]>;
export async function fetchFromApi(target: "items"): Promise<MenuItem[]>;
export async function fetchFromApi(target: MenuRequestTarget): Promise<MenuCategoryItem[] | MenuItem[]> {
  const payload = await fetchJson<MenuApiResponse>(MENU_API_URL, { timeoutMs: 8_000 });

  if (target === "categories") {
    return mapMenuApiCategoriesToUi(payload.categories ?? []);
  }

  return Array.isArray(payload.items) ? payload.items : [];
}

export async function fetchFromSupabase(target: "categories"): Promise<MenuCategoryItem[]>;
export async function fetchFromSupabase(target: "items"): Promise<MenuItem[]>;
export async function fetchFromSupabase(target: MenuRequestTarget): Promise<MenuCategoryItem[] | MenuItem[]> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  if (target === "categories") {
    const { data, error } = await supabase
      .from("menu_categories")
      .select("key,label,full_label,image_url,fallback_background,sort")
      .eq("is_active", true)
      .order("sort", { ascending: true });

    if (error) {
      throw error;
    }

    return mapMenuDbCategoriesToUi(Array.isArray(data) ? data : []);
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id,title,description,category,price,image_url")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return mapMenuDbItemsToUi(Array.isArray(data) ? data : []);
}

export async function getMenuCategories(): Promise<MenuCategoryItem[]> {
  try {
    return await fetchFromApi("categories");
  } catch (requestError) {
    try {
      const categories = await fetchFromSupabase("categories");
      if (categories.length > 0) {
        return categories;
      }
    } catch {
      // ignore and continue to static fallback
    }

    const fallbackCategories = mapDefaultMenuCategories();
    if (fallbackCategories.length > 0) {
      return fallbackCategories;
    }

    throw normalizeQueryError(requestError, {
      baseCode: "MENU_CATEGORIES_LOAD_FAILED",
      fallbackMessage: "Ошибка загрузки с сервера. Категории временно недоступны.",
      configurationMessage: "Сервис категорий временно недоступен: ошибка конфигурации сервера.",
    });
  }
}

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    return await fetchFromApi("items");
  } catch (requestError) {
    try {
      return await fetchFromSupabase("items");
    } catch {
      throw normalizeQueryError(requestError, {
        baseCode: "MENU_LOAD_FAILED",
        fallbackMessage: "Ошибка загрузки с сервера. Меню временно недоступно.",
        configurationMessage: "Сервис меню временно недоступен: ошибка конфигурации сервера.",
      });
    }
  }
}
