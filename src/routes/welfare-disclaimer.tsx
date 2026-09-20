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
      { property: "og:title", content: "Welfare disclaimer | FishTankr" },
      {
        property: "og:description",
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
      intro="FishTankr can help you spot risks, but no score can promise that fish will thrive or survive."
    >
      <PolicySection title="What the score checks">
        <p>
          The score checks the species in your plan for compatibility, swimming space, pH and
          temperature. An unfinished or unverified cycle can limit the result. The beta waste-load
          band is shown separately and never tells you how many more fish to add.
        </p>
      </PolicySection>
      <PolicySection title="What it cannot observe">
        <p>
          FishTankr cannot see the personality of an individual fish, dissolved oxygen, disease,
          toxins, the bacteria living in your filter, an inaccurate test kit, unsafe décor, feeding
          habits or the quality of your maintenance. Conditions can also change after the score is
          calculated. If the fish look distressed or the water tests are unsafe, a high score does
          not make the tank safe.
        </p>
      </PolicySection>
      <PolicySection title="Act on the fish and the water">
        <p>
          Wait before adding fish if you are not sure the tank is cycled. Any ammonia or nitrite
          needs immediate attention. If fish are gasping, hiding constantly, fighting, refusing food
          or showing signs of illness, test the water and ask an experienced local fishkeeper or
          aquatic veterinarian for help.
        </p>
        <p>
          <Link to="/methodology" className="font-semibold text-primary underline">
            See how the score works and where its limits are.
          </Link>
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
