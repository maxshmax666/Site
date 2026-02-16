export type DbOrder = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  address: string | null;
  comment: string | null;
};

export type DbOrderItem = {
  order_id: string;
  title: string;
  qty: number;
  price: number;
};

export type MyOrderItem = {
  title: string;
  qty: number;
  price: number;
};

export type MyOrder = {
  id: string;
  number: string;
  createdAt: string;
  status: string;
  total: number;
  address: string | null;
  comment: string | null;
  items: MyOrderItem[];
};

export type OrdersPage = {
  items: MyOrder[];
  nextOffset: number;
};

export function mapOrderDbToUi(order: DbOrder, items: DbOrderItem[]): MyOrder {
  const orderItems = items
    .filter((item) => item.order_id === order.id)
    .map((item) => ({
      title: item.title,
      qty: Number(item.qty ?? 0),
      price: Number(item.price ?? 0),
    }));

  return {
    id: order.id,
    number: order.id.slice(0, 8).toUpperCase(),
    createdAt: order.created_at,
    status: order.status,
    total: Number(order.total ?? 0),
    address: order.address,
    comment: order.comment,
    items: orderItems,
  };
}
