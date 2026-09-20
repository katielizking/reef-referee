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
      { property: "og:title", content: "Privacy and storage | FishTankr" },
      {
        property: "og:description",
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
      intro="Here’s what FishTankr stores, why we need it and what choices you have. Last updated 20 September 2026."
    >
      <PolicySection title="What we collect">
        <p>
          FishTankr creates an anonymous ID so you can save tanks without making an account. A saved
          plan includes the tank size, equipment, fish, cycle details and water settings. If you
          join an update list, we store the email address you enter. If you contact us, we receive
          your reply email, chosen topic and message.
        </p>
        <p>
          We may collect basic technical and product events in aggregate, for example which score
          problems appear most often or whether someone opens a shop link. We do not intentionally
          collect your name, precise location, card details or health information through the
          builder.
        </p>
      </PolicySection>
      <PolicySection title="Community accounts and posts">
        <p>
          Community participation uses an email-confirmed account. We store your email for sign-in,
          your public username, posts and replies, and the votes and saves associated with your
          account. Your email, saved-post list and individual votes are not publicly listed. Reports
          are visible to moderators.
        </p>
        <p>
          Posts, usernames, replies and uploaded photographs are public. Photos are public as soon
          as they are uploaded, including before a post is published; do not upload private
          information. You can edit or remove your own posts and replies. Removed replies leave a
          placeholder so conversations remain understandable. Moderators may hide content, lock
          discussions and restrict accounts. Contact us to request account or uploaded-file removal.
        </p>
      </PolicySection>
      <PolicySection title="Usage analytics">
        <p>
          When enabled, we use PostHog to understand which pages people visit and which controls
          they use. PostHog uses a browser identifier, cookies and local storage to connect visits.
          These events include basic technical information such as browser and device type. We do
          not link this identifier to your email address or saved-tank account.
        </p>
        <p>
          Session recording is disabled. Text and element attributes are masked in automatic click
          tracking, and query strings and fragments are removed from page and referrer URLs before
          events are sent. We honour your browser’s Do Not Track setting.
        </p>
      </PolicySection>
      <PolicySection title="Browser storage">
        <p>
          When configured, Sentry helps us diagnose browser errors and slow page loads. It receives
          error details and sampled performance information. We do not enable session recording or
          deliberately attach your email address or saved-tank identity to error reports.
        </p>
        <p>
          We use browser storage to remember interface preferences, dismissed messages, quiz or fish
          selections and the anonymous ID linked to your saved tanks. We use it to make the site
          work, not for advertising. Clearing your browser data may remove your access to anonymous
          saves.
        </p>
      </PolicySection>
      <PolicySection title="Why and where it is used">
        <p>
          We use this information to save and share tanks, improve the welfare guidance, reply to
          messages and send updates you asked for. FishTankr uses Supabase and links to services
          such as Ko-fi, retailers and map providers. Their own privacy terms apply once you leave
          our site.
        </p>
      </PolicySection>
      <PolicySection title="Choices, access and deletion">
        <p>
          You can use the main planning tools without a named account. Please do not put personal
          information in a tank name. To ask us to access, correct or delete your information, or
          remove you from an email list, use the contact form and include the relevant share link or
          email address.
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
          . This is a working draft and will be legally reviewed before commercial launch.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
