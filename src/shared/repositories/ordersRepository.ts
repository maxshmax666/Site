import { normalizeQueryError } from "@/lib/queryError";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import {
  mapOrderDbToUi,
  type DbOrder,
  type DbOrderItem,
  type MyOrder,
  type MyOrderItem,
  type OrdersPage,
} from "@/shared/repositories/mappers/ordersMapper";

export type { MyOrder, MyOrderItem, OrdersPage };


export const PAGE_SIZE = 20;

/**
 * Source-of-truth policy:
 * - primary source: Supabase for user-scoped orders (RLS protected)
 * - fallback is forbidden: returning another source risks data leaks and broken authorization boundaries
 */
export async function fetchFromSupabase(userId: string, offset: number): Promise<OrdersPage> {
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
    return { items: [], nextOffset: offset };
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
    items: typedOrders.map((order) => mapOrderDbToUi(order, (itemsData ?? []) as DbOrderItem[])),
    nextOffset: offset + typedOrders.length,
  };
}

export async function fetchFromApi(_userId: string, _offset: number): Promise<OrdersPage> {
  void _userId;
  void _offset;
  throw normalizeQueryError(
    { message: "История заказов доступна только через защищённый backend source.", status: 403 },
    {
      baseCode: "MY_ORDERS_LOAD_FAILED",
      fallbackMessage: "Не удалось загрузить историю заказов.",
    },
  );
}

export async function getMyOrdersPage(userId: string, offset: number): Promise<OrdersPage> {
  return fetchFromSupabase(userId, offset);
}
