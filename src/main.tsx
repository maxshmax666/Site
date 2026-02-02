import React from "react";
import { supabase } from "@/shared/supabaseClient";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/globals.css";


// ✅ Clean OAuth hash AFTER Supabase processes it (prevents leaking tokens in URL/history)
supabase.auth.onAuthStateChange((event) => {
  if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && window.location.hash.includes('access_token=')) {
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
