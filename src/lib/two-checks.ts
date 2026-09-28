import { TEST_MAX_AGE_DAYS } from "./cycle-status";

/**
 * The one explanation of how stocking suitability and readiness relate.
 * Every page that mentions the score and cycling uses this copy, so the
 * calculator, tracker, methodology, species pages and guides cannot drift.
 *
 * The rule it describes lives in scoreTank: cycling never changes the score.
 */
export const TWO_CHECKS = {
  suitability: {
    name: "Stocking suitability",
    question: "Do these fish suit this tank?",
    where: "Stocking calculator",
    detail:
      "Scored out of 100 from tank mates, swimming room and water match. Cycling never changes this score.",
  },
  readiness: {
    name: "Readiness to add fish",
    question: "Is this tank safe for fish today?",
    where: "Tank tracker",
    detail: `A separate verdict, never a score. It reads your cycle status, filter maturity and an ammonia and nitrite test from the last ${TEST_MAX_AGE_DAYS} days.`,
  },
  /** One-sentence version for places that only have room for a line. */
  summary:
    "The stocking score never includes cycling. Whether the tank is ready for fish is a separate check in the tank tracker.",
  reminder:
    "A high stocking score does not mean the tank is ready. Check both before you buy fish.",
} as const;
