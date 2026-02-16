import { useQuery } from "@tanstack/react-query";
import { queryCachePolicy } from "@/lib/queryClient";
import { type QueryError } from "@/lib/queryError";
import { queryKeys } from "@/shared/queryKeys";
import { getLoyaltyProgram, type LoyaltyData } from "@/shared/repositories/loyaltyRepository";

export type { LoyaltyData };
export const fetchLoyaltyProgram = getLoyaltyProgram;

export function useLoyaltyProgram(userId?: string) {
  const query = useQuery<LoyaltyData, QueryError>({
    queryKey: queryKeys.loyalty.account(userId ?? "guest"),
    queryFn: () => getLoyaltyProgram(userId as string),
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
