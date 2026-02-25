import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MenuCatalogSection } from "../components/sections/MenuCatalogSection";
import { scrollToMenuSection } from "../shared/scrollToMenu";

export function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#menu") {
      return;
    }

    let timeoutId: number | undefined;

    const tryScroll = (attempt: number) => {
      const isScrolled = scrollToMenuSection("smooth");

      if (isScrolled || attempt >= 5) {
        return;
      }

      timeoutId = window.setTimeout(() => tryScroll(attempt + 1), 120);
    };

    const rafId = requestAnimationFrame(() => tryScroll(0));

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [location.hash]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <div id="menu" className="scroll-mt-24">
        <MenuCatalogSection
          title="Меню на любой вкус"
          description="Выберите категорию и добавляйте любимые позиции в корзину — от классики до авторских сочетаний."
        />
      </div>
    </div>
  );
}
