import React from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app/App";
import { appQueryClient } from "@/lib/queryClient";
import "./styles/globals.css";

// ✅ Clean OAuth hash AFTER Supabase processes it (prevents leaking tokens in URL/history)
if (hasSupabaseEnv && supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && window.location.hash.includes("access_token=")) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={appQueryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
