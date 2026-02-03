import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { menu as fallbackMenu, type MenuCategory, type MenuItem } from "../../data/menu";

type DbMenuItem = {
  id: string;
  title: string;
  description: string | null;
  category: MenuCategory;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort: number;
};

type UseMenuItemsResult = {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  hasSupabaseEnv: boolean;
};

const hasSupabaseEnv =
  Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

function mapDbItem(item: DbMenuItem): MenuItem {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    desc: item.description ?? "",
    priceFrom: Number(item.price ?? 0),
    badges: undefined,
    image: item.image_url ?? undefined,
  };
}

export function useMenuItems(): UseMenuItemsResult {
  const [items, setItems] = useState<MenuItem[]>(fallbackMenu);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      setError(null);
      setItems(fallbackMenu);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: supaError } = await supabase
      .from("menu_items")
      .select("id,title,description,category,price,image_url,is_active,sort")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);

    if (supaError) {
      setError(supaError.message);
      setItems(fallbackMenu);
      setLoading(false);
      return;
    }

    setItems((data ?? []).map((row) => mapDbItem(row as DbMenuItem)));
    setLoading(false);
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
