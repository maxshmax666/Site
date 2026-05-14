import { describe, expect, it } from "vitest";
import { mainNav, routes } from "./mainNav";

describe("mainNav", () => {
  it("keeps stable public navigation contract", () => {
    expect(mainNav).toMatchInlineSnapshot(`
      [
        {
          "label": "Главная",
          "to": "/",
        },
        {
          "label": "Меню",
          "to": "/#menu",
        },
        {
          "label": "Лояльность",
          "to": "/loyalty",
        },
        {
          "label": "Кейтеринг",
          "to": "/catering",
        },
        {
          "label": "Контакты",
          "to": "/contacts",
        },
      ]
    `);
  });

  it("contains only route constants to avoid drift with router", () => {
    expect(mainNav.map((item) => item.to)).toEqual([
      routes.home,
      routes.menuHash,
      routes.loyalty,
      routes.catering,
      routes.contacts,
    ]);
  });
});
