import { useEffect, useState } from "react";
import { fetchJson, isApiClientError } from "@/lib/apiClient";

type HealthPayload = {
  ok: boolean;
  error?: string;
  code?: string;
};

type UseSchemaPreflightResult = {
  schemaMismatch: boolean;
  loading: boolean;
  message: string | null;
};

const SCHEMA_MIGRATION_MESSAGE = "Требуется миграция БД: примените supabase_admin.sql и supabase_menu.sql.";

export function useSchemaPreflight(): UseSchemaPreflightResult {
  const [schemaMismatch, setSchemaMismatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const payload = await fetchJson<HealthPayload>("/api/health", { timeoutMs: 6_000 });
        if (cancelled) {
          return;
        }

        const mismatch = payload.error === "schema-mismatch" || payload.code === "SCHEMA_MISMATCH";
        setSchemaMismatch(mismatch);
        setMessage(mismatch ? SCHEMA_MIGRATION_MESSAGE : null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isApiClientError(error) && error.status === 503) {
          setSchemaMismatch(true);
          setMessage(SCHEMA_MIGRATION_MESSAGE);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    schemaMismatch,
    loading,
    message,
  };
}
