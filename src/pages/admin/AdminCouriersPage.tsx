import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import type { OrderStatus } from "./admin.types";
import { statusLabel } from "./admin.types";

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string | null;
  address: string | null;
  total: number;
  courier_id: string | null;
};

export function AdminCouriersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("orders")
      .select("id,created_at,status,customer_name,address,total,courier_id")
      .in("status", ["READY", "COURIER", "DELIVERED"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
  }

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return alert(error.message);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-white/70">Экран курьеров: READY → COURIER → DELIVERED</div>
        <Button variant="soft" onClick={load}>Обновить</Button>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-white/70">{new Date(r.created_at).toLocaleString()}</div>
              <Badge>{statusLabel[r.status]}</Badge>
            </div>
            <div className="mt-2 font-bold">{r.customer_name ?? "Без имени"}</div>
            <div className="mt-1 text-white/80 text-sm">{r.address ?? "Адрес не указан"}</div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-black text-lg">{Math.round(r.total)} ₽</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="soft" onClick={() => setStatus(r.id, "COURIER")}>У курьера</Button>
                <Button variant="primary" onClick={() => setStatus(r.id, "DELIVERED")}>Доставлено</Button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-white/60">Пока пусто</div>}
      </div>
    </div>
  );
}
