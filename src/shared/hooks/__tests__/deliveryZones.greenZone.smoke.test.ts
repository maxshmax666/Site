import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type LngLat = [number, number];

type PolygonGeoJson = {
  type: "Polygon";
  coordinates: LngLat[][];
};

const RESTAURANT_POINT: LngLat = [59.9816, 57.9183];

function parseGreenZonePolygon(sql: string): PolygonGeoJson {
  const updateRegex = /update\s+public\.delivery_zones\s+set\s+polygon_geojson\s*=\s*'([^']+)'::jsonb\s*where\s+name\s*=\s*'Зелёная зона';/i;
  const match = sql.match(updateRegex);

  if (!match?.[1]) {
    throw new Error("Green zone update statement not found in supabase_admin.sql");
  }

  const parsed = JSON.parse(match[1]) as PolygonGeoJson;

  if (parsed.type !== "Polygon") {
    throw new Error(`Expected Polygon, got ${parsed.type}`);
  }

  return parsed;
}

function isPointInPolygon(point: LngLat, ring: LngLat[]): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;

    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

describe("green delivery zone smoke", () => {
  it("contains restaurant point and has valid closed lon/lat ring", () => {
    const sqlPath = path.resolve(process.cwd(), "supabase_admin.sql");
    const sql = readFileSync(sqlPath, "utf8");
    const polygon = parseGreenZonePolygon(sql);
    const ring = polygon.coordinates[0] ?? [];

    expect(ring.length).toBeGreaterThanOrEqual(4);

    const [firstLon, firstLat] = ring[0] ?? [NaN, NaN];
    const [lastLon, lastLat] = ring[ring.length - 1] ?? [NaN, NaN];

    expect(firstLon).toBe(lastLon);
    expect(firstLat).toBe(lastLat);

    for (const [lon, lat] of ring) {
      expect(Number.isFinite(lon)).toBe(true);
      expect(Number.isFinite(lat)).toBe(true);
      expect(Math.abs(lon)).toBeLessThanOrEqual(180);
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
    }

    expect(isPointInPolygon(RESTAURANT_POINT, ring)).toBe(true);
  });
});
