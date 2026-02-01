export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm text-white/80">
        <div>
          <div className="font-bold text-white">Tagil Pizza</div>
          <div className="mt-2">
            Доставка в зелёной зоне до 30 минут.
            <br />
            Самовывоз.
          </div>
        </div>

        <div>
          <div className="font-bold text-white">Время</div>
          <div className="mt-2">Ежедневно: 17:00 — 23:00</div>
          <div>Кейтеринг: по заявке</div>
        </div>

        <div>
          <div className="font-bold text-white">Контакты</div>
          <div className="mt-2">Тел: +7 902 266-44-08</div>
          <div>Тел: +7 995 566-44-08</div>
          <div>Адрес: Нижний Тагил, Юности 45</div>
        </div>
      </div>
    </footer>
  );
}
