import { describe, expect, it } from "vitest";
import tokens from "@/design/tokens.json";
import { ratioContraste } from "@/app/styles/contraste";

describe("Carnet celeste reading surfaces", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const surface of ["fond", "surface", "surface-elevee", "carnet-lavande", "carnet-rose", "carnet-sauge"] as const) {
      for (const ink of ["texte", "texte-doux"] as const) {
        it(`${mode}: ${ink} remains AA on ${surface}`, () => {
          expect(ratioContraste(tokens[mode][ink], tokens[mode][surface])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
    it(`${mode}: primary actions remain readable`, () => {
      expect(ratioContraste(tokens[mode]["sur-accent"], tokens[mode].accent)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: input boundaries remain discernible`, () => {
      expect(ratioContraste(tokens[mode]["bordure-forte"], tokens[mode].surface)).toBeGreaterThanOrEqual(3);
    });
  }
});
