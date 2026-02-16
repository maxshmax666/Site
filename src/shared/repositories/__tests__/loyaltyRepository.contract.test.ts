import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFromApi, fetchFromSupabase, getLoyaltyProgram } from "@/shared/repositories/loyaltyRepository";

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

describe("loyaltyRepository contract", () => {
  beforeEach(() => {
    supabaseState.hasSupabaseEnv = true;
    supabaseState.client = {
      from: vi.fn((table: string) => {
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
      }),
    };
  });

  it("returns stable loyalty shape from supabase source", async () => {
    const payload = await fetchFromSupabase("user-1");

    expect(payload).toMatchObject({
      accountId: "account-1",
      pointsBalance: 120,
      lifetimeEarned: 780,
      tierName: "Silver",
    });
    expect(payload.transactions[0]).toMatchObject({ id: "tx-1", type: "accrual", points: 50 });
  });

  it("getLoyaltyProgram delegates to selected source", async () => {
    const payload = await getLoyaltyProgram("user-1");
    expect(Array.isArray(payload.rules)).toBe(true);
  });

  it("forbids api fallback for protected dataset", async () => {
    await expect(fetchFromApi("user-1")).rejects.toMatchObject({ status: 403, code: "LOYALTY_LOAD_FAILED:SUPABASE" });
  });
});
