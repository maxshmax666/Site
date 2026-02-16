import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLoyaltyProgram } from "../useLoyaltyProgram";

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

describe("fetchLoyaltyProgram", () => {
  beforeEach(() => {
    supabaseState.hasSupabaseEnv = true;
    const from = vi.fn((table: string) => {
      if (table === "loyalty_accounts") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "account-1",
                  points_balance: 120,
                  lifetime_earned: 780,
                  tier_name: "Silver",
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "loyalty_transactions") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({
                  data: [
                    {
                      id: "tx-1",
                      created_at: "2025-01-01T10:00:00.000Z",
                      operation_type: "accrual",
                      points_delta: 50,
                      reason: "Заказ #1",
                      order_id: "order-1",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    supabaseState.client = { from };
  });

  it("maps loyalty account and transactions", async () => {
    const data = await fetchLoyaltyProgram("user-1");

    expect(data).toMatchObject({
      accountId: "account-1",
      pointsBalance: 120,
      tierName: "Silver",
    });
    expect(data.transactions[0]).toMatchObject({
      id: "tx-1",
      type: "accrual",
      points: 50,
    });
  });
});
