import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, MapPin, Phone, Store, Truck } from "lucide-react";
import { recordShopOutbound } from "@/lib/commercial";
import { countryName, deliveryLabel, type ShopDirectoryEntry } from "@/lib/shop-search";

type Shop = ShopDirectoryEntry & {
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  phone: string | null;
};

async function fetchShop(slug: string): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("aquarium_shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Shop | null) ?? null;
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
        meta: [{ title: "Shop not found | FishTankr" }, { name: "robots", content: "noindex" }],
      };
    }
    const s = loaderData.shop;
    const loc = [s.city ?? s.suburb, s.region ?? s.state, countryName(s.country_code)]
      .filter(Boolean)
      .join(", ");
    const title = `${s.name}${loc ? `, ${loc}` : ""} | FishTankr`;
    const desc =
      s.description ??
      (loc ? `Independent aquarium shop in ${loc}.` : "Independent aquarium shop listing.");
    const url = absoluteUrl(`/shops/${params.slug}`);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: s.name },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
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
              addressLocality: s.city ?? s.suburb ?? undefined,
              addressRegion: s.region ?? s.state ?? undefined,
              postalCode: s.postcode ?? undefined,
              addressCountry: s.country_code,
            },
            geo:
              s.lat && s.lng
                ? {
                    "@type": "GeoCoordinates",
                    latitude: s.lat,
                    longitude: s.lng,
                  }
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
        <Link to="/shops" className="text-primary underline">
          Back to all shops
        </Link>
      </p>
    </main>
  ),
});

function ShopPage() {
  const { shop } = Route.useLoaderData();
  const loc = [shop.address, shop.city ?? shop.suburb, shop.region ?? shop.state, shop.postcode]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/shops"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← All shops
      </Link>
      <h1 className="font-display text-4xl font-bold text-foreground">{shop.name}</h1>
      <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {countryName(shop.country_code)}
      </p>
      {loc && <p className="mt-1 text-muted-foreground">{loc}</p>}

      {shop.description && <p className="mt-6 text-base text-foreground">{shop.description}</p>}

      <div className="mt-6 grid gap-3 border-4 border-ink bg-paper p-4 text-sm">
        <p className="flex items-start gap-2 text-foreground">
          <Store className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>Independently owned.</strong>{" "}
            {shop.independent_note ?? "Not part of a chain or franchise group."}
          </span>
        </p>
        <p className="flex items-start gap-2 text-foreground">
          <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>{deliveryLabel(shop)}.</strong>{" "}
            {shop.ships_to_regions.length > 0 && (
              <>States: {shop.ships_to_regions.join(", ")}. </>
            )}
            {shop.shipping_note ? `${shop.shipping_note} ` : ""}
            {shop.delivery_reviewed_on
              ? `Delivery details last checked ${shop.delivery_reviewed_on}.`
              : "We have not confirmed their delivery details yet, so check with the shop."}
          </span>
        </p>
      </div>

      {shop.specialties.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Known for
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shop.specialties.map((s: string) => (
              <span key={s} className="border border-rule px-2.5 py-1 text-xs text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-3 border-4 border-ink bg-paper p-5 text-sm">
        {shop.website && (
          <a
            href={shop.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordShopOutbound(shop.id, "website")}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />{" "}
            {shop.website.replace(/^https?:\/\//, "")}
          </a>
        )}
        {shop.phone && (
          <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-2 text-foreground">
            <Phone className="h-4 w-4" aria-hidden /> {shop.phone}
          </a>
        )}
        {shop.lat && shop.lng && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordShopOutbound(shop.id, "map")}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <MapPin className="h-4 w-4" aria-hidden /> Open in Google Maps
          </a>
        )}
      </div>

      {shop.lat && shop.lng && (
        <iframe
          title={`Map of ${shop.name}`}
          className="mt-6 aspect-video w-full border-4 border-ink"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${shop.lat},${shop.lng}&z=14&output=embed`}
        />
      )}
      <section className="mt-8 border-4 border-ink bg-muted/40 p-4 text-sm text-muted-foreground">
        <p>
          This is a free listing. No shop pays to be here, and a listing is not an endorsement of a
          shop's animal care.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            to="/contact"
            onClick={() => recordShopOutbound(shop.id, "claim")}
            className="font-semibold text-primary underline"
          >
            Correct this listing
          </Link>
        </div>
      </section>
    </main>
  );
}
