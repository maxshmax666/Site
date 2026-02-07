import { test, expect } from "@playwright/test";

const menuFixture = {
  categories: [
    {
      key: "pizza",
      label: "Пицца",
      fullLabel: "Пицца",
      background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
    },
  ],
  items: [
    {
      id: "pizza-e2e-1",
      category: "pizza",
      title: "Тестовая пицца",
      desc: "E2E fixture",
      priceFrom: 555,
    },
  ],
};

test("menu page renders data from mocked api", async ({ page }) => {
  await page.route("**/api/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(menuFixture),
    });
  });

  await page.goto("/menu");

  await expect(page.getByRole("heading", { name: "Меню" })).toBeVisible();
  await expect(page.getByText("Тестовая пицца")).toBeVisible();
});
