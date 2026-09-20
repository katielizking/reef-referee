import { useMemo, useRef, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";

import { useOutsideClick } from "@/hooks/useOutsideClick";
import { checkInvertebrates, invertebrateBioload } from "@/lib/invert-check";
import type { Invertebrate, TankState } from "@/lib/types";

const GROUP_LABEL: Record<Invertebrate["invert_group"], string> = {
  shrimp: "Shrimp",
  snail: "Snail",
  crayfish: "Crayfish",
  crab: "Crab",
};

/** Search, add and adjust shrimp, snails, crayfish and crabs. */
export function InvertebrateAdder({
  state,
  setState,
  invertebrates,
}: {
  state: TankState;
  setState: React.Dispatch<React.SetStateAction<TankState>>;
  invertebrates: Invertebrate[];
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useOutsideClick(boxRef, () => setOpen(false), open);

  const rows = state.invertebrates ?? [];

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pool = term
      ? invertebrates.filter(
          (i) =>
            i.common_name.toLowerCase().includes(term) ||
            i.scientific_name.toLowerCase().includes(term) ||
            i.invert_group.includes(term),
        )
      : invertebrates;
    return pool.slice(0, 12);
  }, [q, invertebrates]);

  function add(inv: Invertebrate) {
    setState((s) => {
      const current = s.invertebrates ?? [];
      const existing = current.find((r) => r.invertebrate.id === inv.id);
      return {
        ...s,
        invertebrates: existing
          ? current.map((r) =>
              r.invertebrate.id === inv.id ? { ...r, quantity: r.quantity + 1 } : r,
            )
          : [...current, { invertebrate: inv, quantity: Math.max(1, inv.min_group_size) }],
      };
    });
    setQ("");
    setOpen(false);
  }

  function setQuantity(id: string, next: number) {
    setState((s) => {
      const current = s.invertebrates ?? [];
      return {
        ...s,
        invertebrates:
          next <= 0
            ? current.filter((r) => r.invertebrate.id !== id)
            : current.map((r) => (r.invertebrate.id === id ? { ...r, quantity: next } : r)),
      };
    });
  }

  return (
    <section className="space-y-3">
      <div className="relative" ref={boxRef}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          className="min-h-11 w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search shrimp, snails, crayfish…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Search invertebrates"
        />
        {open && (
          <div className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border bg-popover shadow-lg">
            {results.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">Nothing matches that yet.</p>
            )}
            {results.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => add(inv)}
                aria-label={`Add ${inv.common_name} to tank`}
                className="flex w-full items-start justify-between gap-2 border-b p-3 text-left last:border-b-0 hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {inv.common_name}
                  </span>
                  <span className="sci-name block text-xs text-muted-foreground">
                    {inv.scientific_name}
                  </span>
                </span>
                <span className="science-label shrink-0 text-xs text-muted-foreground">
                  {GROUP_LABEL[inv.invert_group]} · {inv.adult_size_cm} cm
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map(({ invertebrate: inv, quantity }) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-2 border-t border-rule pt-2 first:border-t-0 first:pt-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {inv.common_name}
                </span>
                <span className="sci-name block truncate text-xs text-muted-foreground">
                  {inv.scientific_name}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`One fewer ${inv.common_name}`}
                  onClick={() => setQuantity(inv.id, quantity - 1)}
                  className="grid size-8 place-items-center rounded-lg border bg-card hover:bg-muted"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
                <button
                  type="button"
                  aria-label={`One more ${inv.common_name}`}
                  onClick={() => setQuantity(inv.id, quantity + 1)}
                  className="grid size-8 place-items-center rounded-lg border bg-card hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${inv.common_name}`}
                  onClick={() => setQuantity(inv.id, 0)}
                  className="grid size-8 place-items-center rounded-lg border bg-card hover:bg-muted"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Invertebrate checks, reported beside the score and never inside it. */
export function InvertebrateChecks({ state }: { state: TankState }) {
  const issues = useMemo(() => checkInvertebrates(state), [state]);
  const rows = state.invertebrates ?? [];
  if (rows.length === 0) return null;

  const load = invertebrateBioload(state);
  const count = rows.reduce((n, r) => n + r.quantity, 0);

  return (
    <div className="fishtankr-panel mt-4 p-5">
      <p className="science-label text-muted-foreground">
        Invertebrates · checked separately from the score
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {count} in {rows.length} {rows.length === 1 ? "species" : "species"}. Their waste load is
        small, about {load.toFixed(2)} fish-equivalents, and it is not part of your score yet.
      </p>
      {issues.length === 0 ? (
        <p className="mt-3 text-sm text-foreground">Nothing to fix on this list.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {issues.map((issue, i) => (
            <li
              key={`${issue.code}-${issue.subject}-${i}`}
              className={
                issue.severity === "critical"
                  ? "border-l-2 border-destructive pl-3"
                  : "border-l-2 border-rule pl-3"
              }
            >
              <p className="science-label text-xs text-muted-foreground">
                {issue.severity === "critical"
                  ? "Fix first"
                  : issue.severity === "caution"
                    ? "Worth changing"
                    : "Good to know"}
              </p>
              <p className="text-sm text-foreground">{issue.reason}</p>
              <p className="text-sm text-muted-foreground">{issue.fix}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
