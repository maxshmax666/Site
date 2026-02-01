import { useMemo, useState } from "react";
import { categories, menu, type MenuCategory } from "../data/menu";
import { Tabs } from "../components/ui/Tabs";
import { PizzaCard } from "../components/cards/PizzaCard";

export function MenuPage() {
  const [cat, setCat] = useState<MenuCategory>("pizza");

  const items = useMemo(() => menu.filter((x) => x.category === cat), [cat]);

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

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((x) => (
          <PizzaCard key={x.id} item={x} />
        ))}
      </div>
    </div>
  );
}
