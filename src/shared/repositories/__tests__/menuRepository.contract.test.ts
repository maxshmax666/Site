import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFromApi, fetchFromSupabase, getMenuCategories, getMenuItems } from "@/shared/repositories/menuRepository";

const fetchJsonMock = vi.hoisted(() => vi.fn());
const supabaseState = vi.hoisted(() => ({
  client: null as null | { from: ReturnType<typeof vi.fn> },
}));

vi.mock("@/lib/apiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/apiClient")>("@/lib/apiClient");
  return { ...actual, fetchJson: fetchJsonMock };
});

vi.mock("@/lib/supabase", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase")>("@/lib/supabase");
  return {
    ...actual,
    get supabase() {
      return supabaseState.client;
    },
  };
});

describe("menuRepository contract", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    supabaseState.client = null;
  });

  it("returns identical category shape from api and supabase", async () => {
    fetchJsonMock.mockResolvedValueOnce({
      categories: [{ key: "classic", label: "Классика", fullLabel: "Классика", imageUrl: "a", background: "bg" }],
    });

    supabaseState.client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [
                {
                  key: "classic",
                  label: "Классика",
                  full_label: "Классика",
                  image_url: "a",
                  fallback_background: "bg",
                  sort: 10,
                },
              ],
              error: null,
            }),
          }),
        }),
      })),
    };

    const api = await fetchFromApi("categories");
    const db = await fetchFromSupabase("categories");

    expect(api[0]).toEqual(db[0]);
  });

  it("returns identical item shape from api and supabase", async () => {
    fetchJsonMock.mockResolvedValueOnce({
      items: [{ id: "1", title: "Маргарита", desc: "x", category: "classic", priceFrom: 490, image: "img" }],
    });

    supabaseState.client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              order: () => ({
                order: async () => ({
                  data: [
                    {
                      id: "1",
                      title: "Маргарита",
                      description: "x",
                      category: "pizza",
                      price: 490,
                      image_url: "img",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })),
    };

    const api = await fetchFromApi("items");
    const db = await fetchFromSupabase("items");

    expect(api[0]).toEqual(db[0]);
  });

  it("getMenuCategories falls back to defaults when sources fail", async () => {
    fetchJsonMock.mockRejectedValueOnce(new Error("down"));
    await expect(getMenuCategories()).resolves.not.toHaveLength(0);
  });

  it("getMenuItems normalizes upstream api failure", async () => {
    fetchJsonMock.mockRejectedValueOnce(new Error("down"));
    await expect(getMenuItems()).rejects.toMatchObject({ code: "MENU_LOAD_FAILED:SUPABASE" });
  });
});
