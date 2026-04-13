export type MainNavItem = {
  to: "/" | "/#menu" | "/loyalty" | "/catering" | "/contacts";
  label: "Главная" | "Меню" | "Лояльность" | "Кейтеринг" | "Контакты";
};

export const mainNav: MainNavItem[] = [
  { to: "/", label: "Главная" },
  { to: "/#menu", label: "Меню" },
  { to: "/loyalty", label: "Лояльность" },
  { to: "/catering", label: "Кейтеринг" },
  { to: "/contacts", label: "Контакты" },
];
