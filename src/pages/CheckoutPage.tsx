import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth.store";
import { useCartStore } from "../store/cart.store";
import { selectCartLines, selectCartTotal } from "../store/cart.selectors";

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export function CheckoutPage() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);

  const lines = useCartStore(selectCartLines);
  const total = useCartStore(selectCartTotal);
  const clear = useCartStore((s) => s.clear);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    !submitting &&
    lines.length > 0 &&
    customerName.trim().length > 1 &&
    phoneRegex.test(customerPhone.trim()) &&
    address.trim().length > 3;

  async function onSubmit() {
    if (!canSubmit) return;

    if (!user) {
      setErrorMessage("Нужна авторизация перед оформлением заказа.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          created_by: user.id,
          total,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          address: address.trim(),
          comment: comment.trim() || null,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;
      if (!order?.id) throw new Error("Не удалось получить ID заказа.");

      const payload = lines.map((line) => ({
        order_id: order.id,
        title: line.size ? `${line.title} (${line.size})` : line.title,
        qty: line.qty,
        price: line.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(payload);
      if (itemsError) throw itemsError;

      clear();
      nav(`/order/success/${order.id}`, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось оформить заказ. Попробуйте снова.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Оформление</h1>
      <div className="mt-2 text-white/70">Проверьте данные, после подтверждения заказ уйдёт в обработку.</div>

      <div className="mt-6 rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
        <div className="grid gap-3">
          <Input placeholder="Имя" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <Input
            placeholder="Телефон"
            inputMode="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          <Input
            placeholder="Адрес доставки (или 'самовывоз')"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            placeholder="Комментарий к заказу (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-white/70">Итого</div>
          <div className="text-2xl font-black">{total} ₽</div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? "Отправка..." : "Подтвердить"}
          </Button>
          <Button variant="soft" onClick={() => nav(-1)} disabled={submitting}>
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}
