import { useCallback, useMemo, useState, type MouseEvent, type TouchEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cart.store";
import { selectCartCount, selectCartTotal } from "../store/cart.selectors";
import { useMenuItems } from "../shared/hooks/useMenuItems";
import { useMenuCategories } from "../shared/hooks/useMenuCategories";
import { scrollToMenuSection } from "../shared/scrollToMenu";
import { mainNav } from "../shared/navigation/mainNav";

const sliderItems = [
  {
    id: "slide-1",
    delivery: "Доставка от 30 минут",
    title: "Горячая пицца",
    titleAccent: "в Нижнем Тагиле",
    description: "Свежие ингредиенты, фирменные рецепты и доставка прямо к тебе",
  },
  {
    id: "slide-2",
    delivery: "Тесто долгой ферментации",
    title: "Фирменные рецепты",
    titleAccent: "каждый день",
    description: "Тонкое тесто, насыщенный вкус и идеальная корочка",
  },
  {
    id: "slide-3",
    delivery: "Работаем ежедневно",
    title: "Пицца для",
    titleAccent: "любой компании",
    description: "Классика, фирменные, сезонные и десерты в одном меню",
  },
] as const;

const cardMeta: Record<string, { rating: string; time: string; badge?: string; image: string }> = {
  c1: { rating: "4.8", time: "25 мин", badge: "Хит", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80" },
  c2: { rating: "4.9", time: "25 мин", badge: "Топ", image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80" },
  sg1: { rating: "4.7", time: "27 мин", image: "https://images.unsplash.com/photo-1548365328-9f547fb0953c?auto=format&fit=crop&w=900&q=80" },
  sg2: { rating: "4.6", time: "25 мин", badge: "Новинка", image: "https://images.unsplash.com/photo-1520201163981-8cc95007dd2a?auto=format&fit=crop&w=900&q=80" },
  r1: { rating: "4.8", time: "28 мин", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80" },
  r2: { rating: "4.7", time: "26 мин", image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=900&q=80" },
};

function formatRub(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { items } = useMenuItems();
  const { categories } = useMenuCategories();

  const add = useCartStore((state) => state.add);
  const lines = useCartStore((state) => state.lines);
  const cartCount = useCartStore(selectCartCount);
  const cartTotal = useCartStore(selectCartTotal);

  const filteredItems = useMemo(() => {
    const baseItems = items.length > 0 ? items : [];
    if (!selectedCategory) return baseItems;
    return baseItems.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const visibleItems = filteredItems.slice(0, 6);

  const onSwipe = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const startX = Number(event.currentTarget.dataset.startX ?? touch.clientX);
    const delta = touch.clientX - startX;
    if (Math.abs(delta) < 32) return;
    setActiveSlide((prev) => {
      if (delta < 0) {
        return (prev + 1) % sliderItems.length;
      }
      return prev === 0 ? sliderItems.length - 1 : prev - 1;
    });
  };

  const categoryTabs = categories.slice(0, 8);

  const handleMenuNavigation = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, shouldCloseDrawer = false) => {
      if (shouldCloseDrawer) {
        setDrawerOpen(false);
      }

      if (location.pathname === "/") {
        event.preventDefault();
        window.history.replaceState(null, "", "/#menu");

        if (!scrollToMenuSection("smooth")) {
          navigate("/#menu");
        }

        return;
      }

      navigate("/#menu");
    },
    [location.pathname, navigate]
  );

  return (
    <div className="min-h-screen bg-[#08090B] text-white font-['Inter',system-ui,sans-serif]">
      <div className="mx-auto w-full max-w-[1280px] lg:px-4">
        <div className="lg:grid lg:grid-cols-[272px_1fr] lg:gap-8">
          <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-[#1E1E1E] lg:bg-[linear-gradient(180deg,#0E0F12_0%,#090A0C_100%)] lg:px-4 lg:py-6">
            <div className="text-[38px] font-bold leading-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
              <span className="text-[#FF6A00]">Tagil</span> <span className="text-[#52C41A]">Pizza</span>
            </div>
            <div className="mt-8 rounded-[20px] border border-[#252525] bg-[linear-gradient(130deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.01)_60%)] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=200&q=80"
                  alt="Аватар пользователя"
                  className="h-14 w-14 rounded-full border border-[#2A2A2A] object-cover"
                />
                <div>
                  <div className="text-lg font-semibold">Алексей</div>
                  <div className="text-sm text-[#9A9A9A]">+7 912 345-55-21</div>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {mainNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={item.label === "Меню" ? handleMenuNavigation : undefined}
                  className={({ isActive }) => `flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-[16px] transition ${
                    isActive
                      ? "border-[#FF6A00]/50 bg-[linear-gradient(90deg,rgba(255,106,0,0.16)_0%,rgba(20,20,20,0.92)_100%)] text-[#FF6A00] shadow-[0_8px_24px_rgba(255,106,0,0.2)]"
                      : "border-transparent bg-transparent text-[#A1A1A1] hover:bg-[#131313]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-auto rounded-[20px] border border-[#2B4B2C] bg-[radial-gradient(circle_at_0%_0%,rgba(82,196,26,0.22),transparent_45%),linear-gradient(140deg,#12301B_0%,#271A12_100%)] p-4 shadow-[0_14px_32px_rgba(0,0,0,0.45)]">
              <div className="text-sm text-[#A1A1A1]">Бонусы</div>
              <div className="mt-1 text-[36px] font-bold">1 250 ₽</div>
              <div className="mt-4 h-2 rounded-full bg-black/40">
                <div className="h-full w-2/3 rounded-full bg-[#FF6A00]" />
              </div>
              <div className="mt-2 text-sm text-[#A1A1A1]">750 ₽ до следующего уровня</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button type="button" className="rounded-[12px] border border-[#1E1E1E] bg-[#101113] py-2 text-[#8E8E8E] transition hover:text-white">VK</button>
              <button type="button" className="rounded-[12px] border border-[#1E1E1E] bg-[#101113] py-2 text-[#8E8E8E] transition hover:text-white">TG</button>
              <button type="button" className="rounded-[12px] border border-[#1E1E1E] bg-[#101113] py-2 text-[#8E8E8E] transition hover:text-white">WA</button>
            </div>
          </aside>

          <section className="pb-28 lg:pb-10">
            <header className="fixed inset-x-0 top-0 z-40 border-b border-[#1E1E1E] bg-[#0B0B0B]/95 px-4 py-4 backdrop-blur lg:static lg:mb-5 lg:border lg:border-[#1E1E1E] lg:bg-[#0E0E0E] lg:px-6 lg:py-5 lg:rounded-[20px]">
              <div className="mx-auto flex max-w-[980px] items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[#1E1E1E] bg-[#141414] lg:hidden"
                    aria-label="Открыть меню"
                  >
                    ☰
                  </button>
                  <div className="text-[32px] font-bold leading-none lg:hidden">
                    <span className="text-[#FF6A00]">Tagil</span> <span className="text-[#52C41A]">Pizza</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <IconButton>⌕</IconButton>
                  <IconButton>◌</IconButton>
                  <Link
                    to="/cart"
                    className="relative grid h-10 w-10 place-items-center rounded-full bg-[#FF6A00] text-black"
                    aria-label="Корзина"
                  >
                    🛒
                    {cartCount > 0 ? (
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#121212] px-1 text-[11px] font-bold text-white">
                        {cartCount}
                      </span>
                    ) : null}
                  </Link>
                </div>
              </div>
            </header>

            <main className="mx-auto mt-[96px] max-w-[980px] px-4 lg:mt-0 lg:px-0">
              <section
                className="relative overflow-hidden rounded-[24px] border border-[#252525] bg-[#101113] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)] lg:p-8"
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  if (!touch) return;
                  event.currentTarget.dataset.startX = String(touch.clientX);
                }}
                onTouchEnd={onSwipe}
              >
                <img
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"
                  alt="Пицца"
                  className="absolute inset-y-0 right-[-60px] h-full w-[74%] object-cover object-center opacity-95 saturate-125 contrast-125"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_28%,rgba(0,0,0,0.68)_58%,rgba(0,0,0,0.14)_100%)]" />
                <div className="pointer-events-none absolute -left-12 top-4 h-52 w-52 rounded-full bg-[#FF6A00]/25 blur-[90px]" />
                <div className="pointer-events-none absolute left-[22%] top-[20%] h-64 w-64 rounded-full bg-white/10 blur-[120px]" />
                <div className="relative max-w-[420px]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#225A2F] bg-[#0F2414] px-3 py-1 text-[13px] text-[#98DDAA]">
                    ⚡ {sliderItems[activeSlide]?.delivery}
                  </div>
                  <h1 className="mt-4 text-[32px] font-bold leading-[1.05]">
                    {sliderItems[activeSlide]?.title}
                    <br />
                    <span className="text-[#FF6A00]">{sliderItems[activeSlide]?.titleAccent}</span>
                  </h1>
                  <p className="mt-4 max-w-[340px] text-[16px] text-[#B0B0B0]">{sliderItems[activeSlide]?.description}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" className="rounded-[14px] bg-[#FF6A00] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#FF7F1F]">
                      Смотреть меню
                    </button>
                    <button type="button" className="rounded-[14px] border border-[#1E1E1E] bg-black/40 px-5 py-3 text-[15px] font-semibold text-white">
                      Повторить заказ
                    </button>
                  </div>
                </div>
                <div className="relative mt-8 flex items-center justify-center gap-2">
                  {sliderItems.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition ${idx === activeSlide ? "w-6 bg-[#FF6A00]" : "w-2 bg-white/30"}`}
                      aria-label={`Слайд ${idx + 1}`}
                    />
                  ))}
                </div>
              </section>

              <section className="mt-8 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-3">
                  {categoryTabs.map((category, idx) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setSelectedCategory(category.key)}
                      className={`rounded-[999px] border px-6 py-3 text-sm transition ${
                        (selectedCategory ?? categoryTabs[0]?.key) === category.key || (idx === 0 && selectedCategory === null)
                          ? "border-[#FF6A00] bg-[#FF6A00] text-white shadow-[0_0_24px_rgba(255,106,0,0.45)]"
                          : "border-[#1E1E1E] bg-[#121212] text-[#A1A1A1]"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-[20px] font-semibold">Популярное</h2>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                  {visibleItems.map((item) => {
                    const meta = cardMeta[item.id] ?? {
                      rating: "4.8",
                      time: "25 мин",
                      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
                    };

                    return (
                      <article key={item.id} className="relative min-h-[280px] overflow-hidden rounded-[22px] border border-[#202020] bg-[#101113] shadow-[0_18px_42px_rgba(0,0,0,0.5)]">
                        <Link to={`/pizza/${item.id}`} className="block">
                          <img src={meta.image} alt={item.title} className="h-[180px] w-full object-cover lg:h-[198px]" loading="lazy" />
                          <div className="p-5">
                            {meta.badge ? (
                              <span className="mb-2 inline-flex rounded-[999px] border border-[#35210E] bg-[#221507] px-2 py-1 text-xs text-[#FF9A4D]">
                                {meta.badge}
                              </span>
                            ) : null}
                            <h3 className="text-[20px] font-semibold leading-tight">{item.title}</h3>
                            <p className="mt-2 min-h-[40px] text-[14px] text-[#A1A1A1]">{item.desc}</p>
                            <div className="mt-3 flex items-center gap-3 text-sm text-[#A1A1A1]">
                              <span>★ {meta.rating}</span>
                              <span>◷ {meta.time}</span>
                            </div>
                            <div className="mt-3 text-[34px] font-bold leading-none">от {formatRub(item.priceFrom)}</div>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => add(item)}
                          className="absolute bottom-5 right-5 grid h-12 w-12 place-items-center rounded-full bg-[#FF6A00] text-[30px] leading-none text-white shadow-[0_10px_24px_rgba(255,106,0,0.5)] transition hover:translate-y-[-1px] hover:bg-[#FF7F1F]"
                          aria-label={`Добавить ${item.title}`}
                        >
                          +
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            </main>
          </section>
        </div>
      </div>

      {drawerOpen ? (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/65"
            aria-label="Закрыть меню"
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-[82%] max-w-[320px] border-r border-[#1E1E1E] bg-[linear-gradient(180deg,#0E0E0E_0%,#090A0C_100%)] p-4 shadow-[0_20px_44px_rgba(0,0,0,0.5)]">
            <button type="button" onClick={() => setDrawerOpen(false)} className="mb-4 grid h-10 w-10 place-items-center rounded-full border border-[#1E1E1E] text-xl">
              ×
            </button>
            <div className="rounded-[16px] border border-[#1E1E1E] bg-[#121212] p-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=200&q=80"
                  alt="Аватар пользователя"
                  className="h-12 w-12 rounded-full border border-[#2A2A2A] object-cover"
                />
                <div>
                  <div className="text-[20px] font-semibold">Алексей</div>
                  <div className="text-sm text-[#A1A1A1]">+7 912 345-55-21</div>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {mainNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={
                    item.label === "Меню"
                      ? (event) => handleMenuNavigation(event, true)
                      : () => setDrawerOpen(false)
                  }
                  className={({ isActive }) => `flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[18px] ${
                    isActive ? "border border-[#FF6A00]/40 text-[#FF6A00]" : "text-[#A1A1A1]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-6 rounded-[20px] border border-[#2B4B2C] bg-[radial-gradient(circle_at_0%_0%,rgba(82,196,26,0.24),transparent_40%),linear-gradient(140deg,#12301B_0%,#271A12_100%)] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
              <div className="text-sm text-[#B9C9B0]">Бонусы</div>
              <div className="mt-1 text-[32px] font-bold">1 250 ₽</div>
              <div className="mt-3 h-2 rounded-full bg-black/30">
                <div className="h-full w-2/3 rounded-full bg-[#FF6A00]" />
              </div>
              <div className="mt-2 text-sm text-[#A1A1A1]">750 ₽ до следующего уровня</div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <button type="button" className="rounded-[12px] border border-[#1E1E1E] bg-[#111] py-2 text-[#8E8E8E]">VK</button>
              <button type="button" className="rounded-[12px] border border-[#1E1E1E] bg-[#111] py-2 text-[#8E8E8E]">TG</button>
              <button type="button" className="rounded-[12px] border border-[#1E1E1E] bg-[#111] py-2 text-[#8E8E8E]">WA</button>
            </div>
          </aside>
        </>
      ) : null}

      {lines.length > 0 ? (
        <div className="fixed inset-x-3 bottom-3 z-50 rounded-[20px] border border-[#1E1E1E] bg-[#121212] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {lines.slice(0, 3).map((line) => (
                <div key={`${line.id}-${line.size}`} className="grid h-10 w-10 place-items-center rounded-full border border-[#1E1E1E] bg-[#1A1A1A] text-sm">
                  🍕
                </div>
              ))}
            </div>
            <div className="mr-auto">
              <div className="text-sm text-[#A1A1A1]">{cartCount} товара</div>
              <div className="text-[24px] font-bold">{formatRub(cartTotal)}</div>
            </div>
            <Link to="/checkout" className="rounded-[14px] bg-[#FF6A00] px-5 py-3 text-[15px] font-semibold text-white">
              Оформить заказ
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconButton({ children }: { children: string }) {
  return (
    <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-[#1E1E1E] bg-[#141414] text-sm text-white">
      {children}
    </button>
  );
}
