import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

export function LoyaltyPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Программа лояльности</h1>
          <div className="mt-2 text-white/70">Заглушка под зону доставки + бонусы.</div>
        </div>
        <Badge tone="green">BETA</Badge>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="text-xl font-bold">Бонусы</div>
          <div className="mt-3 text-white/80">
            1) Заказы → баллы → скидка.<br />
            2) День рождения → подарок.<br />
            3) “Хиты недели” → повышенные баллы.
          </div>
          <div className="mt-5">
            <Button variant="soft">Подключить</Button>
          </div>
        </div>

        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="text-xl font-bold">Зона доставки</div>
          <div className="mt-3 h-64 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white/60">
            Тут будет карта с зелёной/жёлтой/красной зоной
          </div>
          <div className="mt-3 text-xs text-white/60">
            Подключим позже через Google Maps / Яндекс карты. Сейчас — макет.
          </div>
        </div>
      </div>
    </div>
  );
}
