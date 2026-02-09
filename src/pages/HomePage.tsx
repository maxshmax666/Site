import { MenuCatalogSection } from "../components/sections/MenuCatalogSection";

export function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <MenuCatalogSection
        title="Наше меню"
        description="Выберите категорию плиткой — сразу прокрутим к списку позиций ниже."
        className="mt-6"
        scrollToItemsOnCategorySelect
      />
    </div>
  );
}
