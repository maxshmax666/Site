import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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

type DbLoyaltyAccount = {
  id: string;
  points_balance: number;
  lifetime_earned: number;
  tier_name: string;
};

type DbLoyaltyTransaction = {
  id: string;
  created_at: string;
  operation_type: LoyaltyTransaction["type"];
  points_delta: number;
  reason: string;
  order_id: string | null;
};

type UseLoyaltyProgramResult = {
  data: LoyaltyData | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const RULES = [
  "Начисляем 5% баллами за оплаченный заказ после статуса DELIVERED.",
  "1 балл = 1 ₽ скидки на следующий заказ.",
  "Списать можно до 30% суммы заказа (кроме акций и комбо).",
  "В день рождения +300 баллов, если в профиле указана дата минимум за 7 дней.",
];

export function useLoyaltyProgram(userId?: string): UseLoyaltyProgramResult {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      setError("Войдите в аккаунт, чтобы увидеть баланс и историю бонусов.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: account, error: accountError } = await supabase
      .from("loyalty_accounts")
      .select("id,points_balance,lifetime_earned,tier_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (accountError) {
      setError(accountError.message);
      setLoading(false);
      return;
    }

    if (!account) {
      setError("Лояльность для вашего аккаунта ещё не активирована.");
      setData(null);
      setLoading(false);
      return;
    }

    const { data: transactions, error: txError } = await supabase
      .from("loyalty_transactions")
      .select("id,created_at,operation_type,points_delta,reason,order_id")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (txError) {
      setError(txError.message);
      setLoading(false);
      return;
    }

    setData({
      accountId: account.id,
      pointsBalance: Number((account as DbLoyaltyAccount).points_balance ?? 0),
      lifetimeEarned: Number((account as DbLoyaltyAccount).lifetime_earned ?? 0),
      tierName: (account as DbLoyaltyAccount).tier_name,
      rules: RULES,
      transactions: ((transactions ?? []) as DbLoyaltyTransaction[]).map((tx) => ({
        id: tx.id,
        createdAt: tx.created_at,
        type: tx.operation_type,
        points: Number(tx.points_delta ?? 0),
        reason: tx.reason,
        orderId: tx.order_id,
      })),
    });

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      reload: load,
    }),
    [data, error, load, loading],
  );
}
