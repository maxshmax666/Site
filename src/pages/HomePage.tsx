import { useMemo, useState, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/cart.store";
import { selectCartCount, selectCartTotal } from "../store/cart.selectors";
import { useMenuItems } from "../shared/hooks/useMenuItems";
import { useMenuCategories } from "../shared/hooks/useMenuCategories";

const sidebarLinks = [
  { key: "home", label: "Главная", active: true },
  { key: "menu", label: "Меню", active: false },
  { key: "promo", label: "Акции", active: false },
  { key: "orders", label: "Заказы", active: false },
  { key: "contacts", label: "Контакты", active: false },
] as const;

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

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white font-['Inter',system-ui,sans-serif]">
      <div className="mx-auto w-full max-w-[1280px] lg:px-4">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
          <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-[#1E1E1E] lg:bg-[#0D0D0D] lg:px-4 lg:py-5">
            <div className="text-[38px] font-bold leading-none">
              <span className="text-[#FF6A00]">Tagil</span> <span className="text-[#52C41A]">Pizza</span>
            </div>
            <div className="mt-10 space-y-2">
              {sidebarLinks.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-[16px] transition ${
                    item.active
                      ? "border-[#FF6A00]/40 bg-[#141414] text-[#FF6A00]"
                      : "border-transparent bg-transparent text-[#A1A1A1]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-auto rounded-[20px] border border-[#1E1E1E] bg-[linear-gradient(135deg,#12301B_0%,#271A12_100%)] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <div className="text-sm text-[#A1A1A1]">Бонусы</div>
              <div className="mt-1 text-[36px] font-bold">1 250 ₽</div>
              <div className="mt-4 h-2 rounded-full bg-black/40">
                <div className="h-full w-2/3 rounded-full bg-[#FF6A00]" />
              </div>
              <div className="mt-2 text-sm text-[#A1A1A1]">750 ₽ до следующего уровня</div>
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

            <main className="mx-auto mt-[92px] max-w-[980px] px-4 lg:mt-0 lg:px-0">
              <section
                className="relative overflow-hidden rounded-[20px] border border-[#1E1E1E] bg-[#121212] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] lg:p-8"
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
                  className="absolute inset-y-0 right-0 h-full w-[62%] object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#121212_32%,rgba(18,18,18,0.76)_62%,rgba(18,18,18,0.35)_100%)]" />
                <div className="relative max-w-[420px]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#225A2F] bg-[#0F2414] px-3 py-1 text-[13px] text-[#98DDAA]">
                    ⚡ {sliderItems[activeSlide]?.delivery}
                  </div>
                  <h1 className="mt-4 text-[32px] font-bold leading-[1.05]">
                    {sliderItems[activeSlide]?.title}
                    <br />
                    <span className="text-[#FF6A00]">{sliderItems[activeSlide]?.titleAccent}</span>
                  </h1>
                  <p className="mt-3 max-w-[320px] text-[15px] text-[#A1A1A1]">{sliderItems[activeSlide]?.description}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" className="rounded-[14px] bg-[#FF6A00] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#FF7F1F]">
                      Смотреть меню
                    </button>
                    <button type="button" className="rounded-[14px] border border-[#1E1E1E] bg-black/40 px-5 py-3 text-[15px] font-semibold text-white">
                      Повторить заказ
                    </button>
                  </div>
                </div>
                <div className="relative mt-6 flex items-center justify-center gap-2">
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

              <section className="mt-4 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-3">
                  {categoryTabs.map((category, idx) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setSelectedCategory(category.key)}
                      className={`rounded-[999px] border px-4 py-2 text-sm transition ${
                        (selectedCategory ?? categoryTabs[0]?.key) === category.key || (idx === 0 && selectedCategory === null)
                          ? "border-[#FF6A00] bg-[#FF6A00] text-white"
                          : "border-[#1E1E1E] bg-[#121212] text-[#A1A1A1]"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-5">
                <h2 className="text-[20px] font-semibold">Популярное</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
                  {visibleItems.map((item) => {
                    const meta = cardMeta[item.id] ?? {
                      rating: "4.8",
                      time: "25 мин",
                      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
                    };

                    return (
                      <article key={item.id} className="relative overflow-hidden rounded-[20px] border border-[#1E1E1E] bg-[#121212] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        <Link to={`/pizza/${item.id}`} className="block">
                          <img src={meta.image} alt={item.title} className="h-[130px] w-full object-cover lg:h-[190px]" loading="lazy" />
                          <div className="p-4">
                            {meta.badge ? (
                              <span className="mb-2 inline-flex rounded-[999px] border border-[#35210E] bg-[#221507] px-2 py-1 text-xs text-[#FF9A4D]">
                                {meta.badge}
                              </span>
                            ) : null}
                            <h3 className="text-[20px] font-semibold leading-tight">{item.title}</h3>
                            <p className="mt-2 min-h-[38px] text-[14px] text-[#A1A1A1]">{item.desc}</p>
                            <div className="mt-2 flex items-center gap-3 text-sm text-[#A1A1A1]">
                              <span>★ {meta.rating}</span>
                              <span>◷ {meta.time}</span>
                            </div>
                            <div className="mt-2 text-[30px] font-bold">от {formatRub(item.priceFrom)}</div>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => add(item)}
                          className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-[#FF6A00] text-[28px] leading-none text-white transition hover:bg-[#FF7F1F]"
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
          <aside className="fixed left-0 top-0 z-50 h-full w-[82%] max-w-[320px] border-r border-[#1E1E1E] bg-[#0E0E0E] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <button type="button" onClick={() => setDrawerOpen(false)} className="mb-4 grid h-10 w-10 place-items-center rounded-full border border-[#1E1E1E] text-xl">
              ×
            </button>
            <div className="rounded-[14px] border border-[#1E1E1E] bg-[#161616] p-3">
              <div className="text-[20px] font-semibold">Алексей</div>
              <div className="text-sm text-[#A1A1A1]">+7 912 345-55-21</div>
            </div>
            <div className="mt-4 space-y-2">
              {sidebarLinks.map((item) => (
                <button key={item.key} type="button" className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[18px] ${item.active ? "border border-[#FF6A00]/40 text-[#FF6A00]" : "text-[#A1A1A1]"}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item.label}
                </button>
              ))}
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
