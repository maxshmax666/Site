import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useCartStore } from "../store/cart.store";

export function CheckoutPage() {
  const nav = useNavigate();
  const total = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Оформление</h1>
      <div className="mt-2 text-white/70">MVP форма. Данные никуда не отправляем.</div>

      <div className="mt-6 rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
        <div className="grid gap-3">
          <Input placeholder="Имя" />
          <Input placeholder="Телефон" inputMode="tel" />
          <Input placeholder="Адрес доставки (или 'самовывоз')" />
          <Input placeholder="Комментарий к заказу (необязательно)" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-white/70">Итого</div>
          <div className="text-2xl font-black">{total} ₽</div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              clear();
              nav("/profile");
            }}
          >
            Подтвердить
          </Button>
          <Button variant="soft" onClick={() => nav(-1)}>
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}
