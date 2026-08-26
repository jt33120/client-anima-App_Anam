import { describe, expect, it } from "vitest";
import type { BrancheProjetee } from "@/lib/scene/projection";
import {
  BULBES_CANONIQUES,
  CANEVAS,
  construireGeometrieLunaire,
  placerBranches,
} from "@/render/arbre/geometrie";
import {
  COUCHES_LUNAIRES,
  PALETTE_LUNAIRE,
  construireFeuillesLunaires,
  contenuEtapeLunaire,
  lumiereDeBranche,
} from "@/render/arbre/MoteurArbreLunaire";

const branche = (i: number, etat: BrancheProjetee["etat"] = "naissance", intensite = 0): BrancheProjetee => ({
  id: `branche-${i}`,
  etat,
  intensite,
  extraitSourceId: `source-${i}`,
  nom: `Branche ${i}`,
  dateNaissance: new Date(Date.UTC(2026, 0, i + 1, 10)).toISOString(),
});

const branches = (n: number) => Array.from({ length: n }, (_, i) => branche(i));

describe("handoff lunaire — contrat visuel", () => {
  it("porte le repère portrait et la palette validés au hex près", () => {
    expect(CANEVAS).toEqual({ largeur: 1408, hauteur: 2503 });
    expect(PALETTE_LUNAIRE).toEqual({
      ciel: "#0C0A1E",
      tronc: "#6A6690",
      branche: "#9A96BE",
      feuillage: "#8FB6D8",
      lueur: "#CDE4F8",
      accroche: "#8FC1EF",
    });
    expect(COUCHES_LUNAIRES).toEqual(["base", "wood", "leaf", "glow"]);
  });

  it("l'étape 0 ne contient que la graine ; l'arbre apparaît avec la première branche", () => {
    expect(contenuEtapeLunaire(0)).toEqual({ graine: true, arbre: false });
    expect(contenuEtapeLunaire(1)).toEqual({ graine: true, arbre: true });
  });

  it("garde les 13 bulbes officiels, dans l'ordre de branche du prototype", () => {
    expect(BULBES_CANONIQUES).toEqual([
      { x: 704, y: 250, r: 180 },
      { x: 590, y: 420, r: 148 },
      { x: 818, y: 415, r: 148 },
      { x: 452, y: 340, r: 158 },
      { x: 286, y: 470, r: 146 },
      { x: 360, y: 640, r: 150 },
      { x: 560, y: 610, r: 138 },
      { x: 430, y: 830, r: 132 },
      { x: 956, y: 335, r: 158 },
      { x: 1122, y: 465, r: 146 },
      { x: 1048, y: 635, r: 150 },
      { x: 848, y: 605, r: 138 },
      { x: 978, y: 825, r: 132 },
    ]);
    expect(placerBranches(branches(13)).map((p) => p.bulbe)).toEqual(BULBES_CANONIQUES);
  });

  it("ne plafonne pas à 13 : 60 branches ont 60 ancres distinctes et restent dans le repère", () => {
    const placees = placerBranches(branches(60));
    expect(placees).toHaveLength(60);
    expect(new Set(placees.map((p) => `${p.accroche.x.toFixed(6)}:${p.accroche.y.toFixed(6)}`)).size).toBe(60);
    for (const p of placees) {
      expect(p.accroche.x).toBeGreaterThanOrEqual(0);
      expect(p.accroche.x).toBeLessThanOrEqual(CANEVAS.largeur);
      expect(p.accroche.y).toBeGreaterThanOrEqual(0);
      expect(p.accroche.y).toBeLessThanOrEqual(CANEVAS.hauteur);
    }
  });

  it("une naissance supplémentaire ne déplace aucune branche déjà née, y compris après le 13e rang", () => {
    const complet = placerBranches(branches(60));
    const positionComplete = new Map(
      complet.map(({ branche, accroche, bulbe }) => [branche.id, { accroche, bulbe }]),
    );
    for (const n of [1, 2, 13, 14, 25, 59]) {
      const partiel = placerBranches(branches(n));
      for (const { branche, accroche, bulbe } of partiel) {
        expect({ accroche, bulbe }, `la branche ${branche.id} a bougé`).toEqual(
          positionComplete.get(branche.id),
        );
      }
    }
  });

  it("reprend le flux RNG partagé du prototype avant la toute première feuille", () => {
    const geometrie = construireGeometrieLunaire(branches(13));
    const premiere = construireFeuillesLunaires(geometrie).get(0)?.[0];
    expect(premiere).toBeDefined();
    expect(premiere!.x).toBeCloseTo(885.1429315138475, 10);
    expect(premiere!.y).toBeCloseTo(225.6383771304068, 10);
    expect(premiere!.rotation).toBeCloseTo(1.112404142774229, 10);
    expect(premiere!.u).toBeCloseTo(0.8350856832643974, 10);
    expect(premiere!.echelle).toBeCloseTo(1.2100487613344457, 10);
    expect({ forme: premiere!.forme, ton: premiere!.ton }).toEqual({ forme: 2, ton: 3 });
  });

  it("génère des feuilles pour chacun des 60 rangs sans déplacer les feuilles existantes", () => {
    const geometrie13 = construireGeometrieLunaire(branches(13));
    const geometrie14 = construireGeometrieLunaire(branches(14));
    const geometrie60 = construireGeometrieLunaire(branches(60));
    const feuilles13 = construireFeuillesLunaires(geometrie13);
    const feuilles14 = construireFeuillesLunaires(geometrie14);
    const feuilles60 = construireFeuillesLunaires(geometrie60);

    expect(feuilles60.size).toBe(60);
    for (let rang = 0; rang < 60; rang++) {
      const feuillesDuRang = feuilles60.get(rang);
      expect(feuillesDuRang?.length, `aucune feuille au rang ${rang}`).toBeGreaterThan(0);
      expect(
        feuillesDuRang?.every((feuille) =>
          [
            feuille.x,
            feuille.y,
            feuille.rotation,
            feuille.u,
            feuille.echelle,
            feuille.forme,
            feuille.ton,
          ].every(Number.isFinite),
        ),
        `feuille invalide au rang ${rang}`,
      ).toBe(true);
    }
    for (let rang = 0; rang < 13; rang++) {
      expect(feuilles60.get(rang), `le rang canonique ${rang} a dérivé`).toEqual(
        feuilles13.get(rang),
      );
    }
    expect(feuilles60.get(13), "la première extension a dérivé").toEqual(feuilles14.get(13));
    expect(geometrie60.etatRngFeuillesCanoniques).toBe(
      construireGeometrieLunaire([]).etatRngFeuillesCanoniques,
    );
  });
});

describe("handoff lunaire — états indépendants", () => {
  it("mappe naissance, feuillaison et rayonnement sans état global", () => {
    expect(lumiereDeBranche(branche(0, "naissance", 0.9))).toBe(0);
    expect(lumiereDeBranche(branche(1, "feuillaison", 0.58))).toBeCloseTo(0.58, 8);
    expect(lumiereDeBranche(branche(2, "rayonnement", 0.2))).toBe(1);
  });

  it("borne une intensité de feuillaison invalide", () => {
    expect(lumiereDeBranche(branche(0, "feuillaison", Number.NaN))).toBe(0);
    expect(lumiereDeBranche(branche(1, "feuillaison", -4))).toBe(0);
    expect(lumiereDeBranche(branche(2, "feuillaison", 8))).toBe(1);
  });
});
