import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { speciesListQuery } from "@/lib/data";
import { absoluteUrl, ogImage } from "@/lib/site";
import { requiredSwimLengthCm } from "@/lib/scoring";
import {
  GROUP_BAND_LABEL,
  NO_FILTERS,
  groupBand,
  matchesFilters,
  type GroupBand,
} from "@/lib/species-fit";
import { speciesParam } from "@/lib/species-url";
import { sizeParam } from "@/lib/tank-links";
import { TANK_SIZE_PAGES, findTankSizePage, ideasNearSize } from "@/lib/tank-idea-collections";
import { BrowseIdeas, IdeaCards } from "@/components/IdeaCollectionPage";
import type { Species } from "@/lib/types";

export const Route = createFileRoute("/fish-for/$size")({
  loader: async ({ context, params }) => {
    const page = findTankSizePage(params.size);
    if (!page) throw notFound();
    await context.queryClient.ensureQueryData(speciesListQuery);
    return page;
  },
  head: ({ loaderData: page }) => {
    if (!page) return {};
    const title = `Fish for a ${page.litres} litre tank`;
    const description = `Freshwater fish that suit a ${page.litres} litre (${page.dimensions.join(" × ")} cm) tank by volume and swimming length, grouped by how they are kept, plus ready-made plans to open in the calculator.`;
    const url = absoluteUrl(`/fish-for/${page.slug}`);
    return {
      meta: [
        { title: `${title} | FishTankr` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        ...ogImage("/og/species.png"),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: FishForSize,
});

const GROUP_ORDER: GroupBand[] = ["shoal", "small", "single"];
const GROUP_HEADING: Record<GroupBand, string> = {
  shoal: "Shoaling fish (keep 6 or more)",
  small: "Small groups (2–5)",
  single: "Fish that can be kept singly",
};

function FishForSize() {
  const page = Route.useLoaderData();
  const { data: catalogue } = useSuspenseQuery(speciesListQuery);
  const [length] = page.dimensions;
  const fits = catalogue.filter((s) =>
    matchesFilters(s, { ...NO_FILTERS, litres: page.litres, lengthCm: length }),
  );
  const ideas = ideasNearSize(page.litres);
  const others = TANK_SIZE_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-sm uppercase tracking-[.2em] text-primary">Plan by tank size</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">
        Fish for a {page.litres} litre tank
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        {fits.length} fish in our catalogue fit a {page.litres} L tank by volume and by swimming
        length, based on a common {page.dimensions.join(" × ")} cm tank. That is a starting list,
        not a mix: whether fish live well together, and at your water&apos;s pH and temperature, is
        a separate check.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/calculator"
          search={{ size: sizeParam(page.dimensions) }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Plan a {page.litres} L tank in the calculator
        </Link>
        <Link
          to="/species"
          className="rounded-xl border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Filter the fish library
        </Link>
      </div>

      {ideas.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Ready-made plans around {page.litres} L</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Checked stocking lists you can open straight in the calculator.
          </p>
          <div className="mt-5">
            <IdeaCards ideas={ideas} />
          </div>
        </section>
      )}

      {GROUP_ORDER.map((band) => {
        const list = fits.filter((s) => groupBand(s) === band);
        if (list.length === 0) return null;
        return (
          <section key={band} className="mt-12">
            <h2 className="font-display text-2xl">{GROUP_HEADING[band]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{GROUP_BAND_LABEL[band]}.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {list.map((s) => (
                <FishRow key={s.id} s={s} />
              ))}
            </ul>
          </section>
        );
      })}

      <nav aria-label="Other tank sizes" className="mt-12 border-t pt-6 text-sm">
        <span className="text-muted-foreground">Other sizes: </span>
        {others.map((p, i) => (
          <span key={p.slug}>
            {i > 0 && " · "}
            <Link to="/fish-for/$size" params={{ size: p.slug }} className="text-primary underline">
              {p.litres} L
            </Link>
          </span>
        ))}
      </nav>
      <BrowseIdeas />
    </main>
  );
}

function FishRow({ s }: { s: Species }) {
  return (
    <li className="rounded-xl border bg-card px-4 py-3 text-sm">
      <Link
        to="/species/$id"
        params={{ id: speciesParam(s) }}
        className="font-semibold text-foreground hover:underline"
      >
        {s.common_name}
      </Link>{" "}
      <span className="italic text-muted-foreground">{s.scientific_name}</span>
      <p className="mt-1 text-xs text-muted-foreground">
        {s.min_tank_litres} L+ · {Math.round(requiredSwimLengthCm(s))} cm+ swim ·{" "}
        {s.native_temp_min_c}–{s.native_temp_max_c} °C · pH {s.native_ph_min}–{s.native_ph_max} ·{" "}
        {s.temperament.replace("-", " ")}
      </p>
    </li>
  );
}
