import { describe, expect, it } from "vitest";
import { mapLegacyCategoryToUi, resolveSupportedMenuCategory } from "./menuCategoryLegacy";

describe("menuCategoryLegacy", () => {
  it("maps legacy db categories to ui categories", () => {
    expect(mapLegacyCategoryToUi("pizza")).toBe("classic");
    expect(mapLegacyCategoryToUi("snacks")).toBe("fried");
    expect(mapLegacyCategoryToUi("dessert")).toBe("desserts");
    expect(mapLegacyCategoryToUi("drinks")).toBe("drinks");
  });

  it("falls back to supported categories for legacy enum on save", () => {
    expect(resolveSupportedMenuCategory("classic", ["pizza", "drinks"]))
      .toBe("pizza");
  });
});
