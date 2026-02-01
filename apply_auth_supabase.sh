#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Installing supabase client..."
npm i @supabase/supabase-js

echo "==> Writing .env (Vite variables)..."
cat > .env <<'ENV'
VITE_SUPABASE_URL=https://fhgcdbdsetysklpfrnbv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_62DsrEmBL9NdimCdeJdorA_b1T5Kiuu
ENV

cat > .env.example <<'ENV'
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxx
ENV

mkdir -p src/lib src/store src/components

echo "==> Creating src/lib/supabase.ts..."
cat > src/lib/supabase.ts <<'TS'
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // В dev это лучше падать явно, чем ловить "черный экран"
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
TS

echo "==> Creating auth store..."
cat > src/store/auth.store.ts <<'TS'
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,

  init: async () => {
    // 1) initial session
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn("supabase.getSession error:", error);
    set({ session: data.session ?? null, user: data.session?.user ?? null, loading: false });

    // 2) subscribe to changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session: session ?? null, user: session?.user ?? null, loading: false });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
TS

echo "==> Creating AuthGate component..."
cat > src/components/AuthGate.tsx <<'TS'
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-3xl p-8 bg-card border border-white/10 shadow-soft">
          <div className="text-white/80">Загрузка…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
TS

echo "==> Patching src/app/App.tsx to init auth..."
cat > src/app/App.tsx <<'TS'
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "../store/auth.store";

export function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return <RouterProvider router={router} />;
}
TS

echo "==> Patching router to protect /profile..."
cat > src/app/router.tsx <<'TS'
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./layout/RootLayout";
import { HomePage } from "../pages/HomePage";
import { MenuPage } from "../pages/MenuPage";
import { PizzaPage } from "../pages/PizzaPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { CateringPage } from "../pages/CateringPage";
import { ContactsPage } from "../pages/ContactsPage";
import { LoyaltyPage } from "../pages/LoyaltyPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AuthGate } from "../components/AuthGate";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "pizza/:id", element: <PizzaPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "login", element: <LoginPage /> },
      {
        path: "profile",
        element: (
          <AuthGate>
            <ProfilePage />
          </AuthGate>
        ),
      },
      { path: "catering", element: <CateringPage /> },
      { path: "contacts", element: <ContactsPage /> },
      { path: "loyalty", element: <LoyaltyPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
TS

echo "==> Rewriting LoginPage with email/password + Google..."
cat > src/pages/LoginPage.tsx <<'TS'
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth.store";

function prettifyError(e: unknown) {
  const msg = typeof e === "object" && e && "message" in e ? String((e as any).message) : String(e);
  // Supabase часто возвращает англ. сообщения — оставим как есть, но можно улучшать позже
  return msg;
}

export function LoginPage() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const title = useMemo(() => (mode === "login" ? "Вход" : "Регистрация"), [mode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (!loading && user) {
    // уже залогинен
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <h1 className="text-2xl font-black">Ты уже вошёл ✅</h1>
          <div className="mt-2 text-white/70">{user.email}</div>
          <div className="mt-6 flex gap-2">
            <Link to="/profile"><Button>Профиль</Button></Link>
            <Button variant="soft" onClick={() => nav("/")}>На главную</Button>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      if (!email || !password) throw new Error("Введите email и пароль.");
      if (password.length < 6) throw new Error("Пароль минимум 6 символов.");

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/profile");
      } else {
        // Важно: если включено подтверждение email, пользователь увидит сообщение
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Если email confirmation включён — сессии может не быть сразу
        setOk("Проверь почту: мы отправили письмо для подтверждения (если включено в настройках).");
      }
    } catch (e) {
      setError(prettifyError(e));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/profile",
        },
      });
      if (error) throw error;
      // дальше редиректит Supabase/Google
    } catch (e) {
      setError(prettifyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-2xl font-black">{title}</h1>
          <button
            className="text-sm text-white/70 hover:text-white"
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setError(null);
              setOk(null);
            }}
            type="button"
          >
            {mode === "login" ? "Создать аккаунт" : "Уже есть аккаунт"}
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <Input
            placeholder="Email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Пароль (мин. 6 символов)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
            {error}
          </div>
        )}
        {ok && (
          <div className="mt-4 p-3 rounded-2xl bg-green/15 border border-green/30 text-sm text-white">
            {ok}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button disabled={busy} onClick={onSubmit}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Button>

          <Button disabled={busy} variant="soft" onClick={onGoogle}>
            Войти через Google
          </Button>

          <Button disabled={busy} variant="ghost" onClick={() => nav(-1)}>
            Назад
          </Button>
        </div>

        <div className="mt-4 text-xs text-white/60">
          Google-кнопка заработает после включения Google Provider в Supabase Auth.
        </div>
      </div>
    </div>
  );
}
TS

echo "==> Rewriting ProfilePage with user + logout..."
cat > src/pages/ProfilePage.tsx <<'TS'
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
TS

echo "✅ Supabase auth applied."
echo "Next: restart dev server: npm run dev"
