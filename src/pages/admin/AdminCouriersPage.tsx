import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import type { OrderStatus } from "./admin.types";
import { statusLabel } from "./admin.types";
import { useAuthStore } from "../../store/auth.store";
import { hasRole } from "../../lib/roles";
import { formatSupabaseError } from "../../lib/errors";
import { Toast } from "../../components/ui/Toast";

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer_name: string | null;
  address: string | null;
  total: number;
  courier_id: string | null;
};

type CourierProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
};

export function AdminCouriersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [couriers, setCouriers] = useState<CourierProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { role, user } = useAuthStore();

  const courierById = useMemo(() => {
    return new Map(couriers.map((c) => [c.user_id, c]));
  }, [couriers]);

  const loadOrders = useCallback(async () => {
    setErr(null);
    setLoading(true);

    if (role === "courier" && !user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    let query = supabase
      .from("orders")
      .select("id,created_at,status,customer_name,address,total,courier_id")
      .in("status", ["READY", "COURIER", "DELIVERED"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (role === "courier" && user?.id) {
      query = query.eq("courier_id", user.id);
    }

    const { data, error } = await query;

    if (error) setErr(formatSupabaseError(error));
    setRows((data ?? []) as any);
    setLoading(false);
  }, [role, user?.id]);

  const loadCouriers = useCallback(async () => {
    if (!hasRole(role, "manager")) {
      setCouriers([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,email,full_name")
      .eq("role", "courier")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      setErr(formatSupabaseError(error));
      setCouriers([]);
      return;
    }

    setCouriers((data ?? []) as CourierProfile[]);
  }, [role]);

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      setToast(formatSupabaseError(error));
      return;
    }
    await loadOrders();
  }

  async function setCourier(id: string, courierId: string | null) {
    const { error } = await supabase.from("orders").update({ courier_id: courierId }).eq("id", id);
    if (error) {
      setToast(formatSupabaseError(error));
      return;
    }
    await loadOrders();
  }

  useEffect(() => {
    void Promise.all([loadOrders(), loadCouriers()]);
  }, [loadOrders, loadCouriers]);

  return (
    <div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

      <div className="flex items-center justify-between gap-2">
        <div className="text-white/70">Экран курьеров: READY → COURIER → DELIVERED</div>
        <Button variant="soft" onClick={() => void Promise.all([loadOrders(), loadCouriers()])}>Обновить</Button>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {loading && <div className="text-white/70">Загрузка…</div>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-white/70">{new Date(r.created_at).toLocaleString()}</div>
              <Badge>{statusLabel[r.status]}</Badge>
            </div>
            <div className="mt-2 font-bold">{r.customer_name ?? "Без имени"}</div>
            <div className="mt-1 text-white/80 text-sm">{r.address ?? "Адрес не указан"}</div>
            <div className="mt-2 text-sm text-white/70">
              Курьер:{" "}
              {(() => {
                if (!r.courier_id) return <span className="text-white/50">не назначен</span>;
                const courier = courierById.get(r.courier_id);
                if (!courier) {
                  if (r.courier_id === user?.id && user.email) {
                    return <span className="text-white">{user.email}</span>;
                  }
                  return <span className="text-white/50">{r.courier_id}</span>;
                }
                const primaryLabel = courier.full_name ?? courier.email ?? courier.user_id;
                return (
                  <span className="text-white">
                    {primaryLabel}
                    {courier.full_name && courier.email ? (
                      <span className="text-white/60"> · {courier.email}</span>
                    ) : null}
                  </span>
                );
              })()}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-white font-black text-lg">{Math.round(r.total)} ₽</div>
              <div className="flex flex-wrap gap-2">
                {hasRole(role, "manager") ? (
                  <>
                    <Button variant="soft" onClick={() => setStatus(r.id, "COURIER")}>У курьера</Button>
                    <Button variant="primary" onClick={() => setStatus(r.id, "DELIVERED")}>Доставлено</Button>
                  </>
                ) : null}
              </div>
            </div>

            {hasRole(role, "manager") && (r.status === "READY" || r.status === "COURIER") ? (
              <label className="mt-3 block text-sm text-white/70">
                Курьер
                <select
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white"
                  value={r.courier_id ?? ""}
                  onChange={(e) => setCourier(r.id, e.target.value || null)}
                >
                  <option value="">Не назначен</option>
                  {couriers.map((courier) => (
                    <option key={courier.user_id} value={courier.user_id}>
                      {courier.full_name ?? courier.email ?? courier.user_id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ))}
        {!loading && rows.length === 0 && <div className="text-white/60">Пока пусто</div>}
      </div>
    </div>
  );
}
