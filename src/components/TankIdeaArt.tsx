import type { TankIdea } from "@/lib/tank-ideas";
/** A schematic layout, deliberately not a photograph or a promise of the finished tank. */
export function TankIdeaArt({ idea }: { idea: TankIdea }) {
  return (
    <svg
      viewBox="0 0 640 320"
      role="img"
      aria-label={`Illustrated layout concept for ${idea.title}`}
      className="w-full bg-[#101f25]"
    >
      <path d="M0 275Q180 250 320 278T640 267V320H0Z" fill="#59615a" />
      {[35, 70, 110, 145, 480, 520, 570, 605].map((x, i) => (
        <g key={x} stroke={i % 2 ? "#557d69" : "#3d655b"} strokeWidth="8" fill="none">
          <path d={`M${x} 285 Q${x - 30} 195 ${x + 10} ${65 + (i % 3) * 28}`} />
          <path d={`M${x} 220q-48-30-25-65M${x} 180q48-30 30-70`} />
        </g>
      ))}
      <path
        d="M130 280L220 170L245 95M220 170L310 145M485 280L442 194L400 158"
        stroke="#736352"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      {Array.from({ length: Math.min(idea.stock[0].quantity, 8) }, (_, i) => (
        <g
          key={i}
          transform={`translate(${265 + (i % 4) * 50} ${115 + Math.floor(i / 4) * 58 + (i % 2) * 15})`}
          fill={idea.colour}
        >
          <ellipse rx="15" ry="7" />
          <path d="M-12 0l-12-9v18Z" />
          <circle cx="9" cy="-2" r="1.8" fill="#10242a" />
        </g>
      ))}
      <text x="22" y="305" fill="#e3e9e5" fontSize="12" letterSpacing="2">
        LAYOUT CONCEPT
      </text>
    </svg>
  );
}
