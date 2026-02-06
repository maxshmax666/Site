import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { hasSupabaseEnv, supabase } from "../lib/supabase";
import type { Role } from "../lib/roles";
import { formatSupabaseError } from "../lib/errors";

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
  return formatSupabaseError(error, "Не удалось прочитать роль из profiles.");
}

let authSubscriptionCleanup: (() => void) | null = null;

async function fetchRole(): Promise<{ role: Role; error: string | null }> {
  if (!supabase) {
    return { role: "guest", error: "Supabase не настроен. Работаем в демо-режиме." };
  }

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
    .maybeSingle();

  if (error) {
    return { role: "guest", error: formatRoleError(error) };
  }
  if (!data) {
    console.debug(
      "profiles row is missing for authenticated user, using guest role. Run backfill/trigger from supabase_admin.sql.",
      { userId },
    );
    return { role: "guest", error: null };
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
    authSubscriptionCleanup?.();
    authSubscriptionCleanup = null;

    if (!hasSupabaseEnv || !supabase) {
      set({
        session: null,
        user: null,
        loading: false,
        role: "guest",
        roleError: "Supabase не настроен. Работаем в демо-режиме.",
      });
      return;
    }

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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session2) => {
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

    authSubscriptionCleanup = () => {
      authListener.subscription.unsubscribe();
    };
  },

  refreshRole: async () => {
    if (!supabase) return set({ role: "guest", roleError: "Supabase не настроен. Работаем в демо-режиме." });

    const user = get().user;
    if (!user) return set({ role: "guest", roleError: null });
    const res = await fetchRole();
    set({ role: res.role, roleError: res.error });
  },

  signOut: async () => {
    if (!supabase) {
      set({ session: null, user: null, role: "guest", roleError: "Supabase не настроен. Работаем в демо-режиме." });
      return;
    }

    await supabase.auth.signOut();
    set({ session: null, user: null, role: "guest", roleError: null });
  },
}));
