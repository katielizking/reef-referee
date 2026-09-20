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
      {
        property: "og:title",
        content: "Affiliate and sponsorship disclosure | FishTankr",
      },
      {
        property: "og:description",
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
      intro="If FishTankr may earn money from a link or listing, we want that relationship to be easy to understand."
    >
      <PolicySection title="Affiliate links">
        <p>
          If you buy something after following a link labelled “affiliate” or “commercial,”
          FishTankr may earn a commission at no extra cost to you. We also mark these links for
          search engines as sponsored.
        </p>
      </PolicySection>
      <PolicySection title="Featured shops">
        <p>
          A “featured” label means a shop has paid for more prominent placement. It does not mean we
          have independently endorsed the shop, its stock or its animal-care practices. Verifying a
          listing and selling featured placement are separate.
        </p>
      </PolicySection>
      <PolicySection title="Editorial independence">
        <p>
          Payments never change welfare scores or species needs. We label paid relationships near
          the relevant link and correct misleading listing information when we can verify a report.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
