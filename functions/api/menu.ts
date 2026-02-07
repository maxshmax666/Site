import { createClient } from "@supabase/supabase-js";
import { type MenuItem } from "../../src/data/menu";
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
  full_label: string | null;
  image_url: string | null;
  fallback_background: string | null;
};

type QueryDiagnostic = {
  diagnosticCode: "MENU_CATEGORIES_QUERY_FAILED" | "MENU_ITEMS_QUERY_FAILED";
  table: "menu_categories" | "menu_items";
  query: string;
  code: string;
  message: string;
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
    fullLabel: row.full_label ?? row.label,
    imageUrl: row.image_url ?? undefined,
    background: row.fallback_background ?? "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  };
}

function deriveCategoriesFromItems(items: MenuItem[]): MenuCategoryApiItem[] {
  const keys = [...new Set(items.map((item) => item.category).filter(Boolean))];

  return keys.map((key) => ({
    key,
    label: key,
    fullLabel: key,
    background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  }));
}

export const onRequestGet: PagesFunction<ApiEnv> = async ({ env }) => {
  const envError = ensureRequiredApiEnv(env);
  if (envError) {
    return json(
      {
        categories: [],
        items: [],
      },
      { status: 200 },
    );
  }

  const supabaseOrigin = resolveSupabaseOrigin(env);
  if (!supabaseOrigin || !env.SUPABASE_ANON_KEY) {
    return json(
      {
        categories: [],
        items: [],
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

  if (menuError) {
    const diagnostics: QueryDiagnostic[] = [
      {
        diagnosticCode: "MENU_ITEMS_QUERY_FAILED",
        table: "menu_items",
        query: "select(id,title,description,category,price,image_url).eq(is_active,true).order(category,asc).order(sort,asc).order(created_at,desc)",
        code: menuError.code ?? "UNKNOWN",
        message: menuError.message ?? "Supabase query failed",
      },
    ];

    if (categoriesError) {
      diagnostics.push({
        diagnosticCode: "MENU_CATEGORIES_QUERY_FAILED",
        table: "menu_categories",
        query: "select(key,label,full_label,image_url,fallback_background).eq(is_active,true).order(sort,asc)",
        code: categoriesError.code ?? "UNKNOWN",
        message: categoriesError.message ?? "Supabase query failed",
      });
    }

    for (const diagnostic of diagnostics) {
      console.error("MENU_API_QUERY_FAILED", diagnostic);
    }

    return json(
      {
        code: "MENU_API_QUERY_FAILED",
        error: "Ошибка загрузки меню с сервера",
        details: diagnostics,
      },
      { status: 502 },
    );
  }

  const items = (menuData ?? []).map((row) => mapMenuRow(row as MenuDbRow));

  if (categoriesError) {
    const diagnostic: QueryDiagnostic = {
      diagnosticCode: "MENU_CATEGORIES_QUERY_FAILED",
      table: "menu_categories",
      query: "select(key,label,full_label,image_url,fallback_background).eq(is_active,true).order(sort,asc)",
      code: categoriesError.code ?? "UNKNOWN",
      message: categoriesError.message ?? "Supabase query failed",
    };

    console.error("MENU_API_QUERY_FAILED", diagnostic);

    return json(
      {
        categories: deriveCategoriesFromItems(items),
        items,
      },
      { status: 200 },
    );
  }

  return json(
    {
      categories: (categoriesData ?? []).map((row) => mapCategoryRow(row as CategoryDbRow)),
      items,
    },
    { status: 200 },
  );
};
