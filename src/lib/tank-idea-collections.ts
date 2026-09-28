import { TANK_IDEAS, type TankIdea } from "./tank-ideas";
import { grossLitres } from "./tank-links";
import { ogImage } from "./site";

/**
 * Ways into the tank ideas: by tank size, by fish and by setup type. Each
 * collection is a real page (/tank-ideas/size/..., /fish/..., /type/...), and
 * only collections with at least one idea exist.
 */

export type CollectionKind = "size" | "fish" | "type";

export interface IdeaCollection {
  kind: CollectionKind;
  slug: string;
  /** Page title and H1. */
  title: string;
  description: string;
  ideas: TankIdea[];
}

/** Same rule as public.species_slugify in the slug migration, so both agree. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SIZE_BANDS: Array<{ slug: string; title: string; min: number; max: number; about: string }> =
  [
    {
      slug: "under-60-litres",
      title: "Tank ideas under 60 litres",
      min: 0,
      max: 60,
      about: "small tanks for one species or a single small shoal",
    },
    {
      slug: "60-to-100-litres",
      title: "60 to 100 litre tank ideas",
      min: 60,
      max: 100,
      about: "mid-sized tanks with room for a proper shoal",
    },
    {
      slug: "120-litres",
      title: "120 litre tank ideas",
      min: 100,
      max: 150,
      about: "tanks of roughly 100 to 150 litres, big enough for a small community",
    },
  ];

function sizeCollections(): IdeaCollection[] {
  return SIZE_BANDS.map((band) => ({
    kind: "size" as const,
    slug: band.slug,
    title: band.title,
    description: `Freshwater stocking plans for ${band.about}, with exact fish, layouts and care notes you can open in the calculator.`,
    ideas: TANK_IDEAS.filter((i) => grossLitres(i) >= band.min && grossLitres(i) < band.max),
  }));
}

function fishCollections(): IdeaCollection[] {
  const names = new Map<string, string>();
  for (const idea of TANK_IDEAS)
    for (const row of idea.stock) names.set(slugify(row.name), row.name);
  return [...names].map(([slug, name]) => ({
    kind: "fish" as const,
    slug,
    title: `${name} tank ideas`,
    description: `Tank setups that include ${name.toLowerCase()}: tank size, water, tank mates, layout and care notes, ready to open in the calculator.`,
    ideas: TANK_IDEAS.filter((i) => i.stock.some((row) => slugify(row.name) === slug)),
  }));
}

function typeCollections(): IdeaCollection[] {
  const styles = [...new Set(TANK_IDEAS.map((i) => i.style))];
  return styles.map((style) => ({
    kind: "type" as const,
    slug: slugify(style),
    title: `${style} tank ideas`,
    description: `${style} freshwater aquarium setups with exact stocking, layout and care notes.`,
    ideas: TANK_IDEAS.filter((i) => i.style === style),
  }));
}

export const IDEA_COLLECTIONS: IdeaCollection[] = [
  ...sizeCollections(),
  ...fishCollections(),
  ...typeCollections(),
].filter((c) => c.ideas.length > 0);

export function findCollection(kind: CollectionKind, slug: string): IdeaCollection | undefined {
  return IDEA_COLLECTIONS.find((c) => c.kind === kind && c.slug === slug);
}

export const COLLECTION_KIND_LABEL: Record<CollectionKind, string> = {
  size: "By tank size",
  fish: "By fish",
  type: "By setup",
};

export function collectionPath(c: Pick<IdeaCollection, "kind" | "slug">): string {
  return `/tank-ideas/${c.kind}/${c.slug}`;
}

// ---------- "Fish for a __ litre tank" ----------

export interface TankSizePage {
  slug: string;
  litres: number;
  /** A common tank of this volume, in cm. The length decides swimming room. */
  dimensions: [number, number, number];
}

export const TANK_SIZE_PAGES: TankSizePage[] = [
  { slug: "20-litre-tank", litres: 20, dimensions: [40, 25, 20] },
  { slug: "40-litre-tank", litres: 40, dimensions: [45, 30, 30] },
  { slug: "60-litre-tank", litres: 60, dimensions: [60, 30, 34] },
  { slug: "90-litre-tank", litres: 90, dimensions: [75, 30, 40] },
  { slug: "120-litre-tank", litres: 120, dimensions: [100, 30, 40] },
  { slug: "200-litre-tank", litres: 200, dimensions: [100, 40, 50] },
];

export function findTankSizePage(slug: string): TankSizePage | undefined {
  return TANK_SIZE_PAGES.find((p) => p.slug === slug);
}

/** Tank ideas within about a third of this volume. */
export function ideasNearSize(litres: number): TankIdea[] {
  return TANK_IDEAS.filter((i) => Math.abs(grossLitres(i) - litres) <= litres / 3);
}

/** Page head for a collection page. */
export function collectionHead(collection: IdeaCollection, url: string) {
  return {
    meta: [
      { title: `${collection.title} | FishTankr` },
      { name: "description", content: collection.description },
      { property: "og:title", content: collection.title },
      { property: "og:description", content: collection.description },
      { property: "og:url", content: url },
      ...ogImage(`/og/ideas/${collection.ideas[0].slug}.png`),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
