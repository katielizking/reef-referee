import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Scorecard } from "@/lib/scoring";

export function welfareVerdictFor(scorecard: Scorecard) {
  if (scorecard.overall === null) {
    return {
      label: "No score yet",
      summary: "Add fish to see how well this tank meets their needs.",
      accent: "var(--water)",
      Icon: AlertCircle,
    };
  }
  if (scorecard.overall < 45) {
    return {
      label: "Do not stock",
      summary: "This plan has a serious welfare risk. Fix it before adding fish.",
      accent: "var(--status-critical)",
      Icon: AlertTriangle,
    };
  }
  if (scorecard.overall < 75 || scorecard.capReason) {
    return {
      label: "Risky as planned",
      summary: "There are welfare concerns to fix before you add fish.",
      accent: "var(--status-caution)",
      Icon: AlertCircle,
    };
  }
  return {
    label: "Looks suitable so far",
    summary:
      "Nothing needs your attention right now. Keep watching the fish and testing the water.",
    accent: "var(--status-good)",
    Icon: CheckCircle2,
  };
}
