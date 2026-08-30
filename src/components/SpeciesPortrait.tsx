import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Fish } from "lucide-react";

const ALLOWED_LICENSES = new Set(["cc0", "cc-by", "cc-by-sa"]);

interface ObservationPhoto {
  url?: string;
  medium_url?: string;
  attribution?: string;
  license_code?: string;
}

interface Observation {
  id: number;
  uri?: string;
  photos?: ObservationPhoto[];
  taxon?: { name?: string };
}

interface InaturalistResponse {
  results?: Observation[];
}

interface SpeciesPortraitProps {
  commonName: string;
  scientificName: string;
  className?: string;
  compact?: boolean;
  eager?: boolean;
}

async function fetchSpeciesPhoto(scientificName: string) {
  const params = new URLSearchParams({
    taxon_name: scientificName,
    photos: "true",
    photo_license: "cc0,cc-by,cc-by-sa",
    quality_grade: "research",
    captive: "false",
    per_page: "8",
    order_by: "votes",
    order: "desc",
  });
  const response = await fetch(`https://api.inaturalist.org/v1/observations?${params}`);
  if (!response.ok) throw new Error("Species image unavailable");
  const body = (await response.json()) as InaturalistResponse;

  for (const observation of body.results ?? []) {
    const photo = observation.photos?.find((candidate) =>
      ALLOWED_LICENSES.has(candidate.license_code?.toLowerCase() ?? ""),
    );
    if (!photo) continue;
    const source = photo.medium_url ?? photo.url?.replace("/square.", "/medium.");
    if (!source) continue;
    return {
      src: source,
      attribution: photo.attribution ?? "iNaturalist contributor",
      license: (photo.license_code ?? "").toUpperCase(),
      sourceUrl: observation.uri ?? `https://www.inaturalist.org/observations/${observation.id}`,
    };
  }

  return null;
}

export function SpeciesPortrait({
  commonName,
  scientificName,
  className = "",
  compact = false,
  eager = false,
}: SpeciesPortraitProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["species-photo", scientificName],
    queryFn: () => fetchSpeciesPhoto(scientificName),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return (
    <figure
      className={`group/portrait relative overflow-hidden bg-[linear-gradient(145deg,#dff5f3,#f7fbf7_60%,#dcece7)] ${className}`}
    >
      {data ? (
        <img
          src={data.src}
          alt={`${commonName} (${scientificName})`}
          loading={eager ? "eager" : "lazy"}
          className="h-full w-full object-cover transition duration-500 group-hover/portrait:scale-[1.035]"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full min-h-40 items-center justify-center text-primary/55">
          <div className={`relative ${isLoading ? "animate-pulse" : ""}`}>
            <Fish className={compact ? "h-14 w-14" : "h-24 w-24"} strokeWidth={1.15} />
            <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full border border-current" />
            <span className="absolute -right-5 top-1 h-1 w-1 rounded-full border border-current" />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-white/10 opacity-70" />
      <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/75 px-2 py-1 text-[9px] font-bold uppercase tracking-[.13em] text-ink shadow-sm backdrop-blur">
        Species verified
      </div>

      {data && (
        <figcaption
          className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-[10px] leading-tight text-white transition-opacity ${compact ? "opacity-0 group-hover/portrait:opacity-100 group-focus-within/portrait:opacity-100" : ""}`}
        >
          <span className="line-clamp-2">
            {data.attribution} · {data.license}
          </span>
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${commonName} photo source on iNaturalist`}
            className="pointer-events-auto shrink-0 rounded-full bg-white/15 p-1.5 backdrop-blur transition hover:bg-white/30"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </figcaption>
      )}
    </figure>
  );
}
