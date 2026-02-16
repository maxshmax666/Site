import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useCartStore } from "../store/cart.store";
import { selectCartLines, selectCartTotal } from "../store/cart.selectors";

export function CartPage() {
  const nav = useNavigate();
  const lines = useCartStore(selectCartLines);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);
  const total = useCartStore(selectCartTotal);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Корзина</h1>

      {lines.length === 0 ? (
        <div className="mt-6 rounded-3xl p-6 bg-card border border-white/10">
          <div className="text-white/80">Пока пусто. Самое время исправить 😄</div>
          <div className="mt-4">
            <Link to="/menu">
              <Button>Открыть меню</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-3">
            {lines.map((l) => (
              <div key={`${l.id}-${l.size}`} className="rounded-3xl p-5 bg-card border border-white/10 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-lg">{l.title}</div>
                    <div className="mt-1 text-sm text-white/70">Размер: {l.size ?? "M"}</div>
                    <div className="mt-2 font-semibold">{l.price} ₽</div>
                  </div>
                  <button className="text-white/60 hover:text-white" onClick={() => remove(l.id, l.size)}>✕</button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button variant="soft" size="sm" onClick={() => dec(l.id, l.size)}>-</Button>
                  <div className="w-10 text-center font-bold">{l.qty}</div>
                  <Button variant="soft" size="sm" onClick={() => inc(l.id, l.size)}>+</Button>
                  <div className="ml-auto font-bold">{l.price * l.qty} ₽</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft h-fit sticky top-24">
            <div className="text-lg font-bold">Итого</div>
            <div className="mt-3 flex items-center justify-between text-white/80">
              <span>Сумма</span>
              <span className="font-black text-xl text-white">{total} ₽</span>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => nav("/checkout")}>Оформить</Button>
              <Button variant="soft" onClick={() => nav(-1)}>Назад</Button>
            </div>

            <div className="mt-4 text-xs text-white/60">
              Доставка/оплата подключаются на следующем этапе.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
