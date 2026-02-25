import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "../components/sections/Hero";
import { MenuCatalogSection } from "../components/sections/MenuCatalogSection";

export function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#menu") {
      return;
    }

    const scrollToMenu = () => {
      document.getElementById("menu")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    const rafId = requestAnimationFrame(scrollToMenu);
    const timeoutId = window.setTimeout(scrollToMenu, 120);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [location.hash]);

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
