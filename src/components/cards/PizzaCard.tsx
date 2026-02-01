import { Link } from "react-router-dom";
import type { MenuItem } from "../../data/menu";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useCartStore } from "../../store/cart.store";

export function PizzaCard({ item }: { item: MenuItem }) {
  const add = useCartStore((s) => s.add);

  return (
    <div className="rounded-3xl bg-card border border-white/10 shadow-soft overflow-hidden">
      <div className="h-36 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
        <div className="text-4xl">🍕</div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2">
          {item.badges?.includes("hit") && <Badge tone="yellow">ХИТ</Badge>}
          {item.badges?.includes("new") && <Badge tone="green">NEW</Badge>}
          {item.badges?.includes("spicy") && <Badge tone="orange">ОСТРО</Badge>}
        </div>
        <Link to={`/pizza/${item.id}`} className="block mt-3 font-bold text-lg hover:underline">
          {item.title}
        </Link>
        <div className="mt-1 text-sm text-white/70">{item.desc}</div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="font-semibold">от {item.priceFrom} ₽</div>
          <Button size="sm" variant="soft" onClick={() => add(item)}>
            В корзину
          </Button>
        </div>
      </div>
    </div>
  );
}
