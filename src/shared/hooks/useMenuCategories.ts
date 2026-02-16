import { useQuery } from "@tanstack/react-query";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError } from "@/lib/queryError";
import { queryKeys } from "@/shared/queryKeys";
import { getMenuCategories, type MenuCategoryItem } from "@/shared/repositories/menuRepository";

export type { MenuCategoryItem };
export const fetchMenuCategories = getMenuCategories;

export function useMenuCategories() {
  const query = useQuery<MenuCategoryItem[], QueryError>({
    queryKey: queryKeys.menu.categories(),
    queryFn: getMenuCategories,
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
