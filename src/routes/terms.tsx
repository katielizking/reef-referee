import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { absoluteUrl } from "@/lib/site";

const path = "/terms";
export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of use | FishTankr" },
      {
        name: "description",
        content: "Terms for using FishTankr's aquarium planning and directory tools.",
      },
      { property: "og:url", content: absoluteUrl(path) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms of use"
      intro="FishTankr helps you plan an aquarium, but it cannot replace watching your fish or getting qualified advice. Last updated 27 August 2026."
    >
      <PolicySection title="Use of the tool">
        <p>
          You may use FishTankr to plan a personal aquarium and share links created by the service.
          Do not misuse the service, try to access another person’s private data, upload unlawful
          content or treat a shared tank link as proof that a setup is safe.
        </p>
      </PolicySection>
      <PolicySection title="No guarantee">
        <p>
          Scores are estimates based on the species and setup information available to us. What
          happens in a real aquarium also depends on water chemistry, individual fish, daily care,
          equipment, disease and conditions the app cannot see. Check important decisions against
          current reputable sources. For serious welfare concerns, ask an aquatic veterinarian or
          experienced professional.
        </p>
      </PolicySection>
      <PolicySection title="Availability and saved tanks">
        <p>
          FishTankr is still a work in progress, so features may change or occasionally be
          unavailable. You can lose access to an anonymous save if your browser data, anonymous ID
          or our database changes. Keep your own copy of any plan that matters to you.
        </p>
      </PolicySection>
      <PolicySection title="Commercial links and intellectual property">
        <p>
          FishTankr may earn referral income from some directory or product links, and some listings
          may be paid placements. We label those relationships. FishTankr content and code remain
          subject to their applicable rights, while third-party model and media credits are on the{" "}
          <Link to="/attribution" className="font-semibold text-primary underline">
            attribution page
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
