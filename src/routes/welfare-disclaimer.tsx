import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { absoluteUrl } from "@/lib/site";

const path = "/welfare-disclaimer";
export const Route = createFileRoute("/welfare-disclaimer")({
  head: () => ({
    meta: [
      { title: "Welfare disclaimer | FishTankr" },
      {
        name: "description",
        content: "What FishTankr's welfare score can and cannot tell you.",
      },
      { property: "og:url", content: absoluteUrl(path) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  }),
  component: WelfareDisclaimer,
});

function WelfareDisclaimer() {
  return (
    <PolicyPage
      eyebrow="Animal welfare"
      title="Welfare disclaimer"
      intro="A FishTankr score is a screening tool, not a promise that fish will thrive or survive."
    >
      <PolicySection title="What the score checks">
        <p>
          The current score screens recorded species compatibility, swimming
          space and selected pH and temperature. Cycle and biological-filter
          readiness can cap the result. The experimental waste-load band is
          informational and never tells you how many more fish to add.
        </p>
      </PolicySection>
      <PolicySection title="What it cannot observe">
        <p>
          FishTankr cannot see individual temperament, dissolved oxygen,
          disease, toxins, actual filter bacteria, inaccurate test kits, décor
          hazards, feeding, maintenance quality or rapid changes after a score
          is calculated. A high score does not make stocking safe when animals
          show distress or water tests are unsafe.
        </p>
      </PolicySection>
      <PolicySection title="Act on the fish and the water">
        <p>
          Delay stocking if cycle evidence is uncertain. Detectable ammonia or
          nitrite requires immediate investigation. If fish gasp, hide
          persistently, fight, stop eating or show illness, test the water and
          seek experienced local or veterinary help rather than relying on the
          score.
        </p>
        <p>
          <Link
            to="/methodology"
            className="font-semibold text-primary underline"
          >
            Read the methodology and evidence limits.
          </Link>
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
