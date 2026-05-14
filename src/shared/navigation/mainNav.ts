export const routes = {
  home: "/",
  menu: "/menu",
  menuHash: "/#menu",
  loyalty: "/loyalty",
  catering: "/catering",
  contacts: "/contacts",
  cart: "/cart",
  checkout: "/checkout",
  login: "/login",
  profile: "/profile",
  resetPassword: "/reset-password",
  admin: "/admin",
} as const;

export type MainNavItem = {
  to: typeof routes.home | typeof routes.menuHash | typeof routes.loyalty | typeof routes.catering | typeof routes.contacts;
  label: "Главная" | "Меню" | "Лояльность" | "Кейтеринг" | "Контакты";
};

export const mainNav = [
  { to: routes.home, label: "Главная" },
  { to: routes.menuHash, label: "Меню" },
  { to: routes.loyalty, label: "Лояльность" },
  { to: routes.catering, label: "Кейтеринг" },
  { to: routes.contacts, label: "Контакты" },
] as const satisfies readonly MainNavItem[];
