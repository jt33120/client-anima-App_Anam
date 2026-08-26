import { describe, it, expect } from "vitest";
import {
  placerBranches,
  CANEVAS,
  construireGeometrieLunaire,
} from "@/render/arbre/geometrie";
import type { BrancheProjetee } from "@/lib/scene/projection";

/**
 * Story 4.6 (T5) — le placement DÉTERMINISTE des branches (pur, testable sans navigateur). L'ordre vient de la
 * projection ; la position ne porte AUCUN sens (pas de taxonomie).
 *
 * RE-REVUE (HAUTE) — l'invariant qui manquait. L'ancien placement calculait `frac = i / (n - 1)` : la position
 * dépendait du NOMBRE TOTAL, donc chaque naissance DÉPLAÇAIT toutes les branches déjà nées (mesuré : 221 unités
 * de canevas quand la 2ᵉ branche arrive). DESIGN.md l'interdit mot pour mot — « une branche née reste née, même
 * place, même échelle […] rien ne se réorganise ». Et l'ancienne garde « est STABLE » comparait `placer(l)` à
 * `placer(l)` sur la MÊME liste : elle prouvait le déterminisme, jamais la PERMANENCE. C'est ce que le premier
 * test ci-dessous tient désormais.
 */

const br = (id: string, dateNaissance?: string): BrancheProjetee => ({
  id,
  etat: "naissance",
  intensite: 0,
  extraitSourceId: `s-${id}`,
  ...(dateNaissance === undefined ? {} : { dateNaissance }),
});
const liste = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    br(`b${i}`, new Date(Date.UTC(2026, 0, i + 1, 10)).toISOString()),
  );

describe("placerBranches — PERMANENCE : une branche née ne bouge plus jamais", () => {
  it("[HAUTE / DESIGN.md] la position d'une branche ne dépend QUE de son rang, jamais du nombre total", () => {
    const complet = placerBranches(liste(24));
    for (let n = 1; n <= 24; n++) {
      const partiel = placerBranches(liste(n));
      for (let i = 0; i < n; i++) {
        expect(partiel[i].x, `branche ${i} déplacée en x quand l'arbre passe à ${n} branches`).toBeCloseTo(complet[i].x, 9);
        expect(partiel[i].y, `branche ${i} déplacée en y quand l'arbre passe à ${n} branches`).toBeCloseTo(complet[i].y, 9);
        expect(partiel[i].accroche.x).toBeCloseTo(complet[i].accroche.x, 9);
        expect(partiel[i].accroche.y).toBeCloseTo(complet[i].accroche.y, 9);
      }
    }
  });

  it("la NAISSANCE d'une branche ne bouge aucune des précédentes (le cas vécu : 1 → 2 branches)", () => {
    const avant = placerBranches(liste(1));
    const apres = placerBranches(liste(2));
    const deplacement = Math.hypot(apres[0].x - avant[0].x, apres[0].y - avant[0].y);
    expect(deplacement, "l'arbre s'est réorganisé sous les yeux de l'utilisatrice").toBe(0);
  });

  it("est DÉTERMINISTE : deux appels sur la même liste donnent exactement les mêmes positions", () => {
    const l = liste(4);
    expect(placerBranches(l)).toEqual(placerBranches(l));
  });

  it("une permutation réseau des mêmes branches garde chaque identité à la même place", () => {
    const memesBranches = [
      br("meme-date-b", "2026-01-01T10:00:00.000Z"),
      br("sans-date-z"),
      br("recente", "2026-02-01T10:00:00.000Z"),
      br("invalide-a", "pas-une-date"),
      br("meme-date-a", "2026-01-01T10:00:00.000Z"),
      br("sans-date-a"),
    ];
    const positions = (entree: readonly BrancheProjetee[]) =>
      placerBranches(entree).map(({ branche, x, y, accroche }) => ({
        id: branche.id,
        x,
        y,
        accroche,
      }));
    const ordreReseau = memesBranches.map(({ id }) => id);
    const attendu = positions(memesBranches);

    expect(memesBranches.map(({ id }) => id), "la géométrie a muté la projection").toEqual(
      ordreReseau,
    );
    expect(attendu.map(({ id }) => id)).toEqual([
      "meme-date-a",
      "meme-date-b",
      "recente",
      "invalide-a",
      "sans-date-a",
      "sans-date-z",
    ]);
    expect(positions([...memesBranches].reverse())).toEqual(attendu);
    expect(positions([memesBranches[3], memesBranches[0], memesBranches[5], memesBranches[2], memesBranches[1], memesBranches[4]])).toEqual(attendu);
  });
});

