export type Coordinates = readonly [number, number];

export type DeliveryZoneMapShape = {
  color: string;
  minOrderAmount: number;
  name: string;
  polygon: Coordinates[];
};

type GoogleMapApi = {
  maps: {
    Animation: { DROP: number };
    Map: new (container: HTMLElement, options: { center: Coordinates; zoom: number; mapTypeControl?: boolean; streetViewControl?: boolean }) => GoogleMapInstance;
    Marker: new (options: { map: GoogleMapInstance; position: Coordinates; title: string; animation?: number }) => GoogleMarkerInstance;
    Polygon: new (options: {
      paths: Coordinates[];
      map: GoogleMapInstance;
      fillColor: string;
      fillOpacity: number;
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
    }) => GooglePolygonInstance;
    LatLngBounds: new () => GoogleLatLngBounds;
  };
};

type GoogleMapInstance = {
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void;
};

type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
};

type GooglePolygonInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
};

type GoogleLatLngBounds = {
  extend: (point: Coordinates) => void;
};

declare global {
  interface Window {
    google?: GoogleMapApi;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_LANGUAGE = "ru";

let scriptPromise: Promise<GoogleMapApi> | null = null;

function getGoogleMapsApiKey() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Не задан VITE_GOOGLE_MAPS_API_KEY для Google Maps API.");
  }

  return apiKey;
}

export function loadGoogleMapsScript() {
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<GoogleMapApi>((resolve, reject) => {
    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(getGoogleMapsApiKey())}&language=${GOOGLE_MAPS_LANGUAGE}`;
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }

      scriptPromise = null;
      reject(new Error("Google Maps API загружен некорректно."));
    };

    const handleError = () => {
      scriptPromise = null;
      existingScript?.remove();
      reject(new Error("Не удалось загрузить Google Maps API."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("Не удалось загрузить Google Maps API."));
    }, { once: true });

    document.head.appendChild(script);
  });

  return scriptPromise;
}

export class GoogleMapAdapter {
  private map: GoogleMapInstance | null = null;
  private overlays: Array<GoogleMarkerInstance | GooglePolygonInstance> = [];

  constructor(private readonly container: HTMLElement, private readonly center: Coordinates) {}

  async render(zones: DeliveryZoneMapShape[]) {
    const google = await loadGoogleMapsScript();

    if (!this.map) {
      this.map = new google.maps.Map(this.container, {
        center: this.center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });
    }

    this.overlays.forEach((overlay) => overlay.setMap(null));
    this.overlays = [];

    const map = this.map;
    if (!map) {
      throw new Error("Не удалось инициализировать Google Map instance.");
    }

    const marker = new google.maps.Marker({
      map,
      position: this.center,
      title: "Tagil Pizza, Юности 45",
      animation: google.maps.Animation.DROP,
    });
    this.overlays.push(marker);

    zones.forEach((zone) => {
      const polygon = new google.maps.Polygon({
        paths: zone.polygon,
        map,
        fillColor: zone.color,
        fillOpacity: 0.2,
        strokeColor: zone.color,
        strokeOpacity: 1,
        strokeWeight: 2,
      });
      this.overlays.push(polygon);
    });

    const bounds = new google.maps.LatLngBounds();
    [this.center, ...zones.flatMap((zone) => zone.polygon)].forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 32);
  }

  destroy() {
    this.overlays.forEach((overlay) => overlay.setMap(null));
    this.overlays = [];
    this.map = null;
  }
}
