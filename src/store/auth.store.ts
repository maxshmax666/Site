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

  init: () => Promise<void>;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

async function fetchRole(): Promise<Role> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if (error) {
    // если таблицы ещё нет / RLS / нет профиля — пусть будет guest
    console.warn("profiles.role fetch error:", error.message);
    return "guest";
  }
  return (data?.role as Role) ?? "guest";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  role: "guest",

  init: async () => {
    // 1) initial session
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn("supabase.getSession error:", error);
    const session = data.session ?? null;
    set({ session, user: session?.user ?? null, loading: false });

    // 2) load role if logged in
    if (session?.user) {
      const role = await fetchRole();
      set({ role });
    } else {
      set({ role: "guest" });
    }

    // 3) subscribe
    supabase.auth.onAuthStateChange(async (_event, session2) => {
      set({ session: session2 ?? null, user: session2?.user ?? null, loading: false });

      if (session2?.user) {
        const role = await fetchRole();
        set({ role });
      } else {
        set({ role: "guest" });
      }
    });
  },

  refreshRole: async () => {
    const user = get().user;
    if (!user) return set({ role: "guest" });
    const role = await fetchRole();
    set({ role });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, role: "guest" });
  },
}));
