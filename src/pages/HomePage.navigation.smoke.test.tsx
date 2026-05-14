import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Header } from "../app/layout/Header";
import { mainNav } from "../shared/navigation/mainNav";
import { HomePage } from "./HomePage";

vi.mock("../shared/hooks/useMenuItems", () => ({
  useMenuItems: () => ({ items: [] }),
}));

vi.mock("../shared/hooks/useMenuCategories", () => ({
  useMenuCategories: () => ({
    categories: [{ key: "classic", label: "Классика" }],
  }),
}));

describe("navigation smoke", () => {
  it("Header keeps desktop/mobile nav in sync with mainNav", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
      </MemoryRouter>
    );

    for (const item of mainNav) {
      expect(screen.getAllByRole("link", { name: item.label }).length).toBe(1);
    }

    fireEvent.click(screen.getByRole("button", { name: "Меню" }));

    for (const item of mainNav) {
      expect(screen.getAllByRole("link", { name: item.label }).length).toBe(2);
    }
  });

  it("HomePage drawer keeps same key nav items as sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <HomePage />
      </MemoryRouter>
    );

    for (const item of mainNav) {
      expect(screen.getAllByRole("link", { name: item.label }).length).toBe(1);
    }

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));

    for (const item of mainNav) {
      expect(screen.getAllByRole("link", { name: item.label }).length).toBe(2);
    }
  });
});
