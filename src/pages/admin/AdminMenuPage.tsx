import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

type Category = "pizza" | "snacks" | "drinks" | "desserts" | "other";

type MenuItem = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  category: Category;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort: number;
};

const categories: { value: Category; label: string }[] = [
  { value: "pizza", label: "Пицца" },
  { value: "snacks", label: "Закуски" },
  { value: "drinks", label: "Напитки" },
  { value: "desserts", label: "Десерты" },
  { value: "other", label: "Другое" },
];

function money(n: number) {
  if (!Number.isFinite(n)) return "0 ₽";
  return `${Math.round(n)} ₽`;
}

export function AdminMenuPage() {
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("pizza");
  const [price, setPrice] = useState<string>("590");
  const [imageUrl, setImageUrl] = useState("");
  const [sort, setSort] = useState<string>("100");
  const [isActive, setIsActive] = useState(true);

  const activeCount = useMemo(() => rows.filter((r) => r.is_active).length, [rows]);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("menu_items")
      .select("id,created_at,title,description,category,price,image_url,is_active,sort")
      .order("category", { ascending: true })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  }

  async function createItem() {
    const p = Number(price);
    const s = Number(sort);

    if (!title.trim()) return alert("Название обязательно");
    if (!Number.isFinite(p) || p <= 0) return alert("Цена должна быть > 0");

    const payload = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      category,
      price: p,
      image_url: imageUrl.trim() ? imageUrl.trim() : null,
      is_active: !!isActive,
      sort: Number.isFinite(s) ? s : 100,
    };

    const { error } = await supabase.from("menu_items").insert(payload);
    if (error) return alert(error.message);

    setTitle("");
    setDescription("");
    setImageUrl("");
    setPrice("590");
    setSort("100");
    setIsActive(true);

    await load();
  }

  async function updateItem(id: string, patch: Partial<MenuItem>) {
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) return alert(error.message);
    await load();
  }

  async function removeItem(id: string) {
    if (!confirm("Удалить позицию?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return alert(error.message);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-white/70">
          Редактор меню (таблица <code>menu_items</code>). Активных:{" "}
          <span className="text-white font-bold">{activeCount}</span> / {rows.length}
        </div>
        <div className="flex gap-2">
          <Button variant="soft" onClick={load} disabled={loading}>
            Обновить
          </Button>
        </div>
      </div>

      {err && (
        <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
          {err}
          <div className="text-white/70 mt-1">
            Скорее всего ты ещё не выполнил SQL-setup для меню. Он лежит в <code>supabase_menu.sql</code>.
          </div>
        </div>
      )}

      {/* Create */}
      <div className="mt-5 rounded-2xl p-4 bg-black/20 border border-white/10">
        <div className="font-bold">Добавить позицию</div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Input placeholder="Название (например: Пепперони)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input
              placeholder="Описание (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="Ссылка на фото (опционально)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">
              Категория
              <select
                className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Цена ₽" value={price} onChange={(e) => setPrice(e.target.value)} />
              <Input placeholder="Сортировка" value={sort} onChange={(e) => setSort(e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Активно (видно клиентам)
            </label>

            <Button onClick={createItem}>Добавить</Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-5 grid gap-3">
        {loading && <div className="text-white/70">Загрузка…</div>}
        {!loading && rows.length === 0 && !err && <div className="text-white/60">Пока пусто</div>}

        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-lg">{r.title}</div>
                  <Badge>{categories.find((c) => c.value === r.category)?.label ?? r.category}</Badge>
                  {!r.is_active && <Badge>СКРЫТО</Badge>}
                </div>
                {r.description && <div className="text-white/70 text-sm mt-1">{r.description}</div>}
                {r.image_url && (
                  <div className="text-white/60 text-xs mt-1 break-all">
                    {r.image_url}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-white font-black text-lg">{money(r.price)}</div>
                <div className="text-white/60 text-xs">sort: {r.sort}</div>
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-4 gap-2">
              <Button
                variant={r.is_active ? "soft" : "primary"}
                onClick={() => updateItem(r.id, { is_active: !r.is_active })}
              >
                {r.is_active ? "Скрыть" : "Показать"}
              </Button>

              <Button
                variant="soft"
                onClick={() => {
                  const v = prompt("Новая цена ₽", String(r.price));
                  if (v === null) return;
                  const n = Number(v);
                  if (!Number.isFinite(n) || n <= 0) return alert("Неверная цена");
                  void updateItem(r.id, { price: n });
                }}
              >
                Изменить цену
              </Button>

              <Button
                variant="soft"
                onClick={() => {
                  const v = prompt("Сортировка (меньше = выше)", String(r.sort));
                  if (v === null) return;
                  const n = Number(v);
                  if (!Number.isFinite(n)) return alert("Неверная сортировка");
                  void updateItem(r.id, { sort: n });
                }}
              >
                Сортировка
              </Button>

              <Button variant="danger" onClick={() => removeItem(r.id)}>
                Удалить
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
