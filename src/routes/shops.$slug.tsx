import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, MapPin, Phone } from "lucide-react";

type Shop = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  phone: string | null;
  specialties: string[];
  description: string | null;
};

async function fetchShop(slug: string): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("aquarium_shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Shop | null) ?? null;
}

export const Route = createFileRoute("/shops/$slug")({
  loader: async ({ params }) => {
    const shop = await fetchShop(params.slug);
    if (!shop) throw notFound();
    return { shop };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Shop not found | FishTankr" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const s = loaderData.shop;
    const loc = [s.suburb, s.state].filter(Boolean).join(", ");
    const title = `${s.name}${loc ? ` — ${loc}` : ""} | FishTankr`;
    const desc = s.description ?? `Aquarium shop in ${loc || "Australia"}.`;
    const url = `/shops/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: s.name },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: s.name,
            description: s.description ?? undefined,
            url: s.website ?? undefined,
            telephone: s.phone ?? undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: s.address ?? undefined,
              addressLocality: s.suburb ?? undefined,
              addressRegion: s.state ?? undefined,
              postalCode: s.postcode ?? undefined,
              addressCountry: "AU",
            },
            geo:
              s.lat && s.lng
                ? { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng }
                : undefined,
          }),
        },
      ],
    };
  },
  component: ShopPage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Shop not found</h1>
      <p className="mt-2 text-muted-foreground">
        <Link to="/shops" className="text-primary underline">Back to all shops</Link>
      </p>
    </main>
  ),
});

function ShopPage() {
  const { shop } = Route.useLoaderData();
  const loc = [shop.suburb, shop.state, shop.postcode].filter(Boolean).join(" ");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/shops" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← All shops
      </Link>
      <h1 className="font-display text-4xl font-bold text-foreground">{shop.name}</h1>
      {loc && <p className="mt-1 text-muted-foreground">{loc}</p>}

      {shop.description && (
        <p className="mt-6 text-base text-foreground">{shop.description}</p>
      )}

      {shop.specialties.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Known for
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shop.specialties.map((s) => (
              <span
                key={s}
                className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-3 rounded-2xl border bg-card p-5 text-sm">
        {shop.website && (
          <a
            href={shop.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> {shop.website.replace(/^https?:\/\//, "")}
          </a>
        )}
        {shop.phone && (
          <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-2 text-foreground">
            <Phone className="h-4 w-4" /> {shop.phone}
          </a>
        )}
        {shop.lat && shop.lng && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <MapPin className="h-4 w-4" /> Open in Google Maps
          </a>
        )}
      </div>

      {shop.lat && shop.lng && (
        <iframe
          title={`Map of ${shop.name}`}
          className="mt-6 aspect-video w-full rounded-2xl border"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${shop.lat},${shop.lng}&z=14&output=embed`}
        />
      )}
    </main>
  );
}
