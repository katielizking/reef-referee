import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { absoluteUrl } from "@/lib/site";

const path = "/attribution";
export const Route = createFileRoute("/attribution")({
  head: () => ({
    meta: [
      { title: "3D model attribution | FishTankr" },
      {
        name: "description",
        content:
          "Creators, sources, licences and modifications for FishTankr's verified 3D fish models.",
      },
      { property: "og:url", content: absoluteUrl(path) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  }),
  component: AttributionPage,
});

function AttributionPage() {
  return (
    <PolicyPage
      eyebrow="Credits"
      title="3D model attribution"
      intro="FishTankr only registers a model after its source, creator and licence have been recorded."
    >
      <PolicySection title="Betta splendens">
        <p>
          Created by{" "}
          <a
            className="font-semibold text-primary underline"
            href="https://sketchfab.com/VapTor"
            target="_blank"
            rel="noopener noreferrer"
          >
            BlueMesh
          </a>
          . Source:{" "}
          <a
            className="font-semibold text-primary underline"
            href="https://sketchfab.com/3d-models/betta-splendens-f4eeb7f50ad24873842bd954ad27d23b"
            target="_blank"
            rel="noopener noreferrer"
          >
            Betta Splendens on Sketchfab
          </a>
          . Licensed under{" "}
          <a
            className="font-semibold text-primary underline"
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>
        <p>
          FishTankr removed staging geometry, reoriented the model to +X, scaled it to a 6 cm
          total-length reference and optimised texture delivery. The original skin, animation and
          PBR materials were retained.
        </p>
      </PolicySection>
      <PolicySection title="Neon tetra">
        <p>
          Created by aeroplankton. Source:{" "}
          <a
            className="font-semibold text-primary underline"
            href="https://blendswap.com/blend/32414"
            target="_blank"
            rel="noopener noreferrer"
          >
            Neon tetra on Blend Swap
          </a>
          . The source listing records CC-BY; its version was not specified in the captured asset
          metadata. FishTankr preserves creator and source attribution on distributed derivatives.
        </p>
      </PolicySection>
      <PolicySection title="Procedural scene elements">
        <p>
          Unverified species and general aquarium scenery may use project-authored procedural
          geometry. They are not presented as verified anatomical reconstructions. See the
          methodology for the distinction between verified and reference-informed assets.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
