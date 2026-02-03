import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";

function prettifyError(e: unknown) {
  const msg = typeof e === "object" && e && "message" in e ? String((e as any).message) : String(e);
  return msg;
}

export function ResetPasswordPage() {
  const nav = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(prettifyError(error));
          setHasRecoverySession(false);
          return;
        }
        setHasRecoverySession(Boolean(data.session));
      })
      .catch((e) => {
        if (!active) return;
        setError(prettifyError(e));
        setHasRecoverySession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ok) return;
    const timeout = window.setTimeout(() => {
      nav("/profile");
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [ok, nav]);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      if (!password || !passwordConfirm) throw new Error("Введите пароль и подтверждение.");
      if (password.length < 6) throw new Error("Пароль минимум 6 символов.");
      if (password !== passwordConfirm) throw new Error("Пароли не совпадают.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setOk("Пароль обновлён. Сейчас перенаправим в профиль.");
    } catch (e) {
      setError(prettifyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (hasRecoverySession === false) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <h1 className="text-2xl font-black">Сброс пароля</h1>
          <div className="mt-3 text-white/70">
            Сессия восстановления не найдена. Откройте ссылку из письма для сброса пароля и
            повторите попытку.
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-2xl bg-danger/15 border border-danger/30 text-sm text-white">
              {error}
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <Link to="/login">
              <Button>Ко входу</Button>
            </Link>
            <Button variant="soft" onClick={() => nav(-1)}>
              Назад
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
        <h1 className="text-2xl font-black">Сброс пароля</h1>

        <div className="mt-5 grid gap-3">
          <Input
            placeholder="Новый пароль (мин. 6 символов)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Повторите пароль"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
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
          <Button disabled={busy || hasRecoverySession === null} onClick={onSubmit}>
            Обновить пароль
          </Button>
          <Button disabled={busy} variant="ghost" onClick={() => nav(-1)}>
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}
