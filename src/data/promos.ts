export type Promo = {
  id: string;
  title: string;
  desc: string;
  badge?: string;
};

export const promos: Promo[] = [
  { id: "pr1", title: "Подарок к заказу", desc: "Закажи от N ₽ — получи сюрприз.", badge: "АКЦИЯ" },
  { id: "pr2", title: "Комбо выгоднее", desc: "Собери набор: пицца + напиток.", badge: "КОМБО" },
];
