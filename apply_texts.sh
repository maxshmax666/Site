#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Applying Tagil Pizza texts..."

# 1) Header: бренд "Tagil Pizza"
cat > src/app/layout/Header.tsx <<'TS'
import { NavLink } from "react-router-dom";
import { useCartStore } from "../../store/cart.store";
import { cn } from "../../lib/cn";

const nav = [
  { to: "/", label: "Главная" },
  { to: "/menu", label: "Меню" },
  { to: "/loyalty", label: "Лояльность" },
  { to: "/catering", label: "Кейтеринг" },
  { to: "/contacts", label: "Контакты" },
];

export function Header() {
  const count = useCartStore((s) => s.count());
  return (
    <header className="sticky top-0 z-[40] backdrop-blur bg-bg/75 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <NavLink to="/" className="font-black tracking-wide text-lg">
          <span className="text-orange">Tagil</span>{" "}
          <span className="text-green">Pizza</span>{" "}
          <span className="text-yellow">🍕</span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {nav.map((x) => (
            <NavLink
              key={x.to}
              to={x.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-white/10" : "hover:bg-white/5 text-white/85"
                )
              }
            >
              {x.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NavLink
            to="/login"
            className="px-3 py-2 rounded-xl text-sm hover:bg-white/5 text-white/85"
          >
            Войти
          </NavLink>
          <NavLink
            to="/cart"
            className="relative px-4 py-2 rounded-xl text-sm bg-orange text-black font-semibold hover:opacity-90"
          >
            Корзина
            {count > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow text-black text-xs font-black flex items-center justify-center">
                {count}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
TS

# 2) Hero: новый текст
cat > src/components/sections/Hero.tsx <<'TS'
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-soft overflow-hidden">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-sm">
          <span className="text-yellow">★</span> Горячо. Быстро. Честно.
        </div>

        <h1 className="mt-4 text-4xl md:text-5xl font-black leading-tight">
          <span className="text-orange">Tagil</span>{" "}
          <span className="text-green">Pizza</span>{" "}
          <span className="text-yellow">🍕</span>
        </h1>

        <p className="mt-4 text-white/80">
          Доставка в зелёной зоне до 30 минут. Самовывоз.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/menu">
            <Button size="lg">Открыть меню</Button>
          </Link>
          <Link to="/catering">
            <Button size="lg" variant="soft">
              Кейтеринг / События
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
TS

# 3) Footer: новые контакты/время
cat > src/app/layout/Footer.tsx <<'TS'
export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm text-white/80">
        <div>
          <div className="font-bold text-white">Tagil Pizza</div>
          <div className="mt-2">
            Доставка в зелёной зоне до 30 минут.
            <br />
            Самовывоз.
          </div>
        </div>

        <div>
          <div className="font-bold text-white">Время</div>
          <div className="mt-2">Ежедневно: 17:00 — 23:00</div>
          <div>Кейтеринг: по заявке</div>
        </div>

        <div>
          <div className="font-bold text-white">Контакты</div>
          <div className="mt-2">Тел: +7 902 266-44-08</div>
          <div>Тел: +7 995 566-44-08</div>
          <div>Адрес: Нижний Тагил, Юности 45</div>
        </div>
      </div>
    </footer>
  );
}
TS

# 4) ContactsPage: новые контакты
cat > src/pages/ContactsPage.tsx <<'TS'
export function ContactsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Контакты</h1>
      <div className="mt-2 text-white/70">Адрес, часы, карта.</div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="font-bold text-lg">Tagil Pizza</div>
          <div className="mt-3 text-white/80">Нижний Тагил, Юности 45</div>
          <div className="mt-2 text-white/80">+7 902 266-44-08</div>
          <div className="mt-2 text-white/80">+7 995 566-44-08</div>
          <div className="mt-2 text-white/70">Ежедневно 17:00 — 23:00</div>
        </div>

        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="font-bold text-lg">Карта</div>
          <div className="mt-3 h-64 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white/60">
            Тут будет карта зон доставки
          </div>
          <div className="mt-3 text-xs text-white/60">
            Позже подключим Google/Yandex и раскрасим зоны: зелёная/жёлтая/красная.
          </div>
        </div>
      </div>
    </div>
  );
}
TS

echo "✅ Done. Restart dev server if needed: npm run dev"
