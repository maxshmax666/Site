import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useMyOrders } from "../shared/hooks/useMyOrders";
import { useAuthStore } from "../store/auth.store";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  COOKING: "Готовится",
  READY: "Готов",
  COURIER: "У курьера",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

function statusTone(status: string): "yellow" | "green" | "orange" | "muted" {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED") return "muted";
  if (status === "NEW" || status === "COOKING") return "orange";
  return "yellow";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfilePage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const roleError = useAuthStore((s) => s.roleError);

  const currentTab = params.get("tab") === "orders" ? "orders" : "account";
  const { data: orders, loading, error, hasMore, loadMore, reload } = useMyOrders(user?.id);
  const isSessionExpired = error?.status === 401;

  const totalOrders = useMemo(() => orders.length, [orders.length]);

  function setTab(tab: "account" | "orders") {
    const next = new URLSearchParams(params);
    if (tab === "account") {
      next.delete("tab");
    } else {
      next.set("tab", "orders");
    }
    setParams(next, { replace: true });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Профиль</h1>

      <div className="mt-6 rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
        <div className="font-bold text-lg">Ты в системе ✅</div>
        <div className="mt-2 text-white/80">Email: {user?.email ?? "—"}</div>

        {roleError && (
          <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/15 p-4 text-sm text-white">
            <div className="font-semibold">Не удалось загрузить роль</div>
            <div className="mt-1 text-white/80">{roleError}</div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant={currentTab === "account" ? "primary" : "soft"} onClick={() => setTab("account")}>Аккаунт</Button>
          <Button variant={currentTab === "orders" ? "primary" : "soft"} onClick={() => setTab("orders")}>Мои заказы</Button>
          <Link to="/menu"><Button variant="soft">Сделать заказ</Button></Link>
          <Link to="/loyalty"><Button variant="soft">Лояльность</Button></Link>
          <Button
            variant="danger"
            onClick={async () => {
              await signOut();
              nav("/");
            }}
          >
            Выйти
          </Button>
        </div>

        {currentTab === "account" ? (
          <div className="mt-4 text-sm text-white/70">Управление профилем в следующем релизе: адреса, телефон и уведомления.</div>
        ) : (
          <section id="orders-history" className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-black">История заказов</h2>
              <div className="text-sm text-white/70">Всего загружено: {totalOrders}</div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/15 p-4 text-sm text-white">
                <div className="font-semibold">Ошибка загрузки заказов</div>
                <div className="mt-1 text-white/80">
                  {isSessionExpired ? "Сессия истекла. Выполните вход снова." : error.message}
                </div>
                {isSessionExpired ? (
                  <Button className="mt-3" size="sm" variant="soft" onClick={() => nav("/login", { replace: true })}>
                    Перейти ко входу
                  </Button>
                ) : (
                  <Button className="mt-3" size="sm" variant="soft" onClick={() => void reload()}>
                    Повторить
                  </Button>
                )}
              </div>
            )}

            {!error && orders.length === 0 && !loading && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                Заказов пока нет.
              </div>
            )}

            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <details key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <summary className="cursor-pointer list-none select-none">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">Заказ #{order.number}</div>
                        <div className="mt-1 text-sm text-white/70">{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <Badge tone={statusTone(order.status)}>{STATUS_LABELS[order.status] ?? order.status}</Badge>
                        <div className="mt-1 font-bold">{order.total} ₽</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-white/75">{order.address?.trim() ? order.address : "Самовывоз"}</div>
                    {order.comment && <div className="mt-1 text-sm text-white/60">Комментарий: {order.comment}</div>}
                  </summary>

                  <div className="mt-4 border-t border-white/10 pt-3">
                    <div className="text-sm font-semibold text-white/85">Позиции заказа</div>
                    <div className="mt-2 space-y-2">
                      {order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div key={`${order.id}-${idx}`} className="flex items-center justify-between text-sm text-white/85">
                            <div>
                              {item.title} <span className="text-white/60">× {item.qty}</span>
                            </div>
                            <div className="font-semibold">{item.price * item.qty} ₽</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-white/60">Нет позиций для отображения.</div>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>

            {hasMore && (
              <Button className="mt-4" variant="soft" onClick={() => void loadMore()} disabled={loading}>
                {loading ? "Загрузка..." : "Показать ещё"}
              </Button>
            )}
            {!hasMore && loading && <div className="mt-4 text-sm text-white/70">Загрузка...</div>}
          </section>
        )}
      </div>
    </div>
  );
}
