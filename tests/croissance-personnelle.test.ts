import { describe, expect, it } from "vitest";
import { indexCroissancePersonnelle } from "@/render/arbre/croissance-personnelle";
import type { BrancheProjetee } from "@/lib/scene/projection";

type Branche = Pick<BrancheProjetee, "id" | "etat" | "intensite">;
const branche = (id: string, intensite = 0, etat: Branche["etat"] = intensite > 0 ? "feuillaison" : "naissance"): Branche =>
  ({ id, etat, intensite });
const jeunes = (nombre: number) => Array.from({ length: nombre }, (_, index) => branche(`jeune-${index}`));

describe("croissance personnelle — choix de dessin depuis les branches réelles", () => {
  it("conserve graine, éclosion, racines et pousse aux quatre premiers indices", () => {
    expect(indexCroissancePersonnelle([])).toBe(0);
    expect(indexCroissancePersonnelle([branche("a")])).toBe(1);
    expect(indexCroissancePersonnelle([branche("a", 0.1)])).toBe(2);
    expect(indexCroissancePersonnelle([branche("a", 0.2)])).toBe(3);
  });

  it("additionne la matière vécue sans diluer une branche quand une autre naît", () => {
    const premiere = [branche("a", 1)];
    expect(indexCroissancePersonnelle(premiere)).toBe(11);
    expect(indexCroissancePersonnelle([...premiere, branche("b")])).toBe(12);
    expect(indexCroissancePersonnelle([...premiere, branche("b", 1)])).toBe(22);
    expect(indexCroissancePersonnelle([...premiere, branche("b", 1), branche("c")])).toBe(23);
  });

  it("une naissance ignore une intensité incohérente et seul rayonnement autorise la lumière", () => {
    expect(indexCroissancePersonnelle([branche("a", 1, "naissance")])).toBe(1);
    expect(indexCroissancePersonnelle(Array.from({ length: 40 }, (_, i) => branche(`b-${i}`, 1)))).toBe(23);
    expect(indexCroissancePersonnelle([branche("a", 0, "rayonnement")])).toBe(1);
    expect(indexCroissancePersonnelle([...jeunes(22), branche("a", 0, "rayonnement")])).toBe(24);
  });

  it("conserve les huit nuances lumineuses existantes aux mêmes indices", () => {
    for (let compte = 0; compte <= 8; compte++) {
      const rayonnantes = Array.from({ length: compte }, (_, i) => branche(`r-${i}`, 0, "rayonnement"));
      expect(indexCroissancePersonnelle([...jeunes(23), ...rayonnantes])).toBe(23 + compte);
    }
  });

  it("ajoute les trois états célestes avec neuf, dix et onze branches rayonnantes, puis reste au dernier dessin", () => {
    for (let compte = 9; compte <= 15; compte++) {
      const rayonnantes = Array.from({ length: compte }, (_, i) => branche(`r-${i}`, 1, "rayonnement"));
      expect(indexCroissancePersonnelle(rayonnantes)).toBe(23 + Math.min(11, compte));
    }
  });

  it("fusionne les doublons par maximum sans multiplier matière ou rayonnement", () => {
    const doublons = [branche("a", 0.2), branche("a", 0.7), branche("a", 0, "rayonnement")];
    expect(indexCroissancePersonnelle(doublons)).toBe(8);
    expect(indexCroissancePersonnelle([...doublons].reverse())).toBe(8);
    expect(indexCroissancePersonnelle([...jeunes(23), ...doublons, ...doublons])).toBe(24);
  });

  it("borne les valeurs invalides sans fabriquer une croissance", () => {
    for (const intensite of [NaN, Infinity, -Infinity, -1]) {
      expect(indexCroissancePersonnelle([branche("a", intensite, "feuillaison")])).toBe(1);
    }
    expect(indexCroissancePersonnelle([branche("a", 12)])).toBe(11);
    expect(indexCroissancePersonnelle([branche("", 1), branche("  ", 1)])).toBe(0);
    expect(indexCroissancePersonnelle([branche("a", 1, "inconnu" as Branche["etat"])])).toBe(0);
    expect(indexCroissancePersonnelle([branche("a", 0.6), branche("a", NaN, "feuillaison")])).toBe(7);
  });

  it("quantifie les dixièmes sans compter un arrondi SQL comme une étape manquante", () => {
    for (let dixieme = 0; dixieme <= 10; dixieme++) {
      expect(indexCroissancePersonnelle([branche("a", Math.fround(dixieme / 10), "feuillaison")])).toBe(1 + dixieme);
    }
    expect(indexCroissancePersonnelle([branche("a", 0.299)])).toBe(3);
  });

  it("ne régresse jamais lors de l’avancée ou de l’ajout d’une branche", () => {
    for (let nombre = 0; nombre <= 30; nombre++) {
      const fond = jeunes(nombre);
      let precedent = indexCroissancePersonnelle(fond);
      for (let dixieme = 0; dixieme <= 10; dixieme++) {
        const courantes = [...fond, branche("active", dixieme / 10, "feuillaison")];
        const suivant = indexCroissancePersonnelle(courantes);
        expect(suivant).toBeGreaterThanOrEqual(precedent);
        expect(indexCroissancePersonnelle([...courantes, branche("nouvelle")])).toBeGreaterThanOrEqual(suivant);
        expect(indexCroissancePersonnelle([...fond, branche("active", dixieme / 10, "rayonnement")])).toBeGreaterThanOrEqual(suivant);
        precedent = suivant;
      }
    }
  });

  it("ne modifie ni les branches ni leur ordre et ne dépend pas de leurs textes ou dates", () => {
    const personnelles = Object.freeze([
      Object.freeze({ ...branche("b", 0.6), nom: "Un nom", dateNaissance: "2026-09-07T09:00:00Z" }),
      Object.freeze({ ...branche("a", 0.2), nom: "Un autre", dateNaissance: "2025-01-01T00:00:00Z" }),
    ]);
    const avant = JSON.stringify(personnelles);
    expect(indexCroissancePersonnelle(personnelles)).toBe(10);
    expect(indexCroissancePersonnelle([...personnelles].reverse())).toBe(10);
    expect(JSON.stringify(personnelles)).toBe(avant);
  });
});
