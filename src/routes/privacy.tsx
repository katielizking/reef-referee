import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { absoluteUrl } from "@/lib/site";

const path = "/privacy";
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy and storage | FishTankr" },
      {
        name: "description",
        content:
          "How FishTankr handles anonymous sessions, saved tanks, waitlist details and local browser storage.",
      },
      { property: "og:url", content: absoluteUrl(path) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy and storage"
      intro="A plain-language account of the information FishTankr uses to run the builder. Last updated 27 August 2026."
    >
      <PolicySection title="What we collect">
        <p>
          FishTankr creates an anonymous authentication identifier so tanks can
          be saved without requiring a named account. Saved plans include tank
          dimensions, equipment, livestock, cycle evidence and water settings.
          If you join an update list, we collect the email address you submit.
          Contact enquiries include the reply email, topic and message you send.
        </p>
        <p>
          Basic technical and product events may be recorded in aggregate, such
          as which anonymous score issue codes occur or whether a directory link
          was opened. We do not intentionally collect names, precise location,
          payment-card details or sensitive health information through the
          builder.
        </p>
      </PolicySection>
      <PolicySection title="Browser storage">
        <p>
          We use local and session storage for interface preferences,
          dismissals, pending quiz or species selections, and anonymous recovery
          hints. This is functional storage rather than advertising tracking.
          Clearing browser data may remove the local link to anonymous saved
          tanks.
        </p>
      </PolicySection>
      <PolicySection title="Why and where it is used">
        <p>
          Information is used to provide saved tanks and shared links, improve
          welfare guidance, respond to enquiries and send requested product
          updates. The app uses Supabase infrastructure and may link to
          third-party sites such as Ko-fi, retailers or map providers, whose own
          privacy terms apply after you leave FishTankr.
        </p>
      </PolicySection>
      <PolicySection title="Choices, access and deletion">
        <p>
          You can use the core planning tools under an anonymous session. Do not
          put personal information in tank names. To ask about access,
          correction, deletion or an email-list removal, use the contact form
          and include the relevant share link or email address.
        </p>
        <p>
          See the{" "}
          <Link to="/terms" className="font-semibold text-primary underline">
            terms
          </Link>{" "}
          and{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            contact page
          </Link>
          . This draft should receive legal review before commercial launch.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
