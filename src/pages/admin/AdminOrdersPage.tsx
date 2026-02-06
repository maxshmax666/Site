import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { OrderStatus, statusLabel, statusFlow } from "./admin.types";
import { formatSupabaseError } from "../../lib/errors";
import { Toast } from "../../components/ui/Toast";

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  comment: string | null;
  status: OrderStatus;
  total: number;
};

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

export function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const totals = useMemo(() => {
    const by: Record<string, number> = {};
    for (const r of rows) by[r.status] = (by[r.status] ?? 0) + 1;
    return by;
  }, [rows]);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("orders")
      .select("id,created_at,customer_name,customer_phone,address,comment,status,total")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) setErr(formatSupabaseError(error));
    setRows((data ?? []) as any);
    setLoading(false);
  }

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      setToast(formatSupabaseError(error));
      return;
    }
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2 text-sm">
          {(["NEW", "COOKING", "READY", "COURIER", "DELIVERED", "CANCELLED"] as OrderStatus[]).map((s) => (
            <div key={s} className="text-white/80">
              {statusLabel[s]}: <span className="text-white font-bold">{totals[s] ?? 0}</span>
            </div>
          ))}
        </div>

        <Button variant="soft" onClick={load} disabled={loading}>
          Обновить
        </Button>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
          <div className="text-white/70 mt-1">
            Скорее всего ты ещё не выполнил SQL-setup в Supabase. Он лежит в <code>supabase_admin.sql</code>.
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {loading && <div className="text-white/70">Загрузка…</div>}

        {!loading && rows.length === 0 && (
          <div className="text-white/70">Пока заказов нет. Можно добавить тестовые через SQL (см. файл).</div>
        )}

        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl p-4 bg-black/20 border border-white/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-white/70">{fmt(r.created_at)}</div>
              <Badge>{statusLabel[r.status]}</Badge>
            </div>

            <div className="mt-2 font-bold">
              {r.customer_name ?? "Без имени"}{" "}
              <span className="text-white/70 font-normal">{r.customer_phone ?? ""}</span>
            </div>

            <div className="mt-1 text-white/80 text-sm">{r.address ?? "Адрес не указан"}</div>
            {r.comment && <div className="mt-1 text-white/60 text-sm">Комментарий: {r.comment}</div>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-black text-lg">{Math.round(r.total)} ₽</div>

              <div className="flex flex-wrap gap-2">
                {statusFlow.map((s) => (
                  <Button
                    key={s}
                    variant={r.status === s ? "primary" : "soft"}
                    onClick={() => setStatus(r.id, s)}
                  >
                    {statusLabel[s]}
                  </Button>
                ))}
                <Button variant="danger" onClick={() => setStatus(r.id, "CANCELLED")}>
                  Отменить
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
