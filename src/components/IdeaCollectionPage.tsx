import { Link } from "@tanstack/react-router";
import { TankIdeaArt } from "@/components/TankIdeaArt";
import type { TankIdea } from "@/lib/tank-ideas";
import { grossLitres } from "@/lib/tank-links";
import {
  COLLECTION_KIND_LABEL,
  IDEA_COLLECTIONS,
  TANK_SIZE_PAGES,
  collectionPath,
  type CollectionKind,
  type IdeaCollection,
} from "@/lib/tank-idea-collections";

/** A grid of tank ideas, each with a crawlable link straight into the calculator. */
export function IdeaCards({ ideas }: { ideas: TankIdea[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {ideas.map((i) => (
        <article key={i.slug} className="overflow-hidden rounded-2xl border bg-card">
          <Link to="/tank-ideas/$slug" params={{ slug: i.slug }} className="block">
            <TankIdeaArt idea={i} />
          </Link>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {grossLitres(i)} L · {i.dimensions.join(" × ")} cm · {i.style}
            </p>
            <h2 className="mt-2 font-display text-2xl">
              <Link to="/tank-ideas/$slug" params={{ slug: i.slug }} className="hover:underline">
                {i.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{i.summary}</p>
            <p className="mt-3 text-sm text-foreground">
              {i.stock.map((s) => `${s.quantity} ${s.name.toLowerCase()}`).join(", ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link to="/tank-ideas/$slug" params={{ slug: i.slug }} className="text-primary">
                Explore this tank →
              </Link>
              <Link
                to="/calculator"
                search={{ idea: i.slug }}
                className="font-semibold text-primary underline"
              >
                Open in the calculator
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/** Crawlable routes into the ideas: every size, fish and setup collection. */
export function BrowseIdeas({ current }: { current?: IdeaCollection }) {
  const kinds: CollectionKind[] = ["size", "fish", "type"];
  return (
    <nav aria-label="Browse tank ideas" className="mt-12 grid gap-6 border-t pt-8 md:grid-cols-4">
      {kinds.map((kind) => (
        <div key={kind}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {COLLECTION_KIND_LABEL[kind]}
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {IDEA_COLLECTIONS.filter((c) => c.kind === kind).map((c) => (
              <li key={c.slug}>
                {current?.kind === c.kind && current.slug === c.slug ? (
                  <span className="font-semibold text-foreground">{c.title}</span>
                ) : (
                  <a href={collectionPath(c)} className="text-primary hover:underline">
                    {c.title}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fish for your tank size
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          {TANK_SIZE_PAGES.map((p) => (
            <li key={p.slug}>
              <Link
                to="/fish-for/$size"
                params={{ size: p.slug }}
                className="text-primary hover:underline"
              >
                Fish for a {p.litres} litre tank
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function IdeaCollectionPage({ collection }: { collection: IdeaCollection }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <Link to="/tank-ideas" className="text-sm text-primary">
        ← All tank ideas
      </Link>
      <p className="mt-6 text-sm uppercase tracking-[.2em] text-primary">
        {COLLECTION_KIND_LABEL[collection.kind]}
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{collection.title}</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{collection.description}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        {collection.ideas.length} {collection.ideas.length === 1 ? "plan" : "plans"}. Every plan is
        checked by the same scoring as the calculator. Volumes are gross; substrate and décor reduce
        the water.
      </p>
      <div className="mt-8">
        <IdeaCards ideas={collection.ideas} />
      </div>
      <BrowseIdeas current={collection} />
    </main>
  );
}
