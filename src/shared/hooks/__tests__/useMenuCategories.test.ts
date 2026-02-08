import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { defaultMenuCategories } from "@/data/menuCategories";
import { useMenuCategories } from "../useMenuCategories";

const fetchJsonMock = vi.hoisted(() => vi.fn());
const supabaseState = vi.hoisted(() => ({
  client: null as
    | null
    | {
        from: ReturnType<typeof vi.fn>;
      },
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

describe("useMenuCategories", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
    supabaseState.client = null;
  });

  it("returns configuration-specific fallback message on 5xx", async () => {
    fetchJsonMock.mockRejectedValueOnce(
      new ApiClientError({
        code: "HTTP_ERROR",
        message: "Request failed with status 503",
        status: 503,
        url: "/api/menu",
      }),
    );

    const { result } = renderHook(() => useMenuCategories());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.code).toBe("MENU_CATEGORIES_LOAD_FAILED:HTTP_ERROR");
    expect(result.current.error?.message).toBe("Сервис категорий временно недоступен: ошибка конфигурации сервера.");
  });

  it("keeps default fallback categories when API and Supabase both fail", async () => {
    fetchJsonMock.mockRejectedValueOnce(
      new ApiClientError({
        code: "HTTP_ERROR",
        message: "Request failed with status 500",
        status: 500,
        url: "/api/menu",
      }),
    );

    const select = vi.fn(() => ({
      eq: () => ({
        order: async () => ({
          data: null,
          error: { message: "supabase unavailable", status: 500 },
        }),
      }),
    }));

    supabaseState.client = {
      from: vi.fn(() => ({ select })),
    };

    const { result } = renderHook(() => useMenuCategories());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.categories).toEqual(
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
