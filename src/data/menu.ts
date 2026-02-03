export type MenuCategory = "pizza" | "snacks" | "drinks" | "desserts" | "other";

export type MenuItem = {
  id: string;
  category: MenuCategory;
  title: string;
  desc: string;
  priceFrom: number;
  badges?: Array<"hit" | "new" | "spicy">;
  image?: string; // placeholder
};

export const categories: Array<{ key: MenuCategory; label: string }> = [
  { key: "pizza", label: "Пицца" },
  { key: "snacks", label: "Закуски" },
  { key: "drinks", label: "Напитки" },
  { key: "desserts", label: "Десерты" },
  { key: "other", label: "Другое" },
];

export const menu: MenuItem[] = [
  { id: "p1", category: "pizza", title: "Пицца №1", desc: "Соус • сыр • колбаса", priceFrom: 499, badges: ["hit"] },
  { id: "p2", category: "pizza", title: "Пицца №2", desc: "Соус • сыр • грибы", priceFrom: 519 },
  { id: "p3", category: "pizza", title: "Пицца №3", desc: "Соус • сыр • мясо", priceFrom: 549, badges: ["new"] },
  { id: "p4", category: "pizza", title: "Пицца №4", desc: "Соус • сыр • курица", priceFrom: 539, badges: ["spicy"] },

  { id: "s1", category: "snacks", title: "Закуска №1", desc: "Картофель / наггетсы", priceFrom: 199 },
  { id: "s2", category: "snacks", title: "Закуска №2", desc: "Сырные палочки", priceFrom: 239 },

  { id: "d1", category: "drinks", title: "Напиток №1", desc: "Газировка / сок", priceFrom: 99 },
  { id: "d2", category: "drinks", title: "Напиток №2", desc: "Морс / вода", priceFrom: 89 },

  { id: "ds1", category: "desserts", title: "Десерт №1", desc: "Печенье / чизкейк", priceFrom: 179 },

  { id: "sc1", category: "other", title: "Соус №1", desc: "Чесночный / сырный", priceFrom: 49 },
];
