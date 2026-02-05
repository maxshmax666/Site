import { CategoryBannerTile } from "../components/cards/CategoryBannerTile";
import { useMenuCategories } from "../shared/hooks/useMenuCategories";

export function MenuPage() {
  const { categories } = useMenuCategories();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-5">
        <h1 className="text-3xl font-black">Меню</h1>
        <p className="mt-2 text-white/70">Выберите категорию и переходите к позициям.</p>
      </div>

      <div className="grid gap-4 sm:gap-[18px]">
        {categories.map((category) => (
          <CategoryBannerTile
            key={category.key}
            slug={category.key}
            title={category.fullLabel}
            imageUrl={category.imageUrl}
            fallbackBackground={category.background}
          />
        ))}
      </div>
    </div>
  );
}
