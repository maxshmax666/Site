export function ContactsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Контакты</h1>
      <div className="mt-2 text-white/70">Адрес, часы, карта.</div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="font-bold text-lg">Tagil Pizza</div>
          <div className="mt-3 text-white/80">Нижний Тагил, Юности 45</div>
          <div className="mt-2 text-white/80">+7 902 266-44-08</div>
          <div className="mt-2 text-white/80">+7 995 566-44-08</div>
          <div className="mt-2 text-white/70">Ежедневно 17:00 — 23:00</div>
        </div>

        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="font-bold text-lg">Карта</div>
          <div className="mt-3 h-64 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white/60">
            Тут будет карта зон доставки
          </div>
          <div className="mt-3 text-xs text-white/60">
            Позже подключим Google/Yandex и раскрасим зоны: зелёная/жёлтая/красная.
          </div>
        </div>
      </div>
    </div>
  );
}
