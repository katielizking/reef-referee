import { describe, expect, it } from "vitest";
import { alsoKnownAs, lookAlikesOf, searchableNames, telltale, varietiesOf } from "./species-names";
import type { Species } from "./types";

const fish = (id: string, common: string, scientific: string, o: Partial<Species> = {}) =>
  ({
    id,
    common_name: common,
    scientific_name: scientific,
    min_tank_litres: 40,
    adult_size_cm: 5,
    temperament: "peaceful",
    min_group_size: 1,
    ...o,
  }) as Species;

const betta = fish("b", "Betta", "Betta splendens", {
  temperament: "aggressive",
  min_tank_litres: 20,
});
const peaceful = fish("p", "Peaceful betta", "Betta imbellis");
const snakehead = fish("s", "Snakehead betta", "Betta channoides");
const comet = fish("c", "Comet goldfish", "Carassius auratus auratus");
const fancy = fish("f", "Fancy goldfish", "Carassius auratus auratus");
const tiger = fish("t", "Tiger barb", "Puntigrus tetrazona");
const kribensis = fish("k", "Kribensis", "Pelvicachromis pulcher");
const striped = fish("k2", "Striped kribensis", "Pelvicachromis taeniatus");
const glowlight = fish("g", "Glowlight rasbora", "Trigonostigma hengeli");
const harlequin = fish("h", "Harlequin rasbora", "Trigonostigma heteromorpha");
const catalogue = [
  betta,
  peaceful,
  snakehead,
  comet,
  fancy,
  tiger,
  kribensis,
  striped,
  glowlight,
  harlequin,
];

describe("look-alike species", () => {
  it("links the bettas as different fish, both ways", () => {
    expect(lookAlikesOf(betta, catalogue).map((s) => s.id)).toEqual(["p", "s"]);
    expect(lookAlikesOf(peaceful, catalogue).map((s) => s.id)).toEqual(["b"]);
  });

  it("links other confusable pairs in one genus", () => {
    expect(lookAlikesOf(kribensis, catalogue).map((s) => s.id)).toEqual(["k2"]);
  });

  it("does not link fish that merely share a word like 'rasbora'", () => {
    expect(lookAlikesOf(glowlight, catalogue)).toEqual([]);
  });

  it("treats same-species entries as varieties, not look-alikes", () => {
    expect(varietiesOf(comet, catalogue).map((s) => s.id)).toEqual(["f"]);
    expect(lookAlikesOf(comet, catalogue)).toEqual([]);
    expect(varietiesOf(betta, catalogue)).toEqual([]);
  });
});

describe("names", () => {
  it("knows the betta is sold as the Siamese fighting fish, and finds it by that name", () => {
    expect(alsoKnownAs(betta)).toEqual(["Siamese fighting fish"]);
    expect(searchableNames(betta).some((n) => n.includes("fighting fish"))).toBe(true);
    expect(alsoKnownAs(peaceful)).toEqual([]);
  });

  it("gives a one-line telltale to tell look-alikes apart", () => {
    expect(telltale(betta)).toBe("aggressive, keep one on its own, 5 cm, needs 20 L+");
    expect(telltale(peaceful)).toBe("peaceful, can be kept singly, 5 cm, needs 40 L+");
  });
});
