import type { Scorecard } from "./scoring";
import type { TankState } from "./types";

function verdict(scorecard: Scorecard): string {
  if (scorecard.overall === null) return "Not scored";
  if (scorecard.overall < 45) return "DO NOT STOCK";
  if (scorecard.overall < 75 || scorecard.capReason) return "RISKY — REVISE FIRST";
  return "SAFE TO CONSIDER";
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let lineY = y;
  for (const word of words) {
    const test = `${line}${line ? " " : ""}${word}`;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else line = test;
  }
  if (line) context.fillText(line, x, lineY);
}

export async function shareScoreCard(
  scorecard: Scorecard,
  state: TankState,
): Promise<"shared" | "downloaded"> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");

  ctx.fillStyle = "#10232e";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "#37b8c6";
  ctx.fillRect(0, 0, 1080, 24);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 64px Sora, sans-serif";
  ctx.fillText("FishTankr", 80, 120);
  ctx.fillStyle = "#a9f06b";
  ctx.font = "700 34px Sora, sans-serif";
  ctx.fillText(verdict(scorecard), 80, 205);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 190px Sora, sans-serif";
  ctx.fillText(String(scorecard.overall ?? "—"), 72, 430);
  ctx.font = "500 34px DM Sans, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.fillText("welfare screen / 100", 80, 480);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 44px Sora, sans-serif";
  wrapText(ctx, state.name || "My tank", 80, 570, 900, 56);
  ctx.font = "500 30px DM Sans, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.72)";
  const fishCount = state.species.reduce((sum, row) => sum + row.quantity, 0);
  ctx.fillText(
    `${Math.round((state.length_cm * state.width_cm * state.height_cm) / 1000)} L · ${fishCount} fish · ${state.species.length} species`,
    80,
    650,
  );
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px DM Sans, sans-serif";
  ctx.fillText("Most important next step", 80, 745);
  ctx.font = "500 29px DM Sans, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.78)";
  wrapText(
    ctx,
    scorecard.priorityAction?.action ?? "Keep monitoring water quality and animal behaviour.",
    80,
    795,
    900,
    40,
  );
  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.font = "500 23px DM Sans, sans-serif";
  ctx.fillText("Decision support, not a guarantee · fishtankr", 80, 1010);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Could not create score image."))),
      "image/png",
    ),
  );
  const file = new File([blob], "fishtankr-score.png", { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `${state.name} — FishTankr score`,
      text: "My FishTankr welfare screen",
      files: [file],
    });
    return "shared";
  }
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(href);
  return "downloaded";
}
