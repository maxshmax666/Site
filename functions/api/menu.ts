import { createClient } from "@supabase/supabase-js";
import { categories as fallbackCategories, menu as fallbackMenu, type MenuItem } from "../../src/data/menu";
import { ensureRequiredApiEnv, resolveSupabaseOrigin, type ApiEnv, json } from "./_utils";

type MenuCategoryApiItem = {
  key: string;
  label: string;
  fullLabel: string;
  imageUrl?: string;
  background: string;
};

type MenuDbRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
};

type CategoryDbRow = {
  key: string;
  label: string;
  full_label: string;
  image_url: string | null;
  fallback_background: string;
};

function mapMenuRow(row: MenuDbRow): MenuItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    desc: row.description ?? "",
    priceFrom: Number(row.price),
    image: row.image_url ?? undefined,
  };
}

function mapCategoryRow(row: CategoryDbRow): MenuCategoryApiItem {
  return {
    key: row.key,
    label: row.label,
    fullLabel: row.full_label,
    imageUrl: row.image_url ?? undefined,
    background: row.fallback_background,
  };
}

export const onRequestGet: PagesFunction<ApiEnv> = async ({ env }) => {
  const envError = ensureRequiredApiEnv(env);
  if (envError) {
    return json(
      {
        categories: fallbackCategories,
        items: fallbackMenu,
      },
      { status: 200 },
    );
  }

  const supabaseOrigin = resolveSupabaseOrigin(env);
  if (!supabaseOrigin || !env.SUPABASE_ANON_KEY) {
    return json(
      {
        categories: fallbackCategories,
        items: fallbackMenu,
      },
      { status: 200 },
    );
  }

  const supabase = createClient(supabaseOrigin, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const [{ data: categoriesData, error: categoriesError }, { data: menuData, error: menuError }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("key,label,full_label,image_url,fallback_background")
      .eq("is_active", true)
      .order("sort", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id,title,description,category,price,image_url")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (categoriesError || menuError) {
    return json(
      {
        categories: fallbackCategories,
        items: fallbackMenu,
      },
      { status: 200 },
    );
  }

  return json(
    {
      categories: (categoriesData ?? []).map((row) => mapCategoryRow(row as CategoryDbRow)),
      items: (menuData ?? []).map((row) => mapMenuRow(row as MenuDbRow)),
    },
    { status: 200 },
  );
};
