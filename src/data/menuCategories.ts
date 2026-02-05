export type MenuCategoryMeta = {
  value: string;
  label: string;
  fullLabel: string;
  imageUrl?: string;
  fallbackBackground: string;
};

export const defaultMenuCategories = [
  {
    value: "classic",
    label: "Классические",
    fullLabel: "Классические пиццы",
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)",
  },
  {
    value: "signature",
    label: "Фирменные",
    fullLabel: "Фирменные пиццы",
    imageUrl:
      "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #9a3412 0%, #7f1d1d 100%)",
  },
  {
    value: "roman",
    label: "Римские",
    fullLabel: "Римские пиццы",
    imageUrl:
      "https://images.unsplash.com/photo-1598023696416-0193a0bcd302?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #713f12 0%, #422006 100%)",
  },
  {
    value: "seasonal",
    label: "Сезонные",
    fullLabel: "Сезонные пиццы",
    imageUrl:
      "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
  },
  {
    value: "cold",
    label: "Холодные",
    fullLabel: "Холодная пицца",
    imageUrl:
      "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
  },
  {
    value: "fried",
    label: "Жареные",
    fullLabel: "Жареные закуски",
    imageUrl:
      "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
  },
  {
    value: "desserts",
    label: "Сладости",
    fullLabel: "Сладости",
    imageUrl:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #db2777 0%, #9d174d 100%)",
  },
  {
    value: "drinks",
    label: "Напитки",
    fullLabel: "Напитки",
    imageUrl:
      "https://images.unsplash.com/photo-1551024709-8f23befc6cf7?auto=format&fit=crop&w=1600&q=80",
    fallbackBackground: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
  },
] as const satisfies readonly MenuCategoryMeta[];

export type MenuCategory = (typeof defaultMenuCategories)[number]["value"];

export const menuCategoryList = defaultMenuCategories.map(({ value, label }) => ({ value, label })) as ReadonlyArray<{
  value: MenuCategory;
  label: string;
}>;

const menuCategorySet = new Set<MenuCategory>(menuCategoryList.map((category) => category.value));

export function isMenuCategory(value: string): value is MenuCategory {
  return menuCategorySet.has(value as MenuCategory);
}
