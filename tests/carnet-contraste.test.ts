import { describe, expect, it } from "vitest";
import tokens from "@/design/tokens.json";
import { ratioContraste } from "@/app/styles/contraste";

type Palette = typeof tokens.light | typeof tokens.dark;
type Rgb = readonly number[];

const rgb = (hex: string): Rgb => hex.slice(1).match(/../g)!.map((canal) => parseInt(canal, 16));
const hex = (couleur: Rgb): string => `#${couleur.map((canal) => Math.round(canal).toString(16).padStart(2, "0")).join("")}`;
const superposer = (dessus: Rgb, dessous: Rgb, opacite: number): Rgb =>
  dessus.map((canal, index) => canal * opacite + dessous[index] * (1 - opacite));

function couleur(palette: Palette, role: string): string {
  const valeur = palette[role as keyof Palette];
  if (!/^#[0-9a-f]{6}$/i.test(valeur)) throw new Error(`Gradient role is not a color: ${role}`);
  return valeur;
}

/** Stops come from the authored gradients, so adding a lighter stop extends the AA check. */
function arrets(palette: Palette, gradient: string): string[] {
  return [...new Set([...gradient.matchAll(/var\(--([a-z-]+)\)/g)].map((match) => couleur(palette, match[1])))];
}

/** The two translucent radial layers are composited in CSS painting order over --fond. */
function fondsComposes(palette: Palette): Rgb[] {
  const gradient = tokens.shared["carnet-gradient-fond"];
  const couches = [...gradient.matchAll(/color-mix\(in srgb, var\(--([a-z-]+)\) (\d+(?:\.\d+)?)%, transparent\)/g)];
  if (couches.length === 0) throw new Error("Expected translucent background layers to audit");
  let fonds: Rgb[] = [rgb(palette.fond)];
  for (const couche of couches.reverse()) {
    const maximum = Number(couche[2]) / 100;
    fonds = fonds.flatMap((fond) => [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
      superposer(rgb(couleur(palette, couche[1])), fond, maximum * fraction),
    ));
  }
  return fonds;
}

describe("Carnet celeste reading surfaces", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const surface of ["fond", "surface", "surface-elevee", "jour", "carnet-lavande", "carnet-rose", "carnet-sauge"] as const) {
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

    for (const gradient of ["carnet-gradient-carte", "carnet-gradient-mantra"] as const) {
      for (const ink of ["texte", "texte-doux"] as const) {
        it(`${mode}: ${ink} remains AA at every ${gradient} stop and between stops`, () => {
          const couleurs = arrets(tokens[mode], tokens.shared[gradient]);
          expect(couleurs.length).toBeGreaterThan(1);
          for (let index = 1; index < couleurs.length; index++) {
            for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
              const fond = hex(superposer(rgb(couleurs[index]), rgb(couleurs[index - 1]), fraction));
              expect(ratioContraste(tokens[mode][ink], fond), `${ink} on ${fond}`).toBeGreaterThanOrEqual(4.5);
            }
          }
        });
      }
    }

    for (const ink of ["texte", "texte-doux"] as const) {
      it(`${mode}: ${ink} remains AA through overlapping radial gradients`, () => {
        for (const fond of fondsComposes(tokens[mode])) {
          expect(ratioContraste(tokens[mode][ink], hex(fond)), `${ink} on ${hex(fond)}`).toBeGreaterThanOrEqual(4.5);
        }
      });

      it(`${mode}: ${ink} remains AA under the brightest and darkest possible illustration pixels`, () => {
        const opacite = Number(tokens[mode]["carnet-decor-opacity"]);
        expect(opacite).toBeGreaterThanOrEqual(0);
        expect(opacite).toBeLessThanOrEqual(1);
        for (const fond of fondsComposes(tokens[mode])) {
          for (const pixel of ["#FFFFFF", "#000000"]) {
            const compose = hex(superposer(rgb(pixel), fond, opacite));
            expect(ratioContraste(tokens[mode][ink], compose), `${ink} on ${compose}, ${pixel} at ${opacite}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      });
    }

    it(`${mode}: selected navigation remains readable`, () => {
      expect(ratioContraste(tokens[mode].accent, tokens[mode]["accent-doux"])).toBeGreaterThanOrEqual(4.5);
    });

    it(`${mode}: primary action text remains AA through its mixed gradient`, () => {
      const melange = /color-mix\(in srgb, var\(--([a-z-]+)\) (\d+(?:\.\d+)?)%, var\(--([a-z-]+)\)\)/.exec(tokens.shared["carnet-gradient-action"]);
      if (!melange) throw new Error("Expected the action gradient's mixed color stop");
      const fin = superposer(rgb(couleur(tokens[mode], melange[1])), rgb(couleur(tokens[mode], melange[3])), Number(melange[2]) / 100);
      for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
        const fond = hex(superposer(fin, rgb(tokens[mode].accent), fraction));
        expect(ratioContraste(tokens[mode]["sur-accent"], fond)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
