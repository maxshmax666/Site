import { Hero } from "../components/sections/Hero";
import { promos } from "../data/promos";
import { reviews } from "../data/reviews";
import { Accordion } from "../components/ui/Accordion";
import { Badge } from "../components/ui/Badge";

const faqs = [
  { q: "Как быстро привозите?", a: "Обычно 30–60 минут по городу (зависит от загрузки и района)." },
  { q: "Есть самовывоз?", a: "Да. Самовывоз — быстрее и без ожидания курьера." },
  { q: "Кейтеринг делаете?", a: "Да — наборы на офис/праздник, плюс можем собрать под задачу." },
];

export function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
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
        <div className="mt-2 text-white/80">Заказ по номеру 8 (995) 566-44-08 • Быстрая доставка и свежие ингредиенты каждый день.</div>
        <div className="mt-3 text-sm text-white/70">Карта подключается позже (iframe/API).</div>
      </section>
    </div>
  );
}
