import { useCallback, useEffect, useState } from "react";
import type { Place } from "./shop-search";

const KEY = "fishtankr:place";

export type LocationState = {
  place: Place | null;
  ready: boolean;
  status: "idle" | "asking" | "denied" | "failed" | "set";
  askBrowser: () => void;
  setPlace: (place: Place | null) => void;
};

function read(): Place | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Place;
    if (typeof parsed?.country !== "string") return null;
    return {
      country: parsed.country,
      region: parsed.region ?? null,
      city: parsed.city ?? null,
    };
  } catch {
    return null;
  }
}

function write(place: Place | null) {
  try {
    if (place) localStorage.setItem(KEY, JSON.stringify(place));
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked, keep the choice in memory only
  }
}

/** Free, keyless reverse lookup, deliberately limited to country and region. */
async function lookup(lat: number, lng: number): Promise<Place | null> {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    countryCode?: string;
    principalSubdivisionCode?: string;
    city?: string;
    locality?: string;
  };
  if (!data.countryCode) return null;
  const sub = data.principalSubdivisionCode?.split("-")[1] ?? null;
  return { country: data.countryCode, region: sub, city: data.city || data.locality || null };
}

export function useLocation(): LocationState {
  const [place, setPlaceState] = useState<Place | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<LocationState["status"]>("idle");

  useEffect(() => {
    const saved = read();
    if (saved) {
      setPlaceState(saved);
      setStatus("set");
    }
    setReady(true);
  }, []);

  const setPlace = useCallback((next: Place | null) => {
    setPlaceState(next);
    write(next);
    setStatus(next ? "set" : "idle");
  }, []);

  const askBrowser = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("failed");
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void lookup(pos.coords.latitude, pos.coords.longitude)
          .then((found) => {
            if (found) setPlace(found);
            else setStatus("failed");
          })
          .catch(() => setStatus("failed"));
      },
      () => setStatus("denied"),
      { timeout: 8000, maximumAge: 600000 },
    );
  }, [setPlace]);

  return { place, ready, status, askBrowser, setPlace };
}
