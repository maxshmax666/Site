import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/auth.store";
import { useLoyaltyProgram } from "../shared/hooks/useLoyaltyProgram";

function pointsTone(value: number) {
  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

export function LoyaltyPage() {
  const user = useAuthStore((state) => state.user);
  const { data, loading, error, reload } = useLoyaltyProgram(user?.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Программа лояльности</h1>
          <div className="mt-2 text-white/70">Баланс, правила начислений и история операций из базы.</div>
        </div>
        <Badge tone="green">LIVE</Badge>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="text-xl font-bold">Текущий баланс</div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
              <div className="text-sm text-amber-100">{error}</div>
              <div className="mt-4">
                <Button variant="soft" onClick={() => void reload()} disabled={loading}>
                  {loading ? "Повторяем..." : "Повторить"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 text-4xl font-black text-emerald-300">{data?.pointsBalance ?? 0} баллов</div>
              <div className="mt-2 text-white/70">Уровень: {data?.tierName ?? "—"}</div>
              <div className="mt-1 text-white/70">Начислено за всё время: {data?.lifetimeEarned ?? 0}</div>
            </>
          )}

          <div className="mt-6">
            <div className="font-semibold">Правила начисления</div>
            <ul className="mt-3 space-y-2 text-white/80 text-sm list-disc pl-5">
              {(data?.rules ?? []).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="text-xl font-bold">История операций</div>

          {loading && <div className="mt-3 text-white/70">Загружаем операции...</div>}

          {!loading && !error && (data?.transactions.length ?? 0) === 0 && (
            <div className="mt-3 text-white/70">Операций пока нет.</div>
          )}

          <div className="mt-3 space-y-3 max-h-80 overflow-auto pr-1">
            {data?.transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-white/10 px-4 py-3 bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{transaction.reason}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {new Date(transaction.createdAt).toLocaleString("ru-RU")}
                      {transaction.orderId ? ` · заказ ${transaction.orderId.slice(0, 8).toUpperCase()}` : ""}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${pointsTone(transaction.points)}`}>
                    {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
