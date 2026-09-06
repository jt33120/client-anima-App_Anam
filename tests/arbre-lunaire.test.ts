import { describe, expect, it } from "vitest";
import type { BrancheProjetee } from "@/lib/scene/projection";
import tokens from "@/design/tokens.json";
import {
  BULBES_CANONIQUES,
  CANEVAS,
  CENTRE_ARBRE,
  construireGeometrieLunaire,
  placerBranches,
} from "@/render/arbre/geometrie";
import {
  COUCHES_LUNAIRES,
  PALETTE_LUNAIRE,
  construireFeuillesLunaires,
  contenuEtapeLunaire,
  lumiereDeBranche,
  rayonnementDeBranche,
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

describe("arbre céleste — contrat visuel", () => {
  it("conserve le repère partagé et tire toute sa palette des tokens", () => {
    expect(CANEVAS).toEqual({ largeur: 1408, hauteur: 2503 });
    expect(PALETTE_LUNAIRE).toEqual({
      ciel: tokens.shared["carnet-jardin"],
      tronc: tokens.arbre.bois,
      branche: tokens.arbre.boisClair,
      feuillage: tokens.arbre.feuilleCiel,
      lueur: tokens.arbre.nacre,
      accroche: tokens.arbre.feuilleCiel,
    });
    expect(COUCHES_LUNAIRES).toEqual(["base", "wood", "leaf", "glow"]);
  });

  it("l'étape 0 ne contient que la graine ; l'arbre apparaît avec la première branche", () => {
    expect(contenuEtapeLunaire(0)).toEqual({ graine: true, arbre: false });
    expect(contenuEtapeLunaire(1)).toEqual({ graine: true, arbre: true });
  });

  it("répartit les premières pousses de chaque côté, avec un sous-sol inférieur au quart du portrait", () => {
    expect(BULBES_CANONIQUES).toHaveLength(13);
    expect(BULBES_CANONIQUES[1].x).toBeLessThan(CENTRE_ARBRE.x);
    expect(BULBES_CANONIQUES[2].x).toBeGreaterThan(CENTRE_ARBRE.x);
    expect(placerBranches(branches(13)).map((p) => p.bulbe)).toEqual(BULBES_CANONIQUES);
    const racines = construireGeometrieLunaire(branches(13)).statiques.filter((s) => s.kind === "root");
    const profondeur = Math.max(...racines.flatMap((r) => r.pts.map((p) => p.y))) - CENTRE_ARBRE.solY;
    expect(profondeur).toBeGreaterThan(200);
    expect(profondeur).toBeLessThan(CANEVAS.hauteur / 4);
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

  it("rattache les pétioles au bois plutôt qu'à des disques indépendants de la ramure", () => {
    const geometrie = construireGeometrieLunaire(branches(13));
    const feuilles = construireFeuillesLunaires(geometrie);
    for (const placee of geometrie.branches) {
      const supports = placee.rameaux.flatMap((r) => r.pts);
      for (const feuille of feuilles.get(placee.rang) ?? []) {
        const distance = Math.min(...supports.map((p) => Math.hypot(p.x - feuille.x, p.y - feuille.y)));
        expect(distance).toBeLessThanOrEqual(16);
      }
    }
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

describe("arbre céleste — états indépendants", () => {
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

  it("réserve l'aura à une déclaration de rayonnement, même face à une feuillaison complète", () => {
    expect(rayonnementDeBranche(branche(0, "feuillaison", 1))).toBe(false);
    expect(rayonnementDeBranche(branche(0, "feuillaison", 8))).toBe(false);
    expect(rayonnementDeBranche(branche(0, "rayonnement", 0))).toBe(true);
  });
});
