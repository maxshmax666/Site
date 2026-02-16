import { normalizeQueryError } from "@/lib/queryError";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import {
  mapLoyaltyDbToUi,
  type DbLoyaltyAccount,
  type DbLoyaltyTransaction,
  type LoyaltyData,
} from "@/shared/repositories/mappers/loyaltyMapper";

export type { LoyaltyData };

/**
 * Source-of-truth policy:
 * - primary source: Supabase for user-scoped loyalty data
 * - fallback is forbidden: no API/static fallback to avoid exposing stale чужие данные
 */
export async function fetchFromSupabase(userId: string): Promise<LoyaltyData> {
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

  return mapLoyaltyDbToUi(account as DbLoyaltyAccount, ((transactions ?? []) as DbLoyaltyTransaction[]));
}

export async function fetchFromApi(_userId: string): Promise<LoyaltyData> {
  void _userId;
  throw normalizeQueryError(
    { message: "Бонусная программа доступна только через защищённый backend source.", status: 403 },
    {
      baseCode: "LOYALTY_LOAD_FAILED",
      fallbackMessage: "Бонусная программа недоступна.",
    },
  );
}

export async function getLoyaltyProgram(userId: string): Promise<LoyaltyData> {
  return fetchFromSupabase(userId);
}
