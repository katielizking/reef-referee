interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/**
 * FishTankr wordmark + mark. The mark is a rounded tank silhouette with a
 * waterline and a bubble — works as favicon, nav icon, or full wordmark.
 */
export function BrandLogo({
  size = 32,
  showWordmark = true,
  className,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="3" y="3" width="26" height="26" rx="7" fill="var(--blue)" />
        {/* waterline */}
        <path
          d="M6 15 Q10 13 14 15 T22 15 T28 15"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* bubble */}
        <circle cx="22" cy="9" r="1.5" fill="white" />
        {/* small fish body */}
        <path d="M11 22 Q14 19 18 22 Q14 25 11 22 Z" fill="white" />
        <path d="M18 22 L21 20 L21 24 Z" fill="white" />
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          FishTankr
        </span>
      )}
    </span>
  );
}

/** Larger, softer hero illustration: a lightly-marked aquarium diagram. */
export function HeroTankIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 280"
      className={className}
      role="img"
      aria-label="Illustration of a healthy aquarium"
    >
      {/* Tank body */}
      <rect
        x="20"
        y="30"
        width="360"
        height="220"
        rx="22"
        fill="white"
        stroke="var(--blue)"
        strokeWidth="3"
      />
      {/* Water fill */}
      <rect
        x="20"
        y="70"
        width="360"
        height="180"
        rx="22"
        fill="var(--blue)"
        opacity="0.10"
      />
      {/* Waterline */}
      <path
        d="M20 74 Q60 68 100 74 T180 74 T260 74 T340 74 T380 74"
        fill="none"
        stroke="var(--blue)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Measurement ticks on left */}
      {[100, 140, 180, 220].map((y) => (
        <g key={y}>
          <line
            x1="20"
            y1={y}
            x2="30"
            y2={y}
            stroke="var(--ink)"
            strokeWidth="1"
            opacity="0.35"
          />
        </g>
      ))}
      {/* Substrate */}
      <path
        d="M20 230 Q80 218 140 226 T260 224 T380 228 L380 250 L20 250 Z"
        fill="var(--ink)"
        opacity="0.10"
      />
      {/* Plants */}
      <g stroke="var(--lime)" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M60 228 Q56 200 62 178" />
        <path d="M72 228 Q76 208 68 188" />
        <path d="M320 228 Q316 205 322 185" />
        <path d="M334 228 Q338 210 330 192" />
      </g>
      {/* Fish 1 */}
      <g transform="translate(160 130)">
        <path d="M0 0 Q22 -14 44 0 Q22 14 0 0 Z" fill="var(--blue)" />
        <path d="M44 0 L58 -10 L58 10 Z" fill="var(--blue)" />
        <circle cx="12" cy="-3" r="2" fill="white" />
      </g>
      {/* Fish 2 (smaller, coral accent) */}
      <g transform="translate(230 180)">
        <path d="M0 0 Q14 -8 28 0 Q14 8 0 0 Z" fill="var(--coral)" />
        <path d="M28 0 L38 -6 L38 6 Z" fill="var(--coral)" />
      </g>
      {/* Bubbles */}
      <g fill="var(--blue)" opacity="0.55">
        <circle cx="280" cy="110" r="4" />
        <circle cx="290" cy="90" r="3" />
        <circle cx="284" cy="70" r="2" />
      </g>
    </svg>
  );
}
