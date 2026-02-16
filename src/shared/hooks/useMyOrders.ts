import { useInfiniteQuery } from "@tanstack/react-query";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError, normalizeQueryError } from "@/lib/queryError";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { queryKeys } from "@/shared/queryKeys";

type DbOrder = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  address: string | null;
  comment: string | null;
};

type DbOrderItem = {
  order_id: string;
  title: string;
  qty: number;
  price: number;
};

export type MyOrderItem = {
  title: string;
  qty: number;
  price: number;
};

export type MyOrder = {
  id: string;
  number: string;
  createdAt: string;
  status: string;
  total: number;
  address: string | null;
  comment: string | null;
  items: MyOrderItem[];
};

type OrdersPage = {
  items: MyOrder[];
  nextOffset: number;
};

export const PAGE_SIZE = 20;

function toMyOrder(order: DbOrder, items: DbOrderItem[]): MyOrder {
  const orderItems = items
    .filter((item) => item.order_id === order.id)
    .map((item) => ({
      title: item.title,
      qty: Number(item.qty ?? 0),
      price: Number(item.price ?? 0),
    }));

  return {
    id: order.id,
    number: order.id.slice(0, 8).toUpperCase(),
    createdAt: order.created_at,
    status: order.status,
    total: Number(order.total ?? 0),
    address: order.address,
    comment: order.comment,
    items: orderItems,
  };
}

export async function fetchMyOrdersPage(userId: string, offset: number): Promise<OrdersPage> {
  if (!hasSupabaseEnv || !supabase) {
    throw normalizeQueryError(
      { message: "Supabase не настроен. История заказов недоступна в демо-режиме.", status: null },
      {
        baseCode: "MY_ORDERS_LOAD_FAILED",
        fallbackMessage: "Не удалось загрузить историю заказов.",
      },
    );
  }

  const end = offset + PAGE_SIZE - 1;
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id,created_at,status,total,address,comment")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .range(offset, end);

  if (ordersError) {
    throw normalizeQueryError(ordersError, {
      baseCode: "MY_ORDERS_LOAD_FAILED",
      fallbackMessage: "Не удалось загрузить историю заказов.",
    });
  }

  const typedOrders = (orders ?? []) as DbOrder[];
  if (typedOrders.length === 0) {
    return {
      items: [],
      nextOffset: offset,
    };
  }

  const orderIds = typedOrders.map((order) => order.id);
  const { data: itemsData, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id,title,qty,price")
    .in("order_id", orderIds)
    .order("id", { ascending: true });

  if (itemsError) {
    throw normalizeQueryError(itemsError, {
      baseCode: "MY_ORDERS_LOAD_FAILED",
      fallbackMessage: "Не удалось загрузить историю заказов.",
    });
  }

  return {
    items: typedOrders.map((order) => toMyOrder(order, (itemsData ?? []) as DbOrderItem[])),
    nextOffset: offset + typedOrders.length,
  };
}

export function useMyOrders(userId?: string) {
  const query = useInfiniteQuery<OrdersPage, QueryError, OrdersPage, ReturnType<typeof queryKeys.orders.my>, number>({
    queryKey: queryKeys.orders.my(userId ?? "guest", 0),
    queryFn: ({ pageParam = 0 }) => fetchMyOrdersPage(userId as string, pageParam),
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
