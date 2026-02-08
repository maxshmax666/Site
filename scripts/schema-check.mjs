#!/usr/bin/env node

const origin = process.env.SUPABASE_URL ?? process.env.API_ORIGIN;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!origin || !anonKey) {
  console.error("[schema-check] Missing SUPABASE_URL|API_ORIGIN or SUPABASE_ANON_KEY");
  process.exit(2);
}

const requirements = [
  {
    table: "menu_categories",
    columns: ["full_label", "image_url", "fallback_background", "sort", "is_active"],
  },
  {
    table: "delivery_zones",
    columns: ["priority", "polygon_geojson"],
  },
];

function buildUrl(table, columns) {
  const url = new URL(`/rest/v1/${table}`, origin);
  url.searchParams.set("select", columns.join(","));
  url.searchParams.set("limit", "1");
  return url;
}

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  Accept: "application/json",
};

const failures = [];

for (const requirement of requirements) {
  const url = buildUrl(requirement.table, requirement.columns);

  let response;
  try {
    response = await fetch(url, { headers });
  } catch (error) {
    failures.push({
      table: requirement.table,
      columns: requirement.columns,
      message: error instanceof Error ? error.message : "Network error",
    });
    continue;
  }

  if (response.ok) {
    continue;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  failures.push({
    table: requirement.table,
    columns: requirement.columns,
    message: payload?.message ?? `HTTP ${response.status}`,
  });
}

if (failures.length > 0) {
  console.error("[schema-check] DB schema mismatch detected:");
  for (const failure of failures) {
    console.error(`- ${failure.table} (${failure.columns.join(",")}): ${failure.message}`);
  }
  process.exit(1);
}

console.log("[schema-check] Schema is compatible.");
