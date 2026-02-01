import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/auth.store";

export function ProfilePage() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Профиль</h1>
      <div className="mt-2 text-white/70">Аккаунт + выход. Дальше подключим историю заказов.</div>

      <div className="mt-6 rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
        <div className="font-bold text-lg">Ты в системе ✅</div>
        <div className="mt-2 text-white/80">Email: {user?.email ?? "—"}</div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/menu"><Button>Сделать заказ</Button></Link>
          <Link to="/loyalty"><Button variant="soft">Лояльность</Button></Link>
          <Button
            variant="danger"
            onClick={async () => {
              await signOut();
              nav("/");
            }}
          >
            Выйти
          </Button>
        </div>

        <div className="mt-4 text-xs text-white/60">
          Следующий этап: профиль → адреса, телефон, история заказов, бонусы.
        </div>
      </div>
    </div>
  );
}
