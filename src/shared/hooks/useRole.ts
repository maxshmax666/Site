import { useEffect, useState } from "react";
import { supabase } from "@/shared/supabaseClient";

export type AppRole = "guest" | "courier" | "manager" | "engineer" | "admin";

export function useRole() {
  const [role, setRole] = useState<AppRole>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (active) {
          setRole("guest");
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (active) {
        setRole((data?.role as AppRole) || "guest");
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { role, loading };
}
