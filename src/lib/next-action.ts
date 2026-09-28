import type { Scorecard } from "./scoring";
import type { TankState } from "./types";
import { EXAMPLE_LABEL, unconfirmedGroups } from "./example-values";
import { buildChecklist } from "@/components/PreStockChecklist";
import type { SectionId } from "@/components/TankSetupPanel";

export interface NextAction {
  tone: "critical" | "high" | "medium" | "confirm";
  title: string;
  action: string;
  /** A setup section that resolves it, when there is one. */
  section?: SectionId;
}

/**
 * The single most important thing to do next. A critical welfare problem
 * comes first; then example values the results still rest on; then the
 * scorecard's priority action; then the top pre-stock checklist item.
 */
export function nextAction(scorecard: Scorecard, state: TankState): NextAction | null {
  if (state.species.length === 0) return null;
  const priority = scorecard.priorityAction;
  if (priority?.severity === "critical") {
    return { tone: "critical", title: priority.title, action: priority.action };
  }
  const examples = unconfirmedGroups(state);
  if (examples.length > 0) {
    return {
      tone: "confirm",
      title: `Confirm your ${examples.map((g) => EXAMPLE_LABEL[g]).join(" and ")}`,
      action:
        "These results use example values, not your tank. Enter your own, or keep the examples if they already match.",
      section: examples[0] === "size" ? "tank" : "water",
    };
  }
  if (priority) return { tone: priority.severity, title: priority.title, action: priority.action };
  const items = buildChecklist(scorecard, state);
  const item =
    items.find((i) => i.severity === "must-fix") ?? items.find((i) => i.severity === "worth-look");
  if (item) {
    return {
      tone: item.severity === "must-fix" ? "high" : "medium",
      title: item.title,
      action: item.fix,
    };
  }
  return null;
}
