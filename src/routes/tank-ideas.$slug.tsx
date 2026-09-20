import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { TANK_IDEAS, buildIdeaTank } from "@/lib/tank-ideas";
import { TankIdeaArt } from "@/components/TankIdeaArt";
import { useTankDraft } from "@/components/TankDraftProvider";
import { useSpecies } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";
export const Route = createFileRoute("/tank-ideas/$slug")({
  loader: ({ params }) => {
    const idea = TANK_IDEAS.find((i) => i.slug === params.slug);
    if (!idea) throw notFound();
    return idea;
  },
  head: ({ loaderData: i }) =>
    i
      ? {
          meta: [
            { title: `${i.title}: stocking & layout | FishTankr` },
            { name: "description", content: i.summary },
            { property: "og:title", content: i.title },
            { property: "og:description", content: i.summary },
          ],
          links: [{ rel: "canonical", href: absoluteUrl(`/tank-ideas/${i.slug}`) }],
        }
      : {},
  component: Idea,
});
function Idea() {
  const idea = Route.useLoaderData();
  const catalogue = useSpecies();
  const draft = useTankDraft();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  async function open() {
    try {
      if (!catalogue.data) throw new Error("The fish catalogue is not ready yet.");
      const state = buildIdeaTank(idea, catalogue.data);
      try {
        sessionStorage.removeItem("fishtankr:pending-add");
        sessionStorage.removeItem("fishtankr:pending-preset");
      } catch {
        /* A fresh template does not require browser storage. */
      }
      draft.setState(state);
      draft.setSavedId(undefined);
      draft.setSource(undefined);
      await navigate({ to: "/calculator" });
      toast.success("Idea loaded — choose your filter and review the plan.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load this idea.");
    }
  }
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <Link to="/tank-ideas" className="text-sm text-primary">
        ← All tank ideas
      </Link>
      <div className="mt-7 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            {idea.style} · {idea.experience}
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{idea.title}</h1>
          <p className="my-5 text-lg text-muted-foreground">{idea.summary}</p>
          <div className="overflow-hidden rounded-2xl">
            <TankIdeaArt idea={idea} />
          </div>
          <h2 className="mt-8 text-2xl font-display">Build the scene</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{idea.layout}</p>
        </div>
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-2xl">The starting plan</h2>
            <p className="mt-3">
              {idea.dimensions.join(" × ")} cm ·{" "}
              {Math.round(idea.dimensions.reduce((a, b) => a * b) / 1000)} L gross
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Target {idea.temperature} °C · pH {idea.ph} · {idea.planting} planting
            </p>
            <ul className="my-5 space-y-3">
              {idea.stock.map((s) => (
                <li key={s.scientific}>
                  <strong>
                    {s.quantity} × {s.name}
                  </strong>
                  <span className="block text-sm italic text-muted-foreground">{s.scientific}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Transfers dimensions, water targets and these exact fish quantities. Choose your
              actual filter, plants and decor in the tools. Cycling and water tests start as
              unknown.
            </p>
            <button
              disabled={!draft.hydrated || !catalogue.data}
              className="mt-5 w-full rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
              onClick={() => setConfirm(true)}
            >
              Make this tank in the calculator
            </button>
            {catalogue.isError && (
              <p role="alert" className="mt-3">
                Catalogue unavailable.{" "}
                <button className="underline" onClick={() => catalogue.refetch()}>
                  Retry
                </button>
              </p>
            )}
            {confirm && (
              <div className="mt-4 rounded-xl border p-4" role="alert">
                <p>
                  This replaces your current calculator draft. Previously saved tanks stay in My
                  tanks.
                </p>
                <div className="mt-3 flex gap-4">
                  <button className="font-semibold text-primary" onClick={open}>
                    Replace draft and open
                  </button>
                  <button onClick={() => setConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </section>
          <section>
            <h2 className="font-display text-2xl">Before you buy</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-muted-foreground">
              {idea.care.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
          {idea.slug === "pea-puffer-jungle" && (
            <p className="text-sm">
              Care references:{" "}
              <a
                className="underline"
                href="https://www.pufferfishenthusiastsworldwide.com/post/c-travancoricus"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pufferfish Enthusiasts Worldwide
              </a>{" "}
              and{" "}
              <a
                className="underline"
                href="https://www.aquariumcoop.com/blogs/aquarium/pea-puffer"
                target="_blank"
                rel="noopener noreferrer"
              >
                Aquarium Co-Op
              </a>
              . Reviewed 20 September 2026.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Stable, suitable water matters more than chasing an exact pH. Check the species library
            for ranges and local restrictions.{" "}
            <Link to="/tracker" className="text-primary underline">
              Use the tracker to record cycle progress.
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
