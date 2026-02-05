import { useCallback, useEffect, useState } from "react";
import { categories as fallbackCategories } from "../../data/menu";
import { isMenuCategory, type MenuCategory } from "../../data/menuCategories";
import { supabase } from "@/lib/supabase";

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

const hasSupabaseEnv =
  Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

export function useMenuCategories() {
  const [categories, setCategories] = useState<MenuCategoryItem[]>(
    fallbackCategories.map((category, idx) => ({ ...category, sort: idx * 10 + 10 }))
  );

  const load = useCallback(async () => {
    if (!hasSupabaseEnv) {
      return;
    }

    const { data, error } = await supabase
      .from("menu_categories")
      .select("key,label,full_label,image_url,fallback_background,sort")
      .order("sort", { ascending: true });

    if (error) {
      return;
    }

    const next = (data ?? [])
      .map((raw) => raw as DbCategory)
      .filter((category) => isMenuCategory(category.key))
      .map((category) => ({
        key: category.key,
        label: category.label,
        fullLabel: category.full_label?.trim() || category.label,
        imageUrl: category.image_url ?? undefined,
        background: category.fallback_background ?? "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
        sort: Number.isFinite(category.sort) ? category.sort : 100,
      } satisfies MenuCategoryItem));

    if (next.length > 0) {
      setCategories(next);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { categories, reloadCategories: load };
}
