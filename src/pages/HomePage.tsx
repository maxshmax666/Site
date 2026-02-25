import { Hero } from "../components/sections/Hero";
import { MenuCatalogSection } from "../components/sections/MenuCatalogSection";

export function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <section className="mt-10">
        <Hero />
      </section>

      <div id="menu" className="mt-10 scroll-mt-24">
        <MenuCatalogSection
          title="Меню на любой вкус"
          description="Выберите категорию и добавляйте любимые позиции в корзину — от классики до авторских сочетаний."
        />
      </div>
    </div>
  );
}
