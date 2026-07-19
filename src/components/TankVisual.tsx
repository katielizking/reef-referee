import type { TankState } from "@/lib/types";

/**
 * Simple 2D side-view of the tank.
 * Fish placed by swim_zone band; plants at the substrate line; hardscape as blobs.
 */
export function TankVisual({ state }: { state: TankState }) {
  const W = 640;
  const H = 360;
  const padding = 24;

  const glassX = padding;
  const glassY = padding;
  const glassW = W - padding * 2;
  const glassH = H - padding * 2;

  const substrateH = 28;
  const substrateY = glassY + glassH - substrateH;

  // Zones
  const topBand = { y: glassY + 8, h: (glassH - substrateH) / 3 };
  const midBand = { y: glassY + 8 + (glassH - substrateH) / 3, h: (glassH - substrateH) / 3 };
  const botBand = {
    y: glassY + 8 + 2 * ((glassH - substrateH) / 3),
    h: (glassH - substrateH) / 3,
  };

  // Distribute fish into their zone
  function place(zone: "top" | "mid" | "bottom") {
    const items: Array<{ name: string; size: number; qty: number }> = [];
    for (const { species: sp, quantity } of state.species) {
      if (sp.swim_zone !== zone) continue;
      items.push({ name: sp.common_name, size: sp.adult_size_cm, qty: quantity });
    }
    return items;
  }

  function renderFish(
    items: Array<{ name: string; size: number; qty: number }>,
    band: { y: number; h: number },
  ) {
    const nodes: React.ReactElement[] = [];
    let ix = 0;
    const totalCount = items.reduce((s, i) => s + Math.min(i.qty, 6), 0);
    const slots = Math.max(1, totalCount);
    const slotW = (glassW - 40) / slots;
    for (const item of items) {
      const displayQty = Math.min(item.qty, 6);
      // shape size roughly proportional to adult size
      const w = Math.max(14, Math.min(56, item.size * 3));
      const h = Math.max(8, w * 0.42);
      for (let k = 0; k < displayQty; k++) {
        const cx = glassX + 20 + ix * slotW + slotW / 2;
        const cy = band.y + band.h / 2 + ((k % 2 === 0 ? -1 : 1) * (h / 3)) * (displayQty > 3 ? 1 : 0);
        nodes.push(
          <g key={`${item.name}-${ix}-${k}`}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={w / 2}
              ry={h / 2}
              className="fill-primary/70"
              stroke="var(--color-deep)"
              strokeWidth="1"
            />
            {/* Tail */}
            <polygon
              points={`${cx - w / 2},${cy} ${cx - w / 2 - 6},${cy - h / 2} ${cx - w / 2 - 6},${cy + h / 2}`}
              className="fill-primary/70"
            />
            {k === 0 && (
              <text
                x={cx}
                y={cy + h / 2 + 12}
                textAnchor="middle"
                fontSize="10"
                className="fill-foreground/70"
              >
                {item.name}
                {item.qty > 1 ? ` ×${item.qty}` : ""}
              </text>
            )}
          </g>,
        );
        ix++;
      }
    }
    return nodes;
  }

  // Plants along the substrate line
  const plantNodes = state.plants.slice(0, 10).map((p, i) => {
    const x = glassX + 24 + i * ((glassW - 48) / Math.max(1, state.plants.length));
    const height = 40 + (p.plant.light_need === "high" ? 30 : p.plant.light_need === "med" ? 15 : 0);
    return (
      <g key={p.plant.id}>
        <path
          d={`M ${x} ${substrateY} q -6 -${height / 2} 0 -${height} q 6 -${height / 2} 0 -${height}`}
          className="stroke-emerald-600"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx={x - 4} cy={substrateY - height} rx="6" ry="8" className="fill-emerald-500/80" />
        <ellipse cx={x + 4} cy={substrateY - height + 6} rx="5" ry="7" className="fill-emerald-600/80" />
      </g>
    );
  });

  // Hardscape blobs above substrate
  const hardscapeNodes = state.hardscape.slice(0, 8).map((h, i) => {
    const total = Math.max(1, state.hardscape.length);
    const x = glassX + 40 + i * ((glassW - 80) / total);
    const w = 60 + (h.hardscape.type === "wood" ? 20 : 0);
    const height = h.hardscape.type === "rock" ? 40 : h.hardscape.type === "wood" ? 30 : 12;
    const fill =
      h.hardscape.type === "rock"
        ? "fill-stone-500/80"
        : h.hardscape.type === "wood"
          ? "fill-amber-800/70"
          : h.hardscape.type === "leaf_litter"
            ? "fill-amber-700/60"
            : "fill-yellow-200/70";
    return (
      <ellipse
        key={h.hardscape.id + i}
        cx={x}
        cy={substrateY - height / 2 + 4}
        rx={w / 2}
        ry={height / 2}
        className={fill}
      />
    );
  });

  return (
    <div className="rounded-3xl border bg-card p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.06 210)" />
            <stop offset="100%" stopColor="oklch(0.65 0.09 220)" />
          </linearGradient>
        </defs>
        {/* Water */}
        <rect
          x={glassX}
          y={glassY}
          width={glassW}
          height={glassH - substrateH}
          rx="12"
          fill="url(#water)"
        />
        {/* Substrate */}
        <rect
          x={glassX}
          y={substrateY}
          width={glassW}
          height={substrateH}
          rx="6"
          className="fill-[var(--color-sand)]"
        />
        {/* Glass outline */}
        <rect
          x={glassX}
          y={glassY}
          width={glassW}
          height={glassH}
          rx="12"
          fill="none"
          stroke="var(--color-deep)"
          strokeWidth="2"
        />
        {/* Zone dividers (faint) */}
        <line
          x1={glassX}
          x2={glassX + glassW}
          y1={topBand.y + topBand.h}
          y2={topBand.y + topBand.h}
          strokeDasharray="4 6"
          stroke="oklch(0.5 0.03 230 / 0.35)"
        />
        <line
          x1={glassX}
          x2={glassX + glassW}
          y1={midBand.y + midBand.h}
          y2={midBand.y + midBand.h}
          strokeDasharray="4 6"
          stroke="oklch(0.5 0.03 230 / 0.35)"
        />
        {/* Zone labels */}
        <text x={glassX + 8} y={topBand.y + 14} fontSize="10" className="fill-foreground/50">
          Top
        </text>
        <text x={glassX + 8} y={midBand.y + 14} fontSize="10" className="fill-foreground/50">
          Mid
        </text>
        <text x={glassX + 8} y={botBand.y + 14} fontSize="10" className="fill-foreground/50">
          Bottom
        </text>

        {hardscapeNodes}
        {plantNodes}
        {renderFish(place("top"), topBand)}
        {renderFish(place("mid"), midBand)}
        {renderFish(place("bottom"), botBand)}
      </svg>
    </div>
  );
}
