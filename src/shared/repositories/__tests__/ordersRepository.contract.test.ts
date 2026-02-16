import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFromApi, fetchFromSupabase, getMyOrdersPage, PAGE_SIZE } from "@/shared/repositories/ordersRepository";
import { paginatedOrderItemsFixture, paginatedOrdersFixture } from "../../../../tests/fixtures/supabase";

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

function createSupabaseMock() {
  const from = vi.fn((table: string) => {
    if (table === "orders") {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              range: async (start: number, end: number) => ({
                data: paginatedOrdersFixture.slice(start, end + 1),
                error: null,
              }),
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

describe("ordersRepository contract", () => {
  beforeEach(() => {
    supabaseState.hasSupabaseEnv = true;
    supabaseState.client = createSupabaseMock();
  });

  it("returns stable page shape for user scoped supabase source", async () => {
    const page = await fetchFromSupabase("user-1", 0);

    expect(page.items).toHaveLength(PAGE_SIZE);
    expect(page.nextOffset).toBe(PAGE_SIZE);
    expect(page.items[0]).toHaveProperty("items");
  });

  it("getMyOrdersPage delegates to selected source", async () => {
    const page = await getMyOrdersPage("user-1", PAGE_SIZE);
    expect(page.items).toHaveLength(5);
    expect(page.nextOffset).toBe(25);
  });

  it("forbids api fallback for protected dataset", async () => {
    await expect(fetchFromApi("user-1", 0)).rejects.toMatchObject({ status: 403, code: "MY_ORDERS_LOAD_FAILED:SUPABASE" });
  });
});
