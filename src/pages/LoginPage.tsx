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
