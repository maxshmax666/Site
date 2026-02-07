export type SupabaseOrderRow = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  address: string | null;
  comment: string | null;
};

export type SupabaseOrderItemRow = {
  order_id: string;
  title: string;
  qty: number;
  price: number;
};

export const menuCategoriesFixture = [
  {
    key: "pizza",
    label: "Пицца",
    full_label: "Пицца",
    image_url: null,
    fallback_background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
  },
];

export const menuItemsFixture = [
  {
    id: "pizza-1",
    title: "Маргарита",
    description: "Томаты и моцарелла",
    category: "pizza",
    price: 490,
    image_url: null,
  },
];

export const paginatedOrdersFixture: SupabaseOrderRow[] = Array.from({ length: 25 }).map((_, idx) => ({
  id: `order-${idx + 1}`,
  created_at: `2026-02-0${(idx % 9) + 1}T10:00:00.000Z`,
  status: "new",
  total: 100 + idx,
  address: "ул. Ленина, 1",
  comment: null,
}));

export const paginatedOrderItemsFixture: SupabaseOrderItemRow[] = paginatedOrdersFixture.map((order, idx) => ({
  order_id: order.id,
  title: `Позиция ${idx + 1}`,
  qty: 1,
  price: 100 + idx,
}));

export const supabaseErrorFixture = {
  message: "Supabase exploded",
  status: 503,
  code: "E_DB_DOWN",
};
