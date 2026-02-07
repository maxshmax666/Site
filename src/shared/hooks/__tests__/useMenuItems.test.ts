import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/apiClient";
import { useMenuItems } from "../useMenuItems";

const fetchJsonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/apiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/apiClient")>("@/lib/apiClient");

  return {
    ...actual,
    fetchJson: fetchJsonMock,
  };
});

describe("useMenuItems", () => {
  beforeEach(() => {
    fetchJsonMock.mockReset();
  });

  it("loads menu items successfully", async () => {
    fetchJsonMock.mockResolvedValueOnce({
      items: [{ id: "pizza-1", category: "pizza", title: "Маргарита", desc: "", priceFrom: 490 }],
    });

    const { result } = renderHook(() => useMenuItems());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.title).toBe("Маргарита");
    expect(result.current.error).toBeNull();
  });

  it("returns timeout diagnostic error", async () => {
    fetchJsonMock.mockRejectedValueOnce(
      new ApiClientError({
        code: "TIMEOUT",
        message: "Request timed out",
        status: null,
        url: "/api/menu",
      }),
    );

    const { result } = renderHook(() => useMenuItems());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.error?.code).toBe("MENU_LOAD_FAILED:TIMEOUT");
  });


  it("returns configuration-specific fallback message on 5xx", async () => {
    fetchJsonMock.mockRejectedValueOnce(
      new ApiClientError({
        code: "HTTP_ERROR",
        message: "Request failed with status 500",
        status: 500,
        url: "/api/menu",
      }),
    );

    const { result } = renderHook(() => useMenuItems());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.code).toBe("MENU_LOAD_FAILED:HTTP_ERROR");
    expect(result.current.error?.message).toBe("Сервис меню временно недоступен: ошибка конфигурации сервера.");
  });

  it("handles invalid json/content-type errors", async () => {
    fetchJsonMock.mockRejectedValueOnce(
      new ApiClientError({
        code: "INVALID_JSON",
        message: "Invalid JSON",
        status: 200,
        url: "/api/menu",
      }),
    );

    const { result, rerender } = renderHook(() => useMenuItems());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.code).toBe("MENU_LOAD_FAILED:INVALID_JSON");

    fetchJsonMock.mockRejectedValueOnce(
      new ApiClientError({
        code: "INVALID_CONTENT_TYPE",
        message: "Invalid content-type",
        status: 200,
        url: "/api/menu",
      }),
    );

    await result.current.reload();
    rerender();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.code).toBe("MENU_LOAD_FAILED:INVALID_CONTENT_TYPE");
  });
});
