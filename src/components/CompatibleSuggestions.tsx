import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { suggestCompatibleSpecies } from "@/lib/suggestions";
import type { Species, TankState } from "@/lib/types";

/**
 * Fish that clear every compatibility, space and water check for the current plan.
 * The list never says how many more fish the tank can hold; adding one adds the
 * group the species needs, nothing more.
 */
export function CompatibleSuggestions({
  state,
  setState,
  species,
}: {
  state: TankState;
  setState: React.Dispatch<React.SetStateAction<TankState>>;
  species: Species[];
}) {
  const suggestions = useMemo(
    () => suggestCompatibleSpecies(state, species),
    [state, species],
  );

  if (state.species.length === 0 || suggestions.length === 0) return null;

  function add(sp: Species) {
    const quantity = Math.max(1, sp.min_group_size);
    setState((s) =>
      s.species.some((row) => row.species.id === sp.id)
        ? s
        : { ...s, species: [...s.species, { species: sp, quantity }] },
    );
  }

  return (
    <div className="fishtankr-panel mt-4 p-5">
      <p className="science-label text-muted-foreground">Fish that would suit this tank</p>
      <p className="mt-2 text-sm text-muted-foreground">
        These clear your tank size, water and current tank mates. Check the cycle before you buy
        anything.
      </p>
      <ul className="mt-3 space-y-3">
        {suggestions.map(({ species: sp, reason, groupNote }) => (
          <li key={sp.id} className="border-t border-rule pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                {sp.common_name}{" "}
                <span className="sci-name font-normal text-muted-foreground">
                  {sp.scientific_name}
                </span>
              </p>
              <button
                type="button"
                onClick={() => add(sp)}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
            {groupNote && <p className="text-sm text-muted-foreground">{groupNote}</p>}
            <Link to="/species/$id" params={{ id: sp.id }} className="planner-text-link">
              Read its care notes →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
