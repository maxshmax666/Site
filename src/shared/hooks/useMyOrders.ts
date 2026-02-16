import { useInfiniteQuery } from "@tanstack/react-query";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError } from "@/lib/queryError";
import { queryKeys } from "@/shared/queryKeys";
import { getMyOrdersPage, PAGE_SIZE, type MyOrder, type MyOrderItem, type OrdersPage } from "@/shared/repositories/ordersRepository";

export type { MyOrder, MyOrderItem, OrdersPage };
export { PAGE_SIZE };
export const fetchMyOrdersPage = getMyOrdersPage;

export function useMyOrders(userId?: string) {
  const query = useInfiniteQuery<OrdersPage, QueryError, OrdersPage, ReturnType<typeof queryKeys.orders.my>, number>({
    queryKey: queryKeys.orders.my(userId ?? "guest", 0),
    queryFn: ({ pageParam = 0 }) => getMyOrdersPage(userId as string, pageParam),
    enabled: Boolean(userId),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.items.length === PAGE_SIZE ? lastPage.nextOffset : undefined),
    ...queryCachePolicy,
  });

  return {
    data: query.data?.pages.flatMap((page) => page.items) ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
