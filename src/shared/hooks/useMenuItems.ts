import { useQuery } from "@tanstack/react-query";
import { type MenuItem } from "@/data/menu";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError } from "@/lib/queryError";
import { hasSupabaseEnv } from "@/lib/supabase";
import { queryKeys, type MenuItemsFilters } from "@/shared/queryKeys";
import { getMenuItems } from "@/shared/repositories/menuRepository";

export const fetchMenuItems = getMenuItems;

export function useMenuItems(filters?: MenuItemsFilters) {
  const query = useQuery<MenuItem[], QueryError>({
    queryKey: queryKeys.menu.items(filters),
    queryFn: getMenuItems,
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
