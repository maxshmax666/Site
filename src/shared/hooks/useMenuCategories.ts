import { useCallback, useEffect, useMemo, useState } from "react";
import { categories as fallbackCategories } from "../../data/menu";
import { isMenuCategory, type MenuCategory } from "../../data/menuCategories";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { normalizeSupabaseError, type AppError } from "@/lib/errors";

export type MenuCategoryItem = {
  key: MenuCategory;
  label: string;
  fullLabel: string;
  imageUrl?: string;
  background: string;
  sort: number;
};

type DbCategory = {
  key: string;
  label: string;
  full_label: string | null;
  image_url: string | null;
  fallback_background: string | null;
  sort: number;
};

type UseMenuCategoriesResult = {
  categories: MenuCategoryItem[];
  error: AppError | null;
  reloadCategories: () => Promise<void>;
};

export function useMenuCategories(): UseMenuCategoriesResult {
  const [categories, setCategories] = useState<MenuCategoryItem[]>(
    fallbackCategories.map((category, idx) => ({ ...category, sort: idx * 10 + 10 })),
  );
  const [error, setError] = useState<AppError | null>(null);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv || !supabase) {
      setError(null);
      return;
    }

    setError(null);

    const { data, error: supaError } = await supabase
      .from("menu_categories")
      .select("key,label,full_label,image_url,fallback_background,sort")
      .order("sort", { ascending: true });

    if (supaError) {
      if (import.meta.env.DEV) {
        console.error("[menu_categories] Supabase error", supaError);
      } else {
        console.error("MENU_CATEGORIES_LOAD_FAILED");
      }

      setError(
        normalizeSupabaseError(
          "MENU_CATEGORIES_LOAD_FAILED",
          "Не удалось загрузить категории меню из базы данных. Показаны демо-категории.",
          supaError,
        ),
      );
      return;
    }

    const next = (data ?? [])
      .map((raw) => raw as DbCategory)
      .filter((category) => isMenuCategory(category.key))
      .map(
        (category) =>
          ({
            key: category.key,
            label: category.label,
            fullLabel: category.full_label?.trim() || category.label,
            imageUrl: category.image_url ?? undefined,
            background:
              category.fallback_background ?? "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
            sort: Number.isFinite(category.sort) ? category.sort : 100,
          }) satisfies MenuCategoryItem,
      );

    if (next.length > 0) {
      setCategories(next);
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
