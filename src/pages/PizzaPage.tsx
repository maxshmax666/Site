import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useCartStore } from "../store/cart.store";
import { useMenuItems } from "../shared/hooks/useMenuItems";

const sizes = [
  { key: "S" as const, label: "S", mul: 1.0 },
  { key: "M" as const, label: "M", mul: 1.15 },
  { key: "L" as const, label: "L", mul: 1.3 },
];

export function PizzaPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const add = useCartStore((s) => s.add);
  const { items, loading } = useMenuItems();

  const item = useMemo(() => items.find((x) => x.id === id), [items, id]);
  const [size, setSize] = useState<"S" | "M" | "L">("M");

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-3xl p-6 bg-card border border-white/10 text-white/70">
          Загрузка позиции…
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-3xl p-6 bg-card border border-white/10">
          <div className="text-xl font-bold">Пицца не найдена</div>
          <div className="mt-3">
            <Link to="/menu" className="underline text-white/80">Вернуться в меню</Link>
          </div>
        </div>
      </div>
    );
  }

  const price = Math.round(item.priceFrom * (sizes.find((s) => s.key === size)?.mul ?? 1));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-sm text-white/70">
        <Link to="/menu" className="hover:underline">Меню</Link> / <span className="text-white">{item.title}</span>
      </div>

      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-card border border-white/10 shadow-soft overflow-hidden">
          <div className="h-72 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="text-7xl">🍕</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-card border border-white/10 shadow-soft p-6">
          <div className="flex items-center gap-2">
            {item.badges?.includes("hit") && <Badge tone="yellow">ХИТ</Badge>}
            {item.badges?.includes("new") && <Badge tone="green">NEW</Badge>}
            {item.badges?.includes("spicy") && <Badge tone="orange">ОСТРО</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-black">{item.title}</h1>
          <div className="mt-2 text-white/75">{item.desc}</div>

          <div className="mt-6">
            <div className="text-sm text-white/70 mb-2">Размер</div>
            <div className="flex gap-2">
              {sizes.map((s) => {
                const active = s.key === size;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSize(s.key)}
                    className={[
                      "px-4 py-2 rounded-2xl border text-sm font-semibold transition",
                      active ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-2xl font-black">{price} ₽</div>
            <div className="flex gap-2">
              <Button variant="soft" onClick={() => nav(-1)}>Назад</Button>
              <Button onClick={() => add(item, { size, price })}>В корзину</Button>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/60">
            Данные моковые. Архитектура готова под API.
          </div>
        </div>
      </div>
    </div>
  );
}
