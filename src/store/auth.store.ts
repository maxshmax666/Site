import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Role } from "../lib/roles";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;

  // ✅ роль берём из public.profiles
  role: Role;
  roleError: string | null;

  init: () => Promise<void>;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

function formatRoleError(error: { code?: string; message?: string }) {
  if (error.code === "PGRST116") {
    return "Нет строки в profiles для текущего пользователя. Запустите backfill/триггер из supabase_admin.sql.";
  }
  return error.message ?? "Не удалось прочитать роль из profiles.";
}

async function fetchRole(): Promise<{ role: Role; error: string | null }> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;

  if (userErr) {
    return { role: "guest", error: userErr.message };
  }
  if (!userId) {
    return { role: "guest", error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error) {
    return { role: "guest", error: formatRoleError(error) };
  }
  return { role: (data?.role as Role) ?? "guest", error: null };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  role: "guest",
  roleError: null,

  init: async () => {
    // 1) initial session
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn("supabase.getSession error:", error);
    const session = data.session ?? null;
    set({ session, user: session?.user ?? null, loading: false });

    // 2) load role if logged in
    if (session?.user) {
      const res = await fetchRole();
      set({ role: res.role, roleError: res.error });
    } else {
      set({ role: "guest", roleError: null });
    }

    // 3) subscribe
    supabase.auth.onAuthStateChange(async (event, session2) => {
      set({ session: session2 ?? null, user: session2?.user ?? null, loading: false });

      if (event === "PASSWORD_RECOVERY") {
        window.location.assign("/reset-password");
      }

      if (session2?.user) {
        const res = await fetchRole();
        set({ role: res.role, roleError: res.error });
      } else {
        set({ role: "guest", roleError: null });
      }
    });
  },

  refreshRole: async () => {
    const user = get().user;
    if (!user) return set({ role: "guest", roleError: null });
    const res = await fetchRole();
    set({ role: res.role, roleError: res.error });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, role: "guest", roleError: null });
  },
}));
