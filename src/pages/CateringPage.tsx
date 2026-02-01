import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function CateringPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Кейтеринг / События</h1>
      <div className="mt-2 text-white/70">
        Наборы на офис, день рождения, тусовку. MVP страница.
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="text-xl font-bold">Пакеты</div>
          <div className="mt-4 space-y-3 text-white/80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">На 10 человек — пицца + напитки</div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">На 20 человек — комбо + соусы</div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">На 50 человек — под задачу</div>
          </div>
        </div>

        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="text-xl font-bold">Заявка</div>
          <div className="mt-4 grid gap-3">
            <Input placeholder="Имя" />
            <Input placeholder="Телефон" inputMode="tel" />
            <Input placeholder="Дата/время" />
            <Input placeholder="Сколько человек" inputMode="numeric" />
            <Input placeholder="Комментарий" />
          </div>
          <div className="mt-5">
            <Button>Отправить</Button>
          </div>
          <div className="mt-3 text-xs text-white/60">Отправка будет через API/бота на следующем этапе.</div>
        </div>
      </div>
    </div>
  );
}
