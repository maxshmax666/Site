export type OrderStatus =
  | "NEW"
  | "COOKING"
  | "READY"
  | "COURIER"
  | "DELIVERED"
  | "CANCELLED";

export const statusLabel: Record<OrderStatus, string> = {
  NEW: "Новый",
  COOKING: "Готовится",
  READY: "Готово",
  COURIER: "У курьера",
  DELIVERED: "Доставлено",
  CANCELLED: "Отменено",
};

export const statusFlow: OrderStatus[] = ["NEW", "COOKING", "READY", "COURIER", "DELIVERED"];
