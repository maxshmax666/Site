import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { createSberbankPaymentCode } from "../shared/payments/sberCode";
import { queryKeys } from "../shared/queryKeys";
import { CheckoutMutationError, createCheckoutOrder } from "../shared/repositories/checkoutRepository";
import { selectCartLines, selectCartTotal } from "../store/cart.selectors";
import { useAuthStore } from "../store/auth.store";
import { useCartStore } from "../store/cart.store";

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

function createIdempotencyKey() {
  return crypto.randomUUID();
}

function formatCheckoutError(error: unknown): string {
  if (error instanceof CheckoutMutationError) {
    if (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR") {
      return `Сеть нестабильна. Повторите попытку через пару секунд. Код: ${error.diagnosticCode}`;
    }

    if (error.code === "UNAUTHORIZED") {
      return `Сессия истекла. Войдите снова и повторите. Код: ${error.diagnosticCode}`;
    }

    return `${error.message}. Код: ${error.diagnosticCode}`;
  }

  if (error instanceof Error) {
    return `${error.message}.`;
  }

  return "Не удалось оформить заказ. Попробуйте снова.";
}

export function CheckoutPage() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  const lines = useCartStore(selectCartLines);
  const total = useCartStore(selectCartTotal);
  const clear = useCartStore((s) => s.clear);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "sberbank_code">("cash");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sberbankPaymentCode = createSberbankPaymentCode(total);

  const createOrderMutation = useMutation({
    mutationFn: async (idempotencyKey: string) => {
      if (!session?.access_token) {
        throw new CheckoutMutationError("Unauthorized", "UNAUTHORIZED", `CHK-${idempotencyKey.slice(0, 8).toUpperCase()}`);
      }

      return createCheckoutOrder({
        total,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        comment: comment.trim() || undefined,
        paymentMethod,
        paymentCode: paymentMethod === "sberbank_code" ? sberbankPaymentCode : undefined,
        items: lines.map((line) => ({
          title: line.size ? `${line.title} (${line.size})` : line.title,
          qty: line.qty,
          price: line.price,
        })),
        idempotencyKey,
        accessToken: session.access_token,
      });
    },
    retry: (failureCount, error) => {
      if (!(error instanceof CheckoutMutationError)) {
        return false;
      }

      const isSafeRetry = error.code === "TIMEOUT" || error.code === "NETWORK_ERROR";
      return isSafeRetry && failureCount < 1;
    },
    onSuccess: async ({ orderId }) => {
      clear();

      if (user?.id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.orders.my(user.id, 0).slice(0, 3),
        });
      }

      nav(`/order/success/${orderId}`, { replace: true });
    },
    onError: (error) => {
      setErrorMessage(formatCheckoutError(error));
    },
  });

  const canSubmit =
    !createOrderMutation.isPending &&
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

    setErrorMessage(null);
    await createOrderMutation.mutateAsync(createIdempotencyKey());
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

        <div className="mt-5 space-y-3">
          <div className="text-sm text-white/70">Способ оплаты</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant={paymentMethod === "cash" ? "primary" : "soft"}
              onClick={() => setPaymentMethod("cash")}
              disabled={createOrderMutation.isPending}
            >
              Наличными при получении
            </Button>
            <Button
              variant={paymentMethod === "sberbank_code" ? "primary" : "soft"}
              onClick={() => setPaymentMethod("sberbank_code")}
              disabled={createOrderMutation.isPending}
            >
              Безнал (код Сбербанк)
            </Button>
          </div>

          {paymentMethod === "sberbank_code" && (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <div className="text-emerald-100/90">Код оплаты сформирован по сумме заказа:</div>
              <div className="mt-1 break-all font-mono text-xs sm:text-sm">{sberbankPaymentCode}</div>
            </div>
          )}
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
          <Button onClick={onSubmit} disabled={!canSubmit || createOrderMutation.isPending}>
            {createOrderMutation.isPending ? "Отправка..." : "Подтвердить"}
          </Button>
          <Button variant="soft" onClick={() => nav(-1)} disabled={createOrderMutation.isPending}>
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}
