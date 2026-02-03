import { useMemo, useState } from "react";
import { categories, type MenuCategory } from "../data/menu";
import { Tabs } from "../components/ui/Tabs";
import { PizzaCard } from "../components/cards/PizzaCard";
import { useMenuItems } from "../shared/hooks/useMenuItems";

export function MenuPage() {
  const [cat, setCat] = useState<MenuCategory>("pizza");
  const { items, loading, error, hasSupabaseEnv } = useMenuItems();

  const itemsForCategory = useMemo(() => items.filter((x) => x.category === cat), [items, cat]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Меню</h1>
          <div className="mt-2 text-white/70">Категории, карточки, быстрый заказ.</div>
        </div>
        <Tabs
          value={cat}
          onChange={setCat}
          items={categories.map((c) => ({ value: c.key, label: c.label }))}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-2xl p-3 bg-danger/15 border border-danger/30 text-sm text-white">
          Не удалось загрузить меню из базы данных. Показаны демо-данные.
        </div>
      )}

      {!hasSupabaseEnv && (
        <div className="mt-4 rounded-2xl p-3 bg-black/20 border border-white/10 text-sm text-white/70">
          Supabase не настроен. Показаны демо-данные из проекта.
        </div>
      )}

      {loading && <div className="mt-6 text-white/70">Загрузка меню…</div>}

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && itemsForCategory.length === 0 && (
          <div className="text-white/60">В этой категории пока нет позиций.</div>
        )}
        {itemsForCategory.map((x) => (
          <PizzaCard key={x.id} item={x} />
        ))}
      </div>
    </div>
  );
}
