import { useCallback, useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

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

type UseMyOrdersResult = {
  data: MyOrder[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
};

const PAGE_SIZE = 20;

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

export function useMyOrders(userId?: string): UseMyOrdersResult {
  const [data, setData] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = useCallback(
    async (nextOffset: number, mode: "append" | "replace") => {
      if (!userId) {
        setData([]);
        setHasMore(false);
        setError(null);
        return;
      }

      if (!hasSupabaseEnv || !supabase) {
        setData([]);
        setHasMore(false);
        setError("Supabase не настроен. История заказов недоступна в демо-режиме.");
        return;
      }

      setLoading(true);
      setError(null);

      const end = nextOffset + PAGE_SIZE - 1;
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id,created_at,status,total,address,comment")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .range(nextOffset, end);

      if (ordersError) {
        setError(ordersError.message);
        setLoading(false);
        return;
      }

      const typedOrders = (orders ?? []) as DbOrder[];
      if (typedOrders.length === 0) {
        setHasMore(false);
        if (mode === "replace") {
          setData([]);
        }
        setLoading(false);
        return;
      }

      const orderIds = typedOrders.map((order) => order.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("order_id,title,qty,price")
        .in("order_id", orderIds)
        .order("id", { ascending: true });

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      const mapped = typedOrders.map((order) => toMyOrder(order, (itemsData ?? []) as DbOrderItem[]));

      setData((prev) => (mode === "append" ? [...prev, ...mapped] : mapped));
      setHasMore(typedOrders.length === PAGE_SIZE);
      setOffset(nextOffset + typedOrders.length);
      setLoading(false);
    },
    [userId],
  );

  const reload = useCallback(async () => {
    setOffset(0);
    await loadPage(0, "replace");
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadPage(offset, "append");
  }, [hasMore, loadPage, loading, offset]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      hasMore,
      loadMore,
      reload,
    }),
    [data, error, hasMore, loadMore, loading, reload],
  );
}
