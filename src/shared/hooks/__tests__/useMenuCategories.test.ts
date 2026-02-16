import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { defaultMenuCategories } from "@/data/menuCategories";
import { fetchMenuCategories } from "../useMenuCategories";

const fetchJsonMock = vi.hoisted(() => vi.fn());
const supabaseState = vi.hoisted(() => ({
  client: null as null | { from: ReturnType<typeof vi.fn> },
}));

vi.mock("@/lib/apiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/apiClient")>("@/lib/apiClient");

  return {
    ...actual,
    fetchJson: fetchJsonMock,
  };
});

vi.mock("@/lib/supabase", () => ({
  get supabase() {
    return supabaseState.client;
  },
}));

describe("fetchMenuCategories", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    supabaseState.client = null;
  });

  it("maps api categories", async () => {
    fetchJsonMock.mockResolvedValueOnce({
      categories: [{ key: "classic", label: "Классика", fullLabel: "Классика", imageUrl: "a", background: "b" }],
    });

    await expect(fetchMenuCategories()).resolves.toEqual([
      {
        key: "classic",
        label: "Классика",
        fullLabel: "Классика",
        imageUrl: "a",
        background: "b",
        sort: 10,
      },
    ]);
  });

  it("returns default fallback categories when api and supabase fail", async () => {
    fetchJsonMock.mockRejectedValueOnce(new ApiClientError({ code: "NETWORK_ERROR", message: "network", status: null, url: "/api/menu" }));

    const select = vi.fn(() => ({
      eq: () => ({
        order: async () => ({ data: null, error: { message: "db down", status: 500 } }),
      }),
    }));

    supabaseState.client = { from: vi.fn(() => ({ select })) };

    await expect(fetchMenuCategories()).resolves.toEqual(
      defaultMenuCategories.map((category, idx) => ({
        key: category.value,
        label: category.label,
        fullLabel: category.fullLabel,
        imageUrl: category.imageUrl,
        background: category.fallbackBackground,
        sort: idx * 10 + 10,
      })),
    );
  });
});
