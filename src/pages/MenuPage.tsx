import { useMemo, useState } from "react";
import { categories, type MenuCategory } from "../data/menu";
import { Tabs } from "../components/ui/Tabs";
import { PizzaCard } from "../components/cards/PizzaCard";
import { useMenuItems } from "../shared/hooks/useMenuItems";

export function MenuPage() {
  const [cat, setCat] = useState<MenuCategory>("classic");
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

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const isActive = category.key === cat;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setCat(category.key)}
              aria-pressed={isActive}
              className={[
                "group relative flex items-end overflow-hidden rounded-2xl border border-white/10 bg-center bg-cover",
                "h-28 sm:h-32 md:h-36 lg:h-40 shadow-lg shadow-black/30",
                "transition-transform duration-200 ease-out hover:-translate-y-0.5",
                isActive ? "ring-2 ring-white/70" : "hover:ring-1 hover:ring-white/40",
              ].join(" ")}
              style={{ backgroundImage: `url(${category.image})`, backgroundSize: "cover" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />
              <div className="relative z-10 p-4">
                <div className="text-lg font-semibold text-white">{category.label}</div>
              </div>
            </button>
          );
        })}
      </div>

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
