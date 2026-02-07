import { beforeEach, describe, expect, it, vi } from "vitest";
import { menuCategoriesFixture, menuItemsFixture } from "../../../tests/fixtures/supabase";
import { onRequestGet } from "../menu";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

function createMenuClient() {
  return {
    from: (table: string) => {
      if (table === "menu_categories") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: menuCategoriesFixture, error: null }),
            }),
          }),
        };
      }

      if (table === "menu_items") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                order: () => ({
                  order: async () => ({ data: menuItemsFixture, error: null }),
                }),
              }),
            }),
          }),
        };
      }

      throw new Error(`Unknown table ${table}`);
    },
  };
}

describe("GET /api/menu", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns categories and items on happy path", async () => {
    createClientMock.mockReturnValue(createMenuClient());

    const response = await onRequestGet({
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.items).toHaveLength(1);
    expect(json.categories).toHaveLength(1);
  });

  it("returns 500 with diagnostics when env is misconfigured", async () => {
    const response = await onRequestGet({ env: {} } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(response.status).toBeLessThan(600);

    const payload = await response.json();
    expect(payload.code).toBe("MISCONFIGURED_ENV");
    expect(payload.error).toBe("Required runtime environment variables are missing");
    expect(payload.missing).toEqual(expect.arrayContaining(["SUPABASE_URL|API_ORIGIN", "SUPABASE_ANON_KEY"]));
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
