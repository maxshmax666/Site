import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { useDeliveryZones } from "../shared/hooks/useDeliveryZones";
import { GoogleMapAdapter } from "../shared/map/googleMapAdapter";

const RESTAURANT_COORDS = [57.9183, 59.9816] as const;

function fallbackMessage(error: string | null) {
  if (!error) return "Карта временно недоступна.";
  return `Карта временно недоступна: ${error}`;
}

export function ContactsPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapAdapter | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const { zones, loading, error: zonesError, reload } = useDeliveryZones();

  const hasMapData = zones.length > 0;
  const mapUnavailable = Boolean(mapError || zonesError || (!loading && !hasMapData));

  useEffect(() => {
    if (!mapContainerRef.current || !hasMapData) {
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        if (!mapContainerRef.current) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new GoogleMapAdapter(mapContainerRef.current, RESTAURANT_COORDS);
        }

        await mapRef.current.render(zones);

        if (!cancelled) {
          setMapError(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "unknown";
        setMapError(message);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [hasMapData, zones]);

  useEffect(() => {
    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Контакты</h1>
      <div className="mt-2 text-white/70">Адрес, часы, карта и реальные зоны доставки.</div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="font-bold text-lg">Tagil Pizza</div>
          <div className="mt-3 text-white/80">Нижний Тагил, Юности 45</div>
          <div className="mt-2 text-white/80">+7 902 266-44-08</div>
          <div className="mt-2 text-white/80">+7 995 566-44-08</div>
          <div className="mt-2 text-white/70">Ежедневно 17:00 — 23:00</div>
        </div>

        <div className="rounded-3xl p-6 bg-card border border-white/10 shadow-soft">
          <div className="font-bold text-lg">Карта</div>

          {loading ? (
            <div className="mt-3 h-72 md:h-96 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ) : !mapUnavailable ? (
            <div
              ref={mapContainerRef}
              className="mt-3 h-72 md:h-96 rounded-2xl border border-white/10 overflow-hidden"
              style={{ touchAction: "pan-x pan-y" }}
            />
          ) : (
            <div className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
              <div className="text-sm text-amber-200">{fallbackMessage(mapError ?? zonesError)}</div>
              <div className="mt-2 text-xs text-white/70">
                Проверьте подключение к сети или доступность API Supabase/Google Maps.
              </div>
              <div className="mt-4">
                <Button variant="soft" onClick={() => {
                  setMapError(null);
                  void reload();
                }} disabled={loading}>
                  {loading ? "Повторяем..." : "Повторить"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
