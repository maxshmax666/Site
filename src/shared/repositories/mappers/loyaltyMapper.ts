export type LoyaltyTransaction = {
  id: string;
  createdAt: string;
  type: "accrual" | "redeem" | "adjustment";
  points: number;
  reason: string;
  orderId: string | null;
};

export type LoyaltyData = {
  accountId: string;
  pointsBalance: number;
  lifetimeEarned: number;
  tierName: string;
  rules: string[];
  transactions: LoyaltyTransaction[];
};

export type DbLoyaltyAccount = {
  id: string;
  points_balance: number;
  lifetime_earned: number;
  tier_name: string;
};

export type DbLoyaltyTransaction = {
  id: string;
  created_at: string;
  operation_type: LoyaltyTransaction["type"];
  points_delta: number;
  reason: string;
  order_id: string | null;
};

export const LOYALTY_RULES = [
  "Начисляем 5% баллами за оплаченный заказ после статуса DELIVERED.",
  "1 балл = 1 ₽ скидки на следующий заказ.",
  "Списать можно до 30% суммы заказа (кроме акций и комбо).",
  "В день рождения +300 баллов, если в профиле указана дата минимум за 7 дней.",
];

export function mapLoyaltyDbToUi(account: DbLoyaltyAccount, transactions: DbLoyaltyTransaction[]): LoyaltyData {
  return {
    accountId: account.id,
    pointsBalance: Number(account.points_balance ?? 0),
    lifetimeEarned: Number(account.lifetime_earned ?? 0),
    tierName: account.tier_name,
    rules: LOYALTY_RULES,
    transactions: transactions.map((tx) => ({
      id: tx.id,
      createdAt: tx.created_at,
      type: tx.operation_type,
      points: Number(tx.points_delta ?? 0),
      reason: tx.reason,
      orderId: tx.order_id,
    })),
  };
}
