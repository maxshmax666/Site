import { MenuCatalogSection } from "../components/sections/MenuCatalogSection";

export function MenuPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <MenuCatalogSection title="Меню" description="Категории сверху, ниже — отфильтрованные позиции." />
    </div>
  );
}
