import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { useMenuCategories } from "../useMenuCategories";

const fetchJsonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/apiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/apiClient")>("@/lib/apiClient");

  return {
    ...actual,
    fetchJson: fetchJsonMock,
  };
});

describe("useMenuCategories", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
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
});
