import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { fetchMenuItems } from "../useMenuItems";

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
  hasSupabaseEnv: true,
  get supabase() {
    return supabaseState.client;
  },
}));

describe("fetchMenuItems", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    supabaseState.client = null;
  });

  it("returns api payload", async () => {
    fetchJsonMock.mockResolvedValueOnce({
      items: [{ id: "pizza-1", category: "classic", title: "Маргарита", desc: "", priceFrom: 490 }],
    });

    await expect(fetchMenuItems()).resolves.toHaveLength(1);
  });

  it("maps supabase fallback on api failure", async () => {
    fetchJsonMock.mockRejectedValueOnce(new ApiClientError({ code: "TIMEOUT", message: "timeout", status: null, url: "/api/menu" }));

    const select = vi.fn(() => ({
      eq: () => ({
        order: () => ({
          order: () => ({
            order: async () => ({
              data: [{ id: "1", title: "Четыре сыра", description: "desc", category: "pizza", price: 700, image_url: null }],
              error: null,
            }),
          }),
        }),
      }),
    }));

    supabaseState.client = { from: vi.fn(() => ({ select })) };

    await expect(fetchMenuItems()).resolves.toEqual([
      {
        id: "1",
        title: "Четыре сыра",
        desc: "desc",
        category: "classic",
        priceFrom: 700,
        image: undefined,
      },
    ]);
  });

  it("throws normalized query error", async () => {
    fetchJsonMock.mockRejectedValueOnce(
      new ApiClientError({
        code: "HTTP_ERROR",
        message: "Request failed with status 500",
        status: 500,
        url: "/api/menu",
      }),
    );

    await expect(fetchMenuItems()).rejects.toMatchObject({
      code: "MENU_LOAD_FAILED:HTTP_ERROR",
      message: "Сервис меню временно недоступен: ошибка конфигурации сервера.",
      status: 500,
    });
  });
});
