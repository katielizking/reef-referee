import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TANK_IDEAS } from "@/lib/tank-ideas";
import { TankIdeaArt } from "@/components/TankIdeaArt";
import { absoluteUrl } from "@/lib/site";
export const Route = createFileRoute("/tank-ideas/")({
  head: () => ({
    meta: [
      { title: "Freshwater tank ideas & stocking templates | FishTankr" },
      {
        name: "description",
        content:
          "Explore six freshwater aquarium layouts, exact stocking lists and care notes. Make any idea your own in the FishTankr calculator.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/tank-ideas") }],
  }),
  component: Ideas,
});
function Ideas() {
  const [style, setStyle] = useState("All styles");
  const [size, setSize] = useState("All sizes");
  const ideas = TANK_IDEAS.filter(
    (i) =>
      (style === "All styles" || i.style === style) &&
      (size === "All sizes" ||
        (size === "Under 60 L"
          ? i.dimensions.reduce((a, b) => a * b) / 1000 < 60
          : i.dimensions.reduce((a, b) => a * b) / 1000 >= 60)),
  );
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm uppercase tracking-[.2em] text-primary">A little inspiration</p>
      <h1 className="mt-3 font-display text-4xl md:text-6xl">Find your next tank.</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Start with a look you love. Explore the fish, the layout and the care behind it, then make
        it yours in the calculator.
      </p>
      <div className="my-8 flex flex-wrap gap-3">
        <label className="text-sm">
          Style
          <select
            className="ml-3 rounded-lg border bg-background p-2"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {["All styles", ...new Set(TANK_IDEAS.map((i) => i.style))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Volume
          <select
            className="ml-3 rounded-lg border bg-background p-2"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {["All sizes", "Under 60 L", "60 L and over"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ideas.map((i) => (
          <Link
            key={i.slug}
            to="/tank-ideas/$slug"
            params={{ slug: i.slug }}
            className="overflow-hidden rounded-2xl border bg-card transition hover:border-primary"
          >
            <TankIdeaArt idea={i} />
            <div className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {Math.round(i.dimensions.reduce((a, b) => a * b) / 1000)} L · {i.style}
              </p>
              <h2 className="mt-2 font-display text-2xl">{i.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{i.summary}</p>
              <p className="mt-4 text-sm text-primary">Explore this tank →</p>
            </div>
          </Link>
        ))}
      </div>
      {!ideas.length && (
        <p role="status">No ideas match these filters. Try another style or size.</p>
      )}
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
    </main>
  );
}
