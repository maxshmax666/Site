import { defaultMenuCategories, menuCategoryList, type MenuCategory } from "./menuCategories";

export type MenuItem = {
  id: string;
  category: string;
  title: string;
  desc: string;
  priceFrom: number;
  badges?: Array<"hit" | "new" | "spicy">;
  // Фоны задаём текстовыми градиентами или удалёнными URL, чтобы избегать бинарников в PR.
  background?: string;
  image?: string;
};

export const categories: Array<{ key: MenuCategory; label: string; fullLabel: string; background: string; imageUrl?: string }> =
  defaultMenuCategories.map((category) => ({
    key: category.value,
    label: category.label,
    fullLabel: category.fullLabel,
    background: category.fallbackBackground,
    imageUrl: category.imageUrl,
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
