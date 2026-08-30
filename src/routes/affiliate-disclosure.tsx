import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { absoluteUrl } from "@/lib/site";

const path = "/affiliate-disclosure";
export const Route = createFileRoute("/affiliate-disclosure")({
  head: () => ({
    meta: [
      { title: "Affiliate and sponsorship disclosure | FishTankr" },
      {
        name: "description",
        content: "How FishTankr identifies referral links, featured shops and sponsorships.",
      },
      { property: "og:url", content: absoluteUrl(path) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  }),
  component: AffiliateDisclosure,
});

function AffiliateDisclosure() {
  return (
    <PolicyPage
      eyebrow="Commercial transparency"
      title="Affiliate and sponsorship disclosure"
      intro="Recommendations should remain understandable even when FishTankr may earn money from a link or listing."
    >
      <PolicySection title="Affiliate links">
        <p>
          A link labelled affiliate or commercial may earn FishTankr a commission if you buy after
          following it, at no extra cost to you. Commercial outbound links use sponsored and
          nofollow relationship attributes.
        </p>
      </PolicySection>
      <PolicySection title="Featured shops">
        <p>
          A featured label means a shop has paid for placement or received enhanced visibility. It
          does not mean the shop, its stock or its animal-care practices have been independently
          endorsed. Ordinary verification and featured placement are separate.
        </p>
      </PolicySection>
      <PolicySection title="Editorial independence">
        <p>
          Payments do not change welfare scores or species requirements. FishTankr will identify
          paid relationships near the relevant link and correct misleading listing information when
          it is substantiated.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
