import { Link } from "react-router-dom";
import type { MenuCategory } from "../../data/menuCategories";

type Props = {
  slug: MenuCategory;
  title: string;
  imageUrl?: string;
  fallbackBackground: string;
};

export function CategoryBannerTile({ slug, title, imageUrl, fallbackBackground }: Props) {
  return (
    <Link
      to={`/menu/${slug}`}
      className="group relative block h-[126px] sm:h-[138px] md:h-[152px] overflow-hidden rounded-[24px] shadow-soft"
      style={{ background: fallbackBackground }}
      aria-label={`Открыть категорию ${title}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <h2 className="text-center text-white font-black tracking-wide text-2xl sm:text-3xl drop-shadow-[0_4px_14px_rgba(0,0,0,0.55)]">
          {title}
        </h2>
      </div>
    </Link>
  );
}
