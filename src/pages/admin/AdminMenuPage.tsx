import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { defaultMenuCategories } from "../../data/menuCategories";

type MenuItem = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  category: string;
  hasLegacyCategory: boolean;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort: number;
};

type CategoryOption = {
  key: string;
  label: string;
};

type FormState = {
  title: string;
  description: string;
  category: string;
  price: string;
  imageUrl: string;
  sort: string;
  isActive: boolean;
};

const MAX_ERROR_DETAILS = 5;
const MENU_CATEGORY_MIGRATION_ERROR = "Схема БД не мигрирована: menu_category";

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  category: "",
  price: "590",
  imageUrl: "",
  sort: "100",
  isActive: true,
};

function toTrimmedString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new Error(`Поле "${field}" должно быть строкой`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Поле "${field}" не должно быть пустым`);
  }
  return trimmed;
}

function toOptionalString(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(`Поле "${field}" должно быть строкой или null`);
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNumber(value: unknown, field: string) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Поле "${field}" должно быть числом`);
  }
  return n;
}

function mapDbItem(raw: Record<string, unknown>): MenuItem {
  const rawCategory = String(raw.category ?? "").trim();
  const hasLegacyCategory = !rawCategory;
  const category = rawCategory || "classic";

  const isActiveValue = raw.is_active;
  if (typeof isActiveValue !== "boolean") {
    throw new Error('Поле "is_active" должно быть boolean');
  }

  return {
    id: toTrimmedString(raw.id, "id"),
    created_at: toTrimmedString(raw.created_at, "created_at"),
    title: toTrimmedString(raw.title, "title"),
    description: toOptionalString(raw.description, "description"),
    category,
    hasLegacyCategory,
    price: toNumber(raw.price, "price"),
    image_url: toOptionalString(raw.image_url, "image_url"),
    is_active: isActiveValue,
    sort: toNumber(raw.sort, "sort"),
  };
}

function money(n: number) {
  if (!Number.isFinite(n)) return "0 ₽";
  return `${Math.round(n)} ₽`;
}

function getDbErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "22P02") {
    return `${MENU_CATEGORY_MIGRATION_ERROR}. ${error.message}`;
  }
  return error.message;
}

function mapCategoryRows(rawRows: unknown[]): CategoryOption[] {
  const rows = rawRows
    .map((row) => row as Record<string, unknown>)
    .map((row) => {
      const key = String(row.key ?? "");
      const label = String(row.label ?? "").trim();
      if (!key || !label) {
        return null;
      }
      return { key, label } satisfies CategoryOption;
    })
    .filter(Boolean) as CategoryOption[];

  return rows.length > 0
    ? rows
    : defaultMenuCategories.map((category) => ({ key: category.value, label: category.fullLabel }));
}

