/**
 * Renders the social preview images in public/og/ (1200 × 630 PNG).
 *
 *   npx tsx tools/og/render-og.ts
 *
 * Tank idea images are drawn from src/lib/tank-ideas.ts, so re-run this after
 * adding or editing an idea. A test fails if an idea has no image.
 */
import { mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { TANK_IDEAS, type TankIdea } from "../../src/lib/tank-ideas";

const require = createRequire(import.meta.url);
const { chromium } = require(`${execSync("npm root -g").toString().trim()}/playwright`);

const INK = "#0b1a2e";
const GLOW = "#8ec4ff";
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(opts: {
  eyebrow: string;
  title: string;
  lines: string[];
  accent: string;
  art: string;
}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: ${INK}; color: #fff;
    font-family: "Liberation Sans", "DejaVu Sans", sans-serif; overflow: hidden; }
  .wrap { display: grid; grid-template-columns: 1fr 440px; height: 100%; padding: 64px 72px; gap: 48px; }
  .brand { font-weight: 700; font-size: 30px; letter-spacing: -0.02em; color: ${GLOW}; }
  .eyebrow { margin-top: 56px; font-size: 22px; letter-spacing: 0.18em; text-transform: uppercase; color: ${opts.accent}; font-weight: 700; }
  h1 { margin-top: 18px; font-size: 64px; line-height: 1.04; letter-spacing: -0.03em; }
  ul { list-style: none; padding: 0; margin-top: 28px; }
  li { font-size: 26px; line-height: 1.5; color: #c2cee2; }
  .art { align-self: center; height: 360px; border-radius: 28px; overflow: hidden; position: relative;
    border: 3px solid rgba(255,255,255,0.18); }
  </style></head><body><div class="wrap"><div>
  <div class="brand">fishtankr</div>
  <div class="eyebrow">${escape(opts.eyebrow)}</div>
  <h1>${escape(opts.title)}</h1>
  <ul>${opts.lines.map((l) => `<li>${escape(l)}</li>`).join("")}</ul>
  </div><div class="art">${opts.art}</div></div></body></html>`;
}

/** A simple planted tank in the idea's colour: water, sand, plants and fish. */
function tankArt(colour: string, fish: number) {
  const plants = Array.from({ length: 7 }, (_, i) => {
    const x = 20 + i * 62;
    const h = 120 + ((i * 53) % 110);
    return `<div style="position:absolute;bottom:40px;left:${x}px;width:26px;height:${h}px;border-radius:40px 40px 4px 4px;background:rgba(80,160,90,0.85)"></div>`;
  }).join("");
  const shoal = Array.from({ length: Math.min(fish, 12) }, (_, i) => {
    const x = 40 + ((i * 97) % 340);
    const y = 60 + ((i * 61) % 170);
    const flip = i % 3 === 0 ? "transform:scaleX(-1);" : "";
    const scale = fish <= 2 ? 3 : 1;
    return `<svg style="position:absolute;left:${fish <= 2 ? 120 : x}px;top:${fish <= 2 ? 110 : y}px;${flip}" width="${48 * scale}" height="${22 * scale}" viewBox="0 0 48 22"><path d="M4 11 L14 3 L14 19 Z" fill="${colour}"/><ellipse cx="29" cy="11" rx="17" ry="8" fill="${colour}" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/><circle cx="39" cy="9" r="1.8" fill="#0b1a2e"/></svg>`;
  }).join("");
  return `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1d4f7a,#0f2f4d)"></div>
    ${plants}${shoal}
    <div style="position:absolute;left:0;right:0;bottom:0;height:44px;background:#d8c7a0"></div>`;
}

function ideaImage(i: TankIdea) {
  const litres = Math.round(i.dimensions.reduce((a, b) => a * b, 1) / 1000);
  const count = i.stock.reduce((n, s) => n + s.quantity, 0);
  return page({
    eyebrow: `Tank idea · ${litres} L · ${i.style}`,
    title: i.title,
    lines: [
      i.stock.map((s) => `${s.quantity} ${s.name.toLowerCase()}`).join(", "),
      `${i.dimensions.join(" × ")} cm · ${i.temperature} °C · pH ${i.ph}`,
      "Open it in the calculator",
    ],
    accent: i.colour,
    art: tankArt(i.colour, count),
  });
}

const PAGES: Record<string, string> = {
  default: page({
    eyebrow: "Freshwater stocking calculator",
    title: "Check the fish before you bring them home",
    lines: ["Tank mates, swimming room and water", "Free, no account needed"],
    accent: GLOW,
    art: tankArt("#f2b84b", 9),
  }),
  species: page({
    eyebrow: "Fish care guide",
    title: "Care, tank mates and sources",
    lines: ["Tank size, water and group needs", "Likely conflicts, checked against your plan"],
    accent: "#9fe0a8",
    art: tankArt("#e56b6f", 6),
  }),
  plan: page({
    eyebrow: "Shared stocking plan",
    title: "A tank plan, checked by FishTankr",
    lines: ["See the fish, the score and what to fix", "Remix it in the calculator"],
    accent: "#f2b84b",
    art: tankArt(GLOW, 10),
  }),
  "tank-ideas": page({
    eyebrow: "Tank ideas",
    title: "Freshwater tank ideas by size, fish and setup",
    lines: ["Exact stocking, layouts and care notes", "Open any plan in the calculator"],
    accent: "#c2c876",
    art: tankArt("#c9544b", 12),
  }),
};

async function main() {
  mkdirSync("public/og/ideas", { recursive: true });
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const shots: Array<[string, string]> = [
    ...Object.entries(PAGES).map(
      ([name, html]) => [`public/og/${name}.png`, html] as [string, string],
    ),
    ...TANK_IDEAS.map((i) => [`public/og/ideas/${i.slug}.png`, ideaImage(i)] as [string, string]),
  ];
  for (const [path, html] of shots) {
    await tab.setContent(html);
    await tab.screenshot({ path, type: "png" });
    console.log(path);
  }
  await browser.close();
}

void main();
