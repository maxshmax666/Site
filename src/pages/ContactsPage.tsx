import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { useDeliveryZones } from "../shared/hooks/useDeliveryZones";

type YMapPolygon = {
  geometry: {
    getCoordinates: () => number[][][];
    setCoordinates: (coordinates: number[][][]) => void;
  };
  options: {
    set: (key: string, value: string | number | boolean) => void;
  };
};

type YMapPlacemark = unknown;

type YMapInstance = {
  destroy: () => void;
  geoObjects: {
    add: (geoObject: YMapPolygon | YMapPlacemark) => void;
    removeAll: () => void;
  };
  setBounds: (bounds: [number, number][], options?: { checkZoomRange?: boolean; zoomMargin?: number }) => void;
};

type YMapsApi = {
  ready: (cb: () => void) => void;
  Map: new (container: HTMLElement, state: { center: number[]; zoom: number }, options?: Record<string, unknown>) => YMapInstance;
  Placemark: new (coordinates: number[], properties?: Record<string, unknown>, options?: Record<string, unknown>) => YMapPlacemark;
  Polygon: new (coordinates: number[][][], properties?: Record<string, unknown>, options?: Record<string, unknown>) => YMapPolygon;
  util: {
    bounds: {
      fromPoints: (points: number[][]) => [number, number][];
    };
  };
};

declare global {
  interface Window {
    ymaps?: YMapsApi;
  }
}

const RESTAURANT_COORDS: [number, number] = [57.9183, 59.9816];
const YANDEX_MAPS_SCRIPT_ID = "yandex-maps-script";

let scriptPromise: Promise<void> | null = null;

function loadYandexMapsScript() {
  if (window.ymaps) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(YANDEX_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Не удалось загрузить Yandex Maps.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = YANDEX_MAPS_SCRIPT_ID;
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить Yandex Maps."));

    document.head.appendChild(script);
  });

  return scriptPromise;
}

function fallbackMessage(error: string | null) {
  if (!error) return "Карта временно недоступна.";
  return `Карта временно недоступна: ${error}`;
}

export function ContactsPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMapInstance | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const { zones, loading, error: zonesError, reload } = useDeliveryZones();

  const hasMapData = zones.length > 0;
  const mapUnavailable = Boolean(mapError || zonesError || (!loading && !hasMapData));

  const pointsForBounds = useMemo(() => {
    const zonePoints = zones.flatMap((zone) => zone.polygon);
    return [RESTAURANT_COORDS, ...zonePoints];
  }, [zones]);

  useEffect(() => {
    if (!mapContainerRef.current || !hasMapData) {
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        await loadYandexMapsScript();
        if (cancelled || !mapContainerRef.current || !window.ymaps) {
          return;
        }

        window.ymaps.ready(() => {
          if (cancelled || !mapContainerRef.current || !window.ymaps) {
            return;
          }

          if (!mapRef.current) {
            mapRef.current = new window.ymaps.Map(
              mapContainerRef.current,
              {
                center: RESTAURANT_COORDS,
                zoom: 12,
              },
              {
                suppressMapOpenBlock: true,
              },
            );
          }

          const map = mapRef.current;
          map.geoObjects.removeAll();

          const restaurantMark = new window.ymaps.Placemark(
            RESTAURANT_COORDS,
            {
              balloonContent: "Tagil Pizza, Юности 45",
            },
            {
              preset: "islands#redFoodIcon",
            },
          );

          map.geoObjects.add(restaurantMark);

          zones.forEach((zone) => {
            const polygon = new window.ymaps!.Polygon(
              [zone.polygon],
              {
                hintContent: `${zone.name}: от ${zone.minOrderAmount} ₽`,
              },
              {
                fillColor: zone.color,
                strokeColor: zone.color,
                strokeWidth: 2,
                fillOpacity: 0.2,
                interactivityModel: "default#transparent",
              },
            );

            map.geoObjects.add(polygon);
          });

          const bounds = window.ymaps.util.bounds.fromPoints(pointsForBounds as number[][]);
          map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 32 });
          setMapError(null);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown";
        setMapError(message);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [hasMapData, pointsForBounds, zones]);

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
                Проверьте подключение к сети или доступность API Supabase/Yandex Maps.
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
