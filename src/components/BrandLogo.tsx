import { useId } from "react";

interface BrandLogoProps {
  /** Rendered height in pixels. */
  size?: number;
  className?: string;
}

/**
 * FishTankr wordmark: the lower half of the letters sits below a waterline and takes
 * the glow blue, as if the name is half submerged.
 */
export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  const clipId = `ft-water-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 132 36"
      width={Math.round(size * (132 / 36))}
      height={size}
      role="img"
      aria-label="FishTankr"
      className={`block shrink-0 ${className ?? ""}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M0 17.5 C32 15.5 52 19.5 82 17.5 S132 15.5 158 17.5 S180 19 190 17.5 V36 H0Z" />
        </clipPath>
      </defs>
      <text
        x="0"
        y="28"
        fill="#F5FAFF"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="32"
        fontWeight="700"
        letterSpacing="-1.4"
      >
        fishtankr
      </text>
      <text
        x="0"
        y="28"
        fill="#8EC4FF"
        clipPath={`url(#${clipId})`}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="32"
        fontWeight="700"
        letterSpacing="-1.4"
        aria-hidden="true"
      >
        fishtankr
      </text>
    </svg>
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
      <rect x="20" y="70" width="360" height="180" rx="22" fill="var(--blue)" opacity="0.10" />
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
          <line x1="20" y1={y} x2="30" y2={y} stroke="var(--ink)" strokeWidth="1" opacity="0.35" />
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
