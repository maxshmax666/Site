import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMenuPage } from "./AdminMenuPage";

type DbError = { code?: string; message?: string };

const state = vi.hoisted(() => ({
  menuItems: [
    {
      id: "item-1",
      created_at: "2025-01-01T00:00:00.000Z",
      title: "Тестовая позиция",
      description: null,
      category: "classic",
      price: 590,
      image_url: null,
      is_active: true,
      sort: 10,
    },
  ],
  categories: [
    { key: "pizza", label: "Пицца" },
    { key: "drinks", label: "Напитки" },
  ],
  saveError: null as DbError | null,
  lastUpdatePayload: null as Record<string, unknown> | null,
}));

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn((table: string) => {
    if (table === "menu_items") {
      return {
        select: vi.fn(() => {
          const builder = {
            order: vi.fn(() => builder),
            limit: vi.fn(async () => ({ data: state.menuItems, error: null })),
          };
          return builder;
        }),
        update: vi.fn((payload: Record<string, unknown>) => {
          state.lastUpdatePayload = payload;
          return {
            eq: vi.fn(async () => ({ error: state.saveError })),
          };
        }),
        insert: vi.fn(async () => ({ error: null })),
        delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
      };
    }

    if (table === "menu_categories") {
      return {
        select: vi.fn(() => ({
          order: vi.fn(async () => ({ data: state.categories, error: null })),
        })),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  }),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(async () => ({ error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/image.jpg" } })),
    })),
  },
}));

vi.mock("../../lib/supabase", () => ({
  supabase: supabaseMock,
}));

vi.mock("../../shared/hooks/useSchemaPreflight", () => ({
  useSchemaPreflight: () => ({ schemaMismatch: false, message: null }),
}));

describe("AdminMenuPage", () => {
  beforeEach(() => {
    state.saveError = null;
    state.lastUpdatePayload = null;
    supabaseMock.from.mockClear();
  });

  it("updates item with legacy category using supported category and shows success", async () => {
    render(<AdminMenuPage />);

    await screen.findByText("Тестовая позиция");
    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(state.lastUpdatePayload?.category).toBe("pizza");
    });

    expect(await screen.findByText("Позиция обновлена")).toBeTruthy();
  });

  it("shows explicit migration error for invalid enum during edit", async () => {
    state.saveError = { code: "22P02", message: 'invalid input value for enum menu_category: "classic"' };

    render(<AdminMenuPage />);

    await screen.findByText("Тестовая позиция");
    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Категория не поддерживается текущей схемой. Обновите категории меню или примените миграцию menu_category.")).toBeTruthy();
  });
});
