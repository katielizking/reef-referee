import { createFileRoute, Link } from "@tanstack/react-router";
import { TANK_IDEAS } from "@/lib/tank-ideas";
import { BrowseIdeas, IdeaCards } from "@/components/IdeaCollectionPage";
import { IDEA_COLLECTIONS, collectionPath } from "@/lib/tank-idea-collections";
import { absoluteUrl, ogImage } from "@/lib/site";
export const Route = createFileRoute("/tank-ideas/")({
  head: () => ({
    meta: [
      { title: "Freshwater tank ideas & stocking templates | FishTankr" },
      {
        name: "description",
        content:
          "Freshwater aquarium layouts with exact stocking lists and care notes, by tank size, fish and setup. Open any idea straight in the FishTankr calculator.",
      },
      ...ogImage("/og/tank-ideas.png"),
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/tank-ideas") }],
  }),
  component: Ideas,
});
function Ideas() {
  const sizes = IDEA_COLLECTIONS.filter((c) => c.kind === "size");
  const types = IDEA_COLLECTIONS.filter((c) => c.kind === "type");
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm uppercase tracking-[.2em] text-primary">A little inspiration</p>
      <h1 className="mt-3 font-display text-4xl md:text-6xl">Find your next tank.</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Start with a look you love. Explore the fish, the layout and the care behind it, then open
        it in the calculator and make it yours.
      </p>
      <nav aria-label="Quick routes into tank ideas" className="my-8 space-y-3 text-sm">
        {[
          ["Tank size", sizes],
          ["Setup", types],
        ].map(([label, list]) => (
          <div key={label as string} className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-muted-foreground">{label as string}</span>
            {(list as typeof sizes).map((c) => (
              <a
                key={c.slug}
                href={collectionPath(c)}
                className="rounded-full border px-3 py-1.5 text-foreground hover:bg-muted"
              >
                {c.title.replace(/ tank ideas$/i, "").replace(/^Tank ideas /, "")}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <IdeaCards ideas={TANK_IDEAS} />
      <p className="mt-10 text-sm text-muted-foreground">
        Volumes are gross dimensions; substrate and decor reduce actual water volume. These are
        starting plans, not ready-to-stock approvals. Check your water, filtration and cycle before
        buying livestock.
      </p>
      <p className="mt-4">
        <Link to="/community" className="text-primary underline">
          Have your own idea? Share it with the community.
        </Link>
      </p>
      <BrowseIdeas />
    </main>
  );
}
