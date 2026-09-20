import { useEffect } from "react";
import { Crosshair, MapPin } from "lucide-react";
import type { LocationState } from "@/lib/location";
import { countryName, type ShopDirectoryEntry } from "@/lib/shop-search";

type Props = {
  location: LocationState;
  shops: ShopDirectoryEntry[];
};

function norm(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function LocationPicker({ location, shops }: Props) {
  const { place, status, askBrowser, setPlace } = location;

  const countries = [...new Set(shops.map((s) => s.country_code.toUpperCase()))].sort((a, b) =>
    countryName(a).localeCompare(countryName(b)),
  );

  const inCountry = place
    ? shops.filter((s) => s.country_code.toUpperCase() === place.country.toUpperCase())
    : [];
  const regions = [
    ...new Set(inCountry.map((s) => s.region).filter((r): r is string => Boolean(r))),
  ].sort();
  const cities = [
    ...new Set(
      inCountry
        .filter((s) => !place?.region || norm(s.region) === norm(place.region))
        .map((s) => s.city)
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort();

  // A located suburb we have no shops in would hide everything, so drop it.
  const cityKnown = place?.city ? cities.some((c) => norm(c) === norm(place.city)) : true;
  useEffect(() => {
    if (place?.city && cities.length > 0 && !cityKnown) {
      setPlace({ country: place.country, region: place.region, city: null });
    }
  }, [place?.city, place?.country, place?.region, cities.length, cityKnown, setPlace, place]);

  return (
    <div className="border-4 border-ink bg-paper p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-semibold text-foreground">Where are you?</span>
        <button
          type="button"
          onClick={askBrowser}
          className="inline-flex min-h-11 items-center gap-1.5 border-2 border-ink px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <Crosshair className="h-3.5 w-3.5" aria-hidden />
          {status === "asking" ? "Checking…" : "Use my location"}
        </button>
        {status === "denied" && (
          <span className="text-xs text-muted-foreground">
            No problem, pick your country, state and suburb below.
          </span>
        )}
        {status === "failed" && (
          <span className="text-xs text-muted-foreground">
            That did not work. Pick your country, state and suburb below.
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 block font-mono uppercase tracking-wide">Country</span>
          <select
            value={place?.country.toUpperCase() ?? ""}
            onChange={(e) =>
              setPlace(
                e.target.value ? { country: e.target.value, region: null, city: null } : null,
              )
            }
            className="min-h-11 border-2 border-ink bg-paper px-2 text-sm text-foreground"
          >
            <option value="">Choose a country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
          </select>
        </label>
        {place && regions.length > 0 && (
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block font-mono uppercase tracking-wide">State or region</span>
            <select
              value={place.region ?? ""}
              onChange={(e) =>
                setPlace({
                  country: place.country,
                  region: e.target.value || null,
                  city: null,
                })
              }
              className="min-h-11 border-2 border-ink bg-paper px-2 text-sm text-foreground"
            >
              <option value="">Anywhere in {countryName(place.country)}</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        )}
        {place && cities.length > 0 && (
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block font-mono uppercase tracking-wide">Suburb or city</span>
            <select
              value={cityKnown ? (place.city ?? "") : ""}
              onChange={(e) =>
                setPlace({
                  country: place.country,
                  region: place.region,
                  city: e.target.value || null,
                })
              }
              className="min-h-11 border-2 border-ink bg-paper px-2 text-sm text-foreground"
            >
              <option value="">
                {place.region ? `Anywhere in ${place.region}` : "Anywhere in the country"}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
