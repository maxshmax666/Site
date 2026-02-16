import { useQuery } from "@tanstack/react-query";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError, normalizeQueryError } from "@/lib/queryError";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { queryKeys } from "@/shared/queryKeys";

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

const RULES = [
  "Начисляем 5% баллами за оплаченный заказ после статуса DELIVERED.",
  "1 балл = 1 ₽ скидки на следующий заказ.",
  "Списать можно до 30% суммы заказа (кроме акций и комбо).",
  "В день рождения +300 баллов, если в профиле указана дата минимум за 7 дней.",
];

export async function fetchLoyaltyProgram(userId: string): Promise<LoyaltyData> {
  if (!hasSupabaseEnv || !supabase) {
    throw normalizeQueryError(
      { message: "Supabase не настроен. Бонусная программа недоступна в демо-режиме.", status: null },
      {
        baseCode: "LOYALTY_LOAD_FAILED",
        fallbackMessage: "Бонусная программа недоступна.",
      },
    );
  }

  const { data: account, error: accountError } = await supabase
    .from("loyalty_accounts")
    .select("id,points_balance,lifetime_earned,tier_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) {
    throw normalizeQueryError(accountError, {
      baseCode: "LOYALTY_LOAD_FAILED",
      fallbackMessage: "Не удалось загрузить данные бонусной программы.",
    });
  }

  if (!account) {
    throw normalizeQueryError(
      { message: "Лояльность для вашего аккаунта ещё не активирована.", status: 404 },
      {
        baseCode: "LOYALTY_LOAD_FAILED",
        fallbackMessage: "Лояльность для вашего аккаунта ещё не активирована.",
      },
    );
  }

  const { data: transactions, error: txError } = await supabase
    .from("loyalty_transactions")
    .select("id,created_at,operation_type,points_delta,reason,order_id")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (txError) {
    throw normalizeQueryError(txError, {
      baseCode: "LOYALTY_LOAD_FAILED",
      fallbackMessage: "Не удалось загрузить данные бонусной программы.",
    });
  }

  return {
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
  };
}

export function useLoyaltyProgram(userId?: string) {
  const query = useQuery<LoyaltyData, QueryError>({
    queryKey: queryKeys.loyalty.account(userId ?? "guest"),
    queryFn: () => fetchLoyaltyProgram(userId as string),
    enabled: Boolean(userId),
    ...queryCachePolicy,
  });

  return {
    data: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
