import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMyOrdersPage, PAGE_SIZE } from "../useMyOrders";
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

describe("fetchMyOrdersPage", () => {
  beforeEach(() => {
    supabaseState.hasSupabaseEnv = true;
    supabaseState.client = createSupabaseMock();
  });

  it("maps paginated orders and items", async () => {
    const page = await fetchMyOrdersPage("user-1", 0);

    expect(page.items).toHaveLength(PAGE_SIZE);
    expect(page.items[0]).toMatchObject({
      id: paginatedOrdersFixture[0]?.id,
      number: paginatedOrdersFixture[0]?.id.slice(0, 8).toUpperCase(),
    });
  });

  it("returns next offset based on loaded rows", async () => {
    const page = await fetchMyOrdersPage("user-1", PAGE_SIZE);

    expect(page.items).toHaveLength(5);
    expect(page.nextOffset).toBe(25);
  });
});
