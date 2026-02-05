export const menuCategoryList = [
  { value: "classic", label: "Классика" },
  { value: "signature", label: "Фирменные" },
  { value: "roman", label: "Римская" },
  { value: "seasonal", label: "Сезонные" },
  { value: "cold", label: "Холодные" },
  { value: "fried", label: "Жареные" },
  { value: "desserts", label: "Десерты" },
  { value: "drinks", label: "Напитки" },
] as const;

export type MenuCategory = (typeof menuCategoryList)[number]["value"];

const menuCategorySet = new Set<MenuCategory>(menuCategoryList.map((category) => category.value));

export function isMenuCategory(value: string): value is MenuCategory {
  return menuCategorySet.has(value as MenuCategory);
}
