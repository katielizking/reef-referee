import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, Store } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { submitContactRequest } from "@/lib/commercial";
import { absoluteUrl } from "@/lib/site";

const path = "/contact";
export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact FishTankr" },
      {
        name: "description",
        content:
          "Contact FishTankr about species evidence, privacy, corrections or aquarium shop listings.",
      },
      { property: "og:url", content: absoluteUrl(path) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General enquiry");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await submitContactRequest(email, topic, message);
      setSent(true);
      toast.success("Your message has been sent");
    } catch (error) {
      toast.error("Couldn't send the message", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PolicyPage
      eyebrow="Contact"
      title="Talk to FishTankr"
      intro="Corrections are especially welcome when you can include a primary or specialist source."
    >
      <PolicySection title="Send an enquiry">
        {sent ? (
          <p className="rounded-xl bg-lime/20 p-4 font-semibold text-foreground">
            Thanks. Your message is in the FishTankr review queue.
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-3 rounded-2xl border bg-card p-4"
          >
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Topic
              </span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
              >
                <option>General enquiry</option>
                <option>Species evidence correction</option>
                <option>Privacy or data request</option>
                <option>Claim or correct a shop</option>
                <option>Report a welfare concern</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Message
              </span>
              <textarea
                required
                minLength={10}
                maxLength={4000}
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-1 w-full rounded-xl border bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <button
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Mail className="h-4 w-4" aria-hidden />
              )}
              Send message
            </button>
          </form>
        )}
      </PolicySection>
      <PolicySection title="Claim or correct a shop listing">
        <p className="flex gap-2">
          <Store className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
          Choose “Claim or correct a shop” above and include the listing URL,
          your role and a verifiable business contact method. Claiming a listing
          does not automatically make it featured.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
