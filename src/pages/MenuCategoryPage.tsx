import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { PizzaCard } from "../components/cards/PizzaCard";
import { isMenuCategory } from "../data/menuCategories";
import { useMenuItems } from "../shared/hooks/useMenuItems";
import { useMenuCategories } from "../shared/hooks/useMenuCategories";

export function MenuCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { categories } = useMenuCategories();
  const { items, loading, error, hasSupabaseEnv } = useMenuItems();

  const currentCategory = useMemo(() => {
    if (!category || !isMenuCategory(category)) {
      return null;
    }
    return categories.find((item) => item.key === category) ?? null;
  }, [categories, category]);

  const itemsForCategory = useMemo(() => {
    if (!category || !isMenuCategory(category)) {
      return [];
    }
    return items.filter((item) => item.category === category);
  }, [items, category]);

  if (!currentCategory) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-3xl p-5 bg-card border border-white/10">
          <div className="text-xl font-black">Категория не найдена</div>
          <Link to="/menu" className="mt-3 inline-flex text-white/80 hover:underline">
            Вернуться к списку категорий
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/menu" className="text-sm text-white/70 hover:text-white">← Все категории</Link>

      <div className="mt-3 rounded-[24px] p-6 border border-white/10 relative overflow-hidden" style={{ background: currentCategory.background }}>
        {currentCategory.imageUrl ? (
          <img
            src={currentCategory.imageUrl}
            alt={currentCategory.fullLabel}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
        <h1 className="relative text-3xl sm:text-4xl font-black">{currentCategory.fullLabel}</h1>
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
        {itemsForCategory.map((item) => (
          <PizzaCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