export function AdminMenuPage() {
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>(
    defaultMenuCategories.map((category) => ({ key: category.value, label: category.fullLabel }))
  );

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const activeCount = useMemo(() => rows.filter((r) => r.is_active).length, [rows]);

  async function loadCategories() {
    const { data } = await supabase.from("menu_categories").select("key,label").order("sort", { ascending: true });
    setCategories(mapCategoryRows(Array.isArray(data) ? data : []));
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Нужен файл изображения (png/jpg/webp).");
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error("Файл слишком большой. Максимум 5MB.");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `${crypto.randomUUID()}.${ext}`;
    const path = `menu/${safeName}`;

    const { error } = await supabase.storage.from("menu").upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
    });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("menu").getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Не удалось получить публичный URL.");
    return data.publicUrl;
  }

  async function handleUpload() {
    if (!imageFile) {
      alert("Выбери файл");
      return;
    }

    setUploading(true);
    setUploadErr(null);

    try {
      const url = await uploadImage(imageFile);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

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

    if (error) {
      setErr(getDbErrorMessage(error));
      setRows([]);
      setLoading(false);
      return;
    }

    const rowsToMap = Array.isArray(data) ? data : [];
    const nextRows: MenuItem[] = [];
    const errors: string[] = [];

    rowsToMap.forEach((item, index) => {
      try {
        nextRows.push(mapDbItem(item as Record<string, unknown>));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Неизвестная ошибка";
        errors.push(`Строка ${index + 1}: ${message}`);
      }
    });

    if (errors.length > 0) {
      const details = errors.slice(0, MAX_ERROR_DETAILS).join("; ");
      const suffix = errors.length > MAX_ERROR_DETAILS ? ` (+${errors.length - MAX_ERROR_DETAILS} ещё)` : "";
      setErr(`Предупреждение: часть строк загружена с ограничениями: ${details}${suffix}`);
    }

    setRows(nextRows);
    setLoading(false);
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setFormError(null);
    setEditingId(null);
    setImageFile(null);
    setUploadErr(null);
  }

  function validateForm(current: FormState) {
    if (!current.title.trim()) {
      return "Введите название";
    }
    if (!current.category) {
      return "Выберите категорию";
    }
    const priceValue = Number(current.price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      return "Введите корректную цену";
    }
    const sortValue = Number(current.sort);
    if (!Number.isFinite(sortValue)) {
      return "Введите корректную сортировку";
    }
    return null;
  }

  async function saveItem() {
    const validationError = validateForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      price: Number(form.price),
      image_url: form.imageUrl.trim() || null,
      is_active: form.isActive,
      sort: Number(form.sort),
    };

    if (!payload.category) {
      setFormError("Выберите категорию");
      return;
    }

    if (editingId) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editingId);
      if (error) {
        setFormError(getDbErrorMessage(error));
        return;
      }
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) {
        setFormError(getDbErrorMessage(error));
        return;
      }
    }

    resetForm();
    await load();
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      category: item.category,
      price: String(item.price),
      imageUrl: item.image_url ?? "",
      sort: String(item.sort),
      isActive: item.is_active,
    });
    setFormError(null);
  }

  async function updateItem(id: string, patch: Partial<MenuItem>) {
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) return alert(getDbErrorMessage(error));
    await load();
  }

  async function removeItem(id: string) {
    if (!confirm("Удалить позицию?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return alert(getDbErrorMessage(error));
    if (editingId === id) {
      resetForm();
    }
    await load();
  }

  useEffect(() => {
    void Promise.all([load(), loadCategories()]);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-white/70">
          Редактор меню (таблица <code>menu_items</code>). Активных: <span className="text-white font-bold">{activeCount}</span> / {rows.length}
        </div>
        <Button variant="soft" onClick={() => void Promise.all([load(), loadCategories()])} disabled={loading}>
          Обновить
        </Button>
      </div>

      {err && <div className="mt-4 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-400/30 text-sm text-yellow-100">{err}</div>}

      <div className="mt-5 rounded-2xl p-4 bg-black/20 border border-white/10">
        <div className="font-bold">{editingId ? "Редактировать позицию" : "Добавить позицию"}</div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Input placeholder="Название" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Описание (опционально)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <Input placeholder="Ссылка на фото (опционально)" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            <label className="text-sm text-white/70">
              Фото файла (загрузка в Supabase Storage)
              <input type="file" accept="image/*" className="mt-1 block w-full text-sm text-white/70" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="soft" onClick={handleUpload} disabled={uploading || !imageFile}>{uploading ? "Загрузка…" : "Загрузить фото"}</Button>
              {imageFile && <div className="text-xs text-white/60">{imageFile.name}</div>}
            </div>
            {uploadErr && <div className="text-xs text-danger">{uploadErr}</div>}
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">
              Категория *
              <select
                className="mt-1 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>{category.label}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Цена ₽" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              <Input placeholder="Сортировка" value={form.sort} onChange={(e) => setForm((p) => ({ ...p, sort: e.target.value }))} />
            </div>

            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              Активно (видно клиентам)
            </label>

            {formError && <div className="text-sm text-danger">{formError}</div>}

            <div className="flex gap-2">
              <Button onClick={saveItem}>{editingId ? "Сохранить" : "Добавить"}</Button>
              {editingId ? (
                <Button variant="soft" onClick={resetForm}>Отмена</Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {loading && <div className="text-white/70">Загрузка…</div>}
        {!loading && rows.length === 0 && !err && <div className="text-white/60">Пока пусто</div>}

        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 bg-black/20 border border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-lg">{r.title}</div>
                  <Badge>{categories.find((c) => c.key === r.category)?.label ?? r.category}</Badge>
                  {r.hasLegacyCategory && <Badge>legacy category, требуется миграция</Badge>}
                  {!r.is_active && <Badge>СКРЫТО</Badge>}
                </div>
                {r.description && <div className="text-white/70 text-sm mt-1">{r.description}</div>}
              </div>

              <div className="text-right">
                <div className="text-white font-black text-lg">{money(r.price)}</div>
                <div className="text-white/60 text-xs">sort: {r.sort}</div>
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-7 gap-2">
              <Button variant={r.is_active ? "soft" : "primary"} onClick={() => void updateItem(r.id, { is_active: !r.is_active })}>{r.is_active ? "Скрыть" : "Показать"}</Button>
              <Button variant="soft" onClick={() => startEdit(r)}>Редактировать</Button>
              <Button variant="soft" onClick={() => {
                const v = prompt("Новая цена ₽", String(r.price));
                if (v === null) return;
                const n = Number(v);
                if (!Number.isFinite(n) || n <= 0) return alert("Неверная цена");
                void updateItem(r.id, { price: n });
              }}>Изменить цену</Button>
              <Button variant="soft" onClick={() => {
                const v = prompt("Сортировка (меньше = выше)", String(r.sort));
                if (v === null) return;
                const n = Number(v);
                if (!Number.isFinite(n)) return alert("Неверная сортировка");
                void updateItem(r.id, { sort: n });
              }}>Сортировка</Button>
              <Button variant="soft" onClick={() => {
                const v = prompt("Ссылка на фото", r.image_url ?? "");
                if (v === null) return;
                const next = v.trim();
                void updateItem(r.id, { image_url: next ? next : null });
              }}>Фото (URL)</Button>
              <Button variant="soft" disabled={!r.image_url} onClick={() => void updateItem(r.id, { image_url: null })}>Очистить фото</Button>
              <Button variant="danger" onClick={() => void removeItem(r.id)}>Удалить</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
