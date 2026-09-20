import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fish, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const [requestedState, setRequestedState] = useState<TankState | null>(null);
  const showingResults = requestedState === state;
  const suggestions = useMemo(
    () => (requestedState ? suggestCompatibleSpecies(requestedState, species) : []),
    [requestedState, species],
  );

  if (state.species.length === 0) return null;

  function add(sp: Species) {
    setRequestedState(null);
    const quantity = Math.max(1, sp.min_group_size);
    setState((s) =>
      s.species.some((row) => row.species.id === sp.id)
        ? s
        : { ...s, species: [...s.species, { species: sp, quantity }] },
    );
  }

  if (!showingResults) {
    return (
      <div className="mt-4 border-t border-rule pt-4">
        <p className="text-sm font-semibold text-foreground">Looking for another fish?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check which fish suit this tank size, water and current tank mates.
        </p>
        <Button className="mt-3" onClick={() => setRequestedState(state)}>
          <Fish aria-hidden />
          Find fish that suit this tank
        </Button>
      </div>
    );
  }

  return (
    <div className="fishtankr-panel mt-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="science-label text-muted-foreground">Fish that would suit this tank</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-2 shrink-0"
          onClick={() => setRequestedState(null)}
          aria-label="Hide compatible fish"
          title="Hide compatible fish"
        >
          <X aria-hidden />
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        These clear your tank size, water and current tank mates. Check the cycle before you buy
        anything.
      </p>
      {suggestions.length === 0 ? (
        <p className="mt-3 text-sm text-foreground">
          No suitable additions found for this plan. Keep the fish already selected rather than
          forcing another species into the tank.
        </p>
      ) : (
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
                <Button
                  type="button"
                  onClick={() => add(sp)}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add
                </Button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
              {groupNote && <p className="text-sm text-muted-foreground">{groupNote}</p>}
              <Link to="/species/$id" params={{ id: sp.id }} className="planner-text-link">
                Read its care notes →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
