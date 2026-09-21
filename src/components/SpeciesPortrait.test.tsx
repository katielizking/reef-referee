import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpeciesPortrait } from "./SpeciesPortrait";

describe("SpeciesPortrait", () => {
  it("renders without a React Query provider inside 3D HTML overlays", () => {
    expect(() =>
      renderToString(
        <SpeciesPortrait commonName="Neon tetra" scientificName="Paracheirodon innesi" />,
      ),
    ).not.toThrow();
  });
});
