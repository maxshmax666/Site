import { ensureRequiredApiEnv, type ApiEnv, json, resolveSupabaseOrigin } from "./_utils";

type SchemaRequirement = {
  table: string;
  columns: string[];
};

type SchemaIssue = {
  table: string;
  columns: string[];
  message: string;
};

const SCHEMA_REQUIREMENTS: SchemaRequirement[] = [
  {
    table: "menu_categories",
    columns: ["full_label", "image_url", "fallback_background", "sort", "is_active"],
  },
  {
    table: "delivery_zones",
    columns: ["priority", "polygon_geojson"],
  },
];

function toSchemaUrl(origin: string, table: string, columns: string[]): string {
  const url = new URL(`/rest/v1/${table}`, origin);
  url.searchParams.set("select", columns.join(","));
  url.searchParams.set("limit", "1");
  return url.toString();
}

async function checkSchema(env: ApiEnv): Promise<SchemaIssue[]> {
  const origin = resolveSupabaseOrigin(env);
  if (!origin || !env.SUPABASE_ANON_KEY) {
    return [];
  }

  const headers = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    Accept: "application/json",
  };

  const checks = await Promise.all(
    SCHEMA_REQUIREMENTS.map(async ({ table, columns }) => {
      const response = await fetch(toSchemaUrl(origin, table, columns), {
        method: "GET",
        headers,
      });

      if (response.ok) {
        return null;
      }

      let message = `Schema check failed for table ${table}`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        message = `${message}: HTTP ${response.status}`;
      }

      return {
        table,
        columns,
        message,
      } satisfies SchemaIssue;
    }),
  );

  return checks.filter(Boolean) as SchemaIssue[];
}

export const onRequestGet: PagesFunction<ApiEnv> = async ({ env }) => {
  const envError = ensureRequiredApiEnv(env);
  if (envError) {
    return envError;
  }

  try {
    const schemaIssues = await checkSchema(env);

    if (schemaIssues.length > 0) {
      return json(
        {
          ok: false,
          code: "SCHEMA_MISMATCH",
          error: "schema-mismatch",
          schemaIssues,
        },
        { status: 503 },
      );
    }

    return json(
      {
        ok: true,
        schema: {
          status: "ok",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return json(
      {
        ok: false,
        code: "HEALTHCHECK_FAILED",
        error: "healthcheck-failed",
        message: error instanceof Error ? error.message : "Unknown healthcheck error",
      },
      { status: 503 },
    );
  }
};
