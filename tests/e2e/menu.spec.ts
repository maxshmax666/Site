import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const menuFixture = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tests/fixtures/network/menu.success.json"), "utf-8"),
) as {
  categories: Array<{ key: string; label: string; fullLabel: string; background: string }>;
  items: Array<{ id: string; category: string; title: string; desc: string; priceFrom: number }>;
};

test("menu page renders data from mocked api", async ({ page }) => {
  await page.route("**/api/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(menuFixture),
    });
  });

  await page.goto("/menu");

  await expect(page.getByRole("heading", { name: "Меню" })).toBeVisible();
  await expect(page.getByText("Тестовая пицца")).toBeVisible();
});
