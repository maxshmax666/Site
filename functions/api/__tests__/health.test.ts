import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "../health";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns schema mismatch when required columns are missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "column delivery_zones.polygon_geojson does not exist" }),
    } as Response);

    const response = await onRequestGet({
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.error).toBe("schema-mismatch");
    expect(payload.schemaIssues).toHaveLength(2);
  });

  it("returns ok for compatible schema", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ([]),
    } as Response);

    const response = await onRequestGet({
      env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" },
    } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
  });
});
