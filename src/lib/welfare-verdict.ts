import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Scorecard } from "@/lib/scoring";

export function welfareVerdictFor(scorecard: Scorecard) {
  if (scorecard.overall === null) {
    return {
      label: "No score yet",
      summary: "Add fish to check the plan.",
      accent: "var(--water)",
      Icon: AlertCircle,
    };
  }
  if (scorecard.overall < 45) {
    return {
      label: "Do not stock",
      summary: "Fix this setup before you add fish.",
      accent: "var(--status-critical)",
      Icon: AlertTriangle,
    };
  }
  if (scorecard.overall < 75 || scorecard.capReason) {
    return {
      label: "Needs changes",
      summary: "Fix these welfare issues before you stock.",
      accent: "var(--status-caution)",
      Icon: AlertCircle,
    };
  }
  return {
    label: "Looking good so far",
    summary: "Nothing urgent to fix. Keep testing and watching the tank.",
    accent: "var(--status-good)",
    Icon: CheckCircle2,
  };
}
