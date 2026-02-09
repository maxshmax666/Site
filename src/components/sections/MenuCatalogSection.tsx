import { useMemo, useRef, useState } from "react";
import { PizzaCard } from "../cards/PizzaCard";
import { useMenuCategories } from "../../shared/hooks/useMenuCategories";
import { useMenuItems } from "../../shared/hooks/useMenuItems";

type MenuCatalogSectionProps = {
  title?: string;
  description?: string;
  className?: string;
  scrollToItemsOnCategorySelect?: boolean;
};

export function MenuCatalogSection({
  title,
  description,
  className,
  scrollToItemsOnCategorySelect = false,
}: MenuCatalogSectionProps) {
  const { categories, error: categoriesError } = useMenuCategories();
  const { items, loading, error, hasSupabaseEnv } = useMenuItems();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const itemsAnchorRef = useRef<HTMLDivElement | null>(null);

  const scrollToItems = () => {
    if (!scrollToItemsOnCategorySelect) return;
    itemsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  return (
    <section className={className}>
      {title ? (
        <div className="mb-5">
          <h1 className="text-3xl font-black">{title}</h1>
          {description ? <p className="mt-2 text-white/70">{description}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-[18px]">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => {
              setSelectedCategory((prev) => (prev === category.key ? null : category.key));
              scrollToItems();
            }}
            className={`group relative block h-[126px] sm:h-[138px] md:h-[152px] overflow-hidden rounded-[24px] shadow-soft text-left ${
              selectedCategory === category.key ? "ring-2 ring-primary" : "ring-0"
            }`}
            style={{ background: category.background }}
            aria-label={`Фильтровать по категории ${category.fullLabel}`}
          >
            {category.imageUrl ? (
              <img
                src={category.imageUrl}
                alt={category.fullLabel}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <h2 className="text-center text-white font-black tracking-wide text-2xl sm:text-3xl drop-shadow-[0_4px_14px_rgba(0,0,0,0.55)]">
                {category.fullLabel}
              </h2>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory(null);
            scrollToItems();
          }}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            selectedCategory === null ? "border-primary text-white" : "border-white/20 text-white/70"
          }`}
        >
          Все категории
        </button>
        {categories.map((category) => (
          <button
            key={`chip-${category.key}`}
            type="button"
            onClick={() => {
              setSelectedCategory(category.key);
              scrollToItems();
            }}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              selectedCategory === category.key ? "border-primary text-white" : "border-white/20 text-white/70"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl p-3 bg-danger/15 border border-danger/30 text-sm text-white">
          <div>{error.message}</div>
          <div className="mt-1 text-xs text-white/70">Код: {error.code}</div>
        </div>
      )}

      {categoriesError && (
        <div className="mt-4 rounded-2xl p-3 bg-danger/15 border border-danger/30 text-sm text-white">
          <div>{categoriesError.message}</div>
          <div className="mt-1 text-xs text-white/70">Код: {categoriesError.code}</div>
        </div>
      )}

      {!hasSupabaseEnv && (
        <div className="mt-4 rounded-2xl p-3 bg-black/20 border border-white/10 text-sm text-white/70">
          Supabase не настроен. Подключите БД, чтобы загрузить меню.
        </div>
      )}

      {loading ? <div className="mt-6 text-white/70">Загрузка меню…</div> : null}

      <div ref={itemsAnchorRef} className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && filteredItems.length === 0 ? <div className="text-white/60">В этой категории пока нет позиций.</div> : null}
        {filteredItems.map((item) => (
          <PizzaCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
