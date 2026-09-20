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
      { property: "og:title", content: "3D model attribution | FishTankr" },
      {
        property: "og:description",
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
      intro="Every registered 3D model includes its creator, source and licence here."
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
          Species without a verified model, along with general aquarium scenery, may use shapes
          created by FishTankr. We do not present these as anatomically accurate models. The
          methodology explains how verified and reference-based assets differ.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
