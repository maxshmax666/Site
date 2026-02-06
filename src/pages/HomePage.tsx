import { Hero } from "../components/sections/Hero";
import { promos } from "../data/promos";
import { reviews } from "../data/reviews";
import { PizzaCard } from "../components/cards/PizzaCard";
import { Accordion } from "../components/ui/Accordion";
import { Badge } from "../components/ui/Badge";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useMenuItems } from "../shared/hooks/useMenuItems";
import { MenuCatalogSection } from "../components/sections/MenuCatalogSection";

const faqs = [
  { q: "Как быстро привозите?", a: "Обычно 30–60 минут по городу (зависит от загрузки и района)." },
  { q: "Есть самовывоз?", a: "Да. Самовывоз — быстрее и без ожидания курьера." },
  { q: "Кейтеринг делаете?", a: "Да — наборы на офис/праздник, плюс можем собрать под задачу." },
];

export function HomePage() {
  const { items } = useMenuItems();

  const hits = useMemo(() => {
    const tagged = items.filter((x) => x.category === "classic" && x.badges?.includes("hit"));
    if (tagged.length > 0) return tagged.slice(0, 6);
    return items.filter((x) => x.category === "classic").slice(0, 6);
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <MenuCatalogSection className="scroll-mt-24" />

      <section className="mt-10">
        <Hero />
      </section>

      <section className="mt-10 grid md:grid-cols-2 gap-4">
        {promos.map((p) => (
          <div key={p.id} className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-bold">{p.title}</div>
              {p.badge && <Badge tone="yellow">{p.badge}</Badge>}
            </div>
            <div className="mt-2 text-white/75">{p.desc}</div>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Хиты недели</h2>
          <Link to="/menu" className="text-sm text-white/70 hover:text-white">
            Смотреть всё →
          </Link>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hits.map((x) => (
            <PizzaCard key={x.id} item={x} />
          ))}
        </div>
      </section>

      <section className="mt-12 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <h2 className="text-2xl font-bold">Отзывы</h2>
          <div className="mt-4 space-y-4 text-white/80">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                “{r.text}” — {r.author}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-4">
            <Accordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl p-6 bg-gradient-to-r from-green/15 to-orange/15 border border-white/10 shadow-soft">
        <h2 className="text-2xl font-bold">Контакты</h2>
        <div className="mt-2 text-white/80">Телефон: +7 (000) 000‑00‑00 • Адрес: Нижний Тагил, …</div>
        <div className="mt-3 text-sm text-white/70">Карта подключается позже (iframe/API).</div>
      </section>
    </div>
  );
}
