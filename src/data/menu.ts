import { menuCategoryList, type MenuCategory } from "./menuCategories";

export type MenuItem = {
  id: string;
  category: MenuCategory;
  title: string;
  desc: string;
  priceFrom: number;
  badges?: Array<"hit" | "new" | "spicy">;
  // Фоны задаём текстовыми градиентами или data-URI, чтобы избегать бинарников в PR.
  background?: string;
};

// Фоны категорий — текстовые градиенты, чтобы не тащить бинарные ассеты в PR.
const categoryBackgrounds: Record<MenuCategory, string> = {
  classic: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
  signature: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
  roman: "linear-gradient(135deg, #9a3412 0%, #431407 100%)",
  seasonal: "linear-gradient(135deg, #047857 0%, #064e3b 100%)",
  cold: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
  fried: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
  desserts: "linear-gradient(135deg, #db2777 0%, #9d174d 100%)",
  drinks: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
};

export const categories: Array<{ key: MenuCategory; label: string; background: string }> =
  menuCategoryList.map(({ value, label }) => ({
    key: value,
    label,
    background: categoryBackgrounds[value],
  }));

export const menu: MenuItem[] = [
  {
    id: "c1",
    category: "classic",
    title: "Маргарита",
    desc: "Соус • моцарелла • базилик",
    priceFrom: 520,
    badges: ["hit"],
  },
  {
    id: "c2",
    category: "classic",
    title: "Пепперони",
    desc: "Пикантная салями • моцарелла • соус",
    priceFrom: 590,
  },

  {
    id: "sg1",
    category: "signature",
    title: "Тагильская фирменная",
    desc: "Говядина • соус BBQ • халапеньо",
    priceFrom: 690,
    badges: ["new"],
  },
  {
    id: "sg2",
    category: "signature",
    title: "Сырный дым",
    desc: "Копчёная курица • моцарелла • пармезан",
    priceFrom: 640,
  },

  {
    id: "r1",
    category: "roman",
    title: "Римская прошутто",
    desc: "Прошутто • руккола • пармезан",
    priceFrom: 720,
  },
  {
    id: "r2",
    category: "roman",
    title: "Римская грибная",
    desc: "Шампиньоны • трюфельный соус",
    priceFrom: 680,
  },

  {
    id: "se1",
    category: "seasonal",
    title: "Осенняя тыквенная",
    desc: "Тыква • бекон • сливочный соус",
    priceFrom: 610,
  },
  {
    id: "se2",
    category: "seasonal",
    title: "Летняя с томатами",
    desc: "Свежие томаты • базилик • фета",
    priceFrom: 590,
  },

  {
    id: "cl1",
    category: "cold",
    title: "Салат Цезарь",
    desc: "Курица • ромэн • соус цезарь",
    priceFrom: 310,
  },
  {
    id: "cl2",
    category: "cold",
    title: "Салат греческий",
    desc: "Фета • огурцы • оливки",
    priceFrom: 290,
  },

  {
    id: "fr1",
    category: "fried",
    title: "Картофель фри",
    desc: "Соль • соус на выбор",
    priceFrom: 190,
  },
  {
    id: "fr2",
    category: "fried",
    title: "Куриные наггетсы",
    desc: "6 шт • соус барбекю",
    priceFrom: 260,
    badges: ["spicy"],
  },

  {
    id: "ds1",
    category: "desserts",
    title: "Чизкейк Нью-Йорк",
    desc: "Сливочный крем • ягодный соус",
    priceFrom: 210,
  },
  {
    id: "ds2",
    category: "desserts",
    title: "Брауни",
    desc: "Шоколад • мороженое",
    priceFrom: 190,
  },

  {
    id: "dr1",
    category: "drinks",
    title: "Кола 0.5",
    desc: "Классическая • охлаждённая",
    priceFrom: 120,
  },
  {
    id: "dr2",
    category: "drinks",
    title: "Домашний морс",
    desc: "Клюква • мята",
    priceFrom: 140,
  },
];
