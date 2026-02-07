import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { paginatedOrderItemsFixture, paginatedOrdersFixture, supabaseErrorFixture } from "../../../../tests/fixtures/supabase";
import { useMyOrders } from "../useMyOrders";

const supabaseState = vi.hoisted(() => ({
  hasSupabaseEnv: true,
  client: null as null | { from: ReturnType<typeof vi.fn> },
}));

vi.mock("@/lib/supabase", () => ({
  get hasSupabaseEnv() {
    return supabaseState.hasSupabaseEnv;
  },
  get supabase() {
    return supabaseState.client;
  },
}));

type OrdersResponse = { data: unknown[] | null; error: { message: string; status?: number } | null };

type SupabaseMockOptions = {
  ordersPages?: unknown[][];
  ordersError?: { message: string; status?: number } | null;
};

function createSupabaseMock(options: SupabaseMockOptions = {}) {
  const orderPages = [...(options.ordersPages ?? [paginatedOrdersFixture.slice(0, 20), paginatedOrdersFixture.slice(20)])];
  const from = vi.fn((table: string) => {
    if (table === "orders") {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              range: async (): Promise<OrdersResponse> => {
                if (options.ordersError) {
                  return { data: null, error: options.ordersError };
                }

                const page = orderPages.shift() ?? [];
                return { data: page, error: null };
              },
            }),
          }),
        }),
      };
    }

    if (table === "order_items") {
      return {
        select: () => ({
          in: (_: string, ids: string[]) => ({
            order: async () => ({
              data: paginatedOrderItemsFixture.filter((item) => ids.includes(item.order_id)),
              error: null,
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { from };
}

describe("useMyOrders", () => {
  beforeEach(() => {
    supabaseState.hasSupabaseEnv = true;
    supabaseState.client = createSupabaseMock();
  });

  it("returns empty state when userId is missing", async () => {
    const fromSpy = vi.fn();
    supabaseState.client = { from: fromSpy };

    const { result } = renderHook(() => useMyOrders(""));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it("supports pagination and loadMore", async () => {
    supabaseState.client = createSupabaseMock();

    const { result } = renderHook(() => useMyOrders("user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(20);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(25);
    expect(result.current.hasMore).toBe(false);
  });

  it("returns Supabase error from orders query", async () => {
    supabaseState.client = createSupabaseMock({
      ordersError: { message: supabaseErrorFixture.message, status: supabaseErrorFixture.status },
    });

    const { result } = renderHook(() => useMyOrders("user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toEqual({
      message: supabaseErrorFixture.message,
      status: supabaseErrorFixture.status,
    });
    expect(result.current.data).toEqual([]);
  });
});
