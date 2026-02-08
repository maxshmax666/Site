import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-soft overflow-hidden">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-sm">
          <span className="text-yellow">★</span> Горячо. Быстро. Честно.
        </div>

        <h1 className="mt-4 text-4xl md:text-5xl font-black leading-tight">
          <span className="text-orange">Tagil</span>{" "}
          <span className="text-green">Pizza</span>{" "}
          <span className="text-yellow">🍕</span>
        </h1>

        <p className="mt-4 text-white/80">
          Быстрая доставка от 30 минут, тесто на долгой ферментации и только свежие качественные ингредиенты.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/menu">
            <Button size="lg">Открыть меню</Button>
          </Link>
          <Link to="/catering">
            <Button size="lg" variant="soft">
              Кейтеринг / События
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
