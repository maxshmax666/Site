import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Badge } from "../../components/ui/Badge";
import type { OrderStatus } from "./admin.types";
import { statusLabel } from "./admin.types";

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string | null;
  total: number;
};

export function AdminKitchenPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("orders")
      .select("id,created_at,status,customer_name,total")
      .in("status", ["NEW", "COOKING", "READY"])
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, OrderRow[]> = { NEW: [], COOKING: [], READY: [] };
    for (const r of rows) g[r.status]?.push(r);
    return g;
  }, [rows]);

  return (
    <div>
      <div className="text-white/70">Экран кухни: NEW / COOKING / READY. Автообновление каждые 5 секунд.</div>
      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
        </div>
      )}

      <div className="mt-5 grid md:grid-cols-3 gap-4">
        {(["NEW", "COOKING", "READY"] as OrderStatus[]).map((s) => (
          <div key={s} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="font-black">{statusLabel[s]}</div>
              <Badge>{grouped[s]?.length ?? 0}</Badge>
            </div>

            <div className="mt-3 grid gap-2">
              {(grouped[s] ?? []).map((r) => (
                <div key={r.id} className="rounded-xl p-3 bg-black/30 border border-white/10">
                  <div className="text-sm text-white/70">{new Date(r.created_at).toLocaleTimeString()}</div>
                  <div className="font-bold mt-1">{r.customer_name ?? "Без имени"}</div>
                  <div className="text-white font-black mt-1">{Math.round(r.total)} ₽</div>
                </div>
              ))}
              {(grouped[s] ?? []).length === 0 && <div className="text-white/60 text-sm">Пусто</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