describe("placerBranches — forme de l'éventail", () => {
  it("aucune branche → aucune position", () => {
    expect(placerBranches([])).toEqual([]);
  });

  it("une seule branche pousse au centre (droit vers le haut)", () => {
    const [p] = placerBranches([br("a")]);
    expect(Math.round(p.x)).toBe(CANEVAS.largeur / 2); // bulbe sommital du handoff
    expect(p.y).toBeLessThan(p.fourche.y); // vers le haut
  });

  it("le point d'accroche est SUR le bois, entre la fourche et l'extrémité", () => {
    for (const p of placerBranches(liste(8))) {
      const dFourche = Math.hypot(p.accroche.x - p.fourche.x, p.accroche.y - p.fourche.y);
      const dTotal = Math.hypot(p.x - p.fourche.x, p.y - p.fourche.y);
      expect(dFourche).toBeGreaterThan(0);
      expect(dFourche).toBeLessThan(dTotal);
    }
  });

  it("l'éventail reste DANS le canevas, quel que soit le nombre de branches", () => {
    for (const n of [1, 2, 3, 7, 15, 31, 60]) {
      for (const p of placerBranches(liste(n))) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(CANEVAS.largeur);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(CANEVAS.hauteur);
      }
    }
  });

  it("tous les points de bois — tronc, racines, branches et rameaux — restent finis dans le portrait", () => {
    const geometrie = construireGeometrieLunaire(liste(60));
    const segments = [
      ...geometrie.statiques,
      ...geometrie.branches.flatMap((branche) => [branche.principale, ...branche.rameaux]),
    ];

    expect(segments.length).toBeGreaterThan(geometrie.branches.length);
    for (const [index, segment] of segments.entries()) {
      expect(segment.pts.length, `segment vide ${index}`).toBeGreaterThan(1);
      for (const point of segment.pts) {
        expect(Number.isFinite(point.x), `x non fini au segment ${index}`).toBe(true);
        expect(Number.isFinite(point.y), `y non fini au segment ${index}`).toBe(true);
        expect(Number.isFinite(point.w), `largeur non finie au segment ${index}`).toBe(true);
        expect(point.x, `x hors portrait au segment ${index}`).toBeGreaterThanOrEqual(0);
        expect(point.x, `x hors portrait au segment ${index}`).toBeLessThanOrEqual(CANEVAS.largeur);
        expect(point.y, `y hors portrait au segment ${index}`).toBeGreaterThanOrEqual(0);
        expect(point.y, `y hors portrait au segment ${index}`).toBeLessThanOrEqual(CANEVAS.hauteur);
        expect(point.w, `largeur nulle au segment ${index}`).toBeGreaterThan(0);
      }
    }
  });

  it("les 13 places canoniques composent une couronne équilibrée autour de l'axe lunaire", () => {
    const places = placerBranches(liste(13));
    const axe = CANEVAS.largeur / 2;
    const gauche = places.filter((p) => p.x < axe - 1e-9).length;
    const droite = places.filter((p) => p.x > axe + 1e-9).length;
    const centre = places.filter((p) => Math.abs(p.x - axe) <= 1e-9).length;
    expect({ gauche, centre, droite }).toEqual({ gauche: 6, centre: 1, droite: 6 });
  });

  it("deux branches n'ont JAMAIS le même point d'accroche (une branche inatteignable serait perdue)", () => {
    for (const n of [2, 9, 20, 40]) {
      const acc = placerBranches(liste(n)).map((p) => `${p.accroche.x.toFixed(6)}|${p.accroche.y.toFixed(6)}`);
      expect(new Set(acc).size, `accroches confondues à ${n} branches`).toBe(n);
    }
  });

  it("la densification au-delà des 13 bulbes reste explicite, finie et sans branche silencieusement perdue", () => {
    for (const n of [14, 25, 40, 60]) {
      const places = placerBranches(liste(n));
      expect(places, `projection tronquée à ${n} branches`).toHaveLength(n);
      expect(Math.min(...places.map((p) => p.ecartVoisin)), `accroches confondues à ${n} branches`).toBeGreaterThan(0);
      expect(places.every((p) => Number.isFinite(p.ecartVoisin))).toBe(true);
    }
  });

  it("`ecartVoisin` dit la VÉRITÉ : c'est bien la distance à l'accroche la plus proche", () => {
    const places = placerBranches(liste(7));
    for (let i = 0; i < places.length; i++) {
      const attendu = Math.min(
        ...places.filter((_, j) => j !== i).map((q) => Math.hypot(places[i].accroche.x - q.accroche.x, places[i].accroche.y - q.accroche.y)),
      );
      expect(places[i].ecartVoisin).toBeCloseTo(attendu, 9);
    }
    expect(placerBranches(liste(1))[0].ecartVoisin, "une branche seule n'a pas de voisine").toBe(Infinity);
  });
});
