import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function OrderSuccessPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Заказ оформлен</h1>
      <div className="mt-2 text-white/70">Мы приняли заказ и уже передали его на кухню.</div>

      <div className="mt-6 rounded-3xl p-6 bg-card border border-white/10 shadow-soft space-y-4">
        <div className="text-white/70">Номер заказа</div>
        <div className="text-xl font-black break-all">{id}</div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => nav("/profile")}>К моим заказам</Button>
          <Button variant="soft" onClick={() => nav("/menu")}>Продолжить выбор</Button>
        </div>
      </div>
    </div>
  );
}
