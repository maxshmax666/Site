import { useCallback, useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

export type Coordinates = [number, number];

export type DeliveryZone = {
  id: string;
  name: string;
  color: string;
  minOrderAmount: number;
  polygon: Coordinates[];
};

type DbDeliveryZone = {
  id: string;
  name: string;
  color: string;
  min_order_amount: number;
  polygon_geojson: GeoJSON.Polygon;
};

type UseDeliveryZonesResult = {
  zones: DeliveryZone[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};


function mapZone(zone: DbDeliveryZone): DeliveryZone {
  const ring = zone.polygon_geojson.coordinates[0] ?? [];

  return {
    id: zone.id,
    name: zone.name,
    color: zone.color,
    minOrderAmount: Number(zone.min_order_amount ?? 0),
    polygon: ring
      .map(([lon, lat]) => [Number(lat), Number(lon)] as Coordinates)
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon)),
  };
}

export function useDeliveryZones(): UseDeliveryZonesResult {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv || !supabase) {
      setZones([]);
      setLoading(false);
      setError("Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: supaError } = await supabase
      .from("delivery_zones")
      .select("id,name,color,min_order_amount,polygon_geojson")
      .order("priority", { ascending: true });

    if (supaError) {
      setError(supaError.message);
      setLoading(false);
      return;
    }

    const mapped = ((data ?? []) as DbDeliveryZone[])
      .map(mapZone)
      .filter((zone) => zone.polygon.length >= 3);

    if (mapped.length === 0) {
      setError("Зоны доставки не найдены в базе.");
    }

    setZones(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({
      zones,
      loading,
      error,
      reload: load,
    }),
    [error, load, loading, zones],
  );
}
