import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ALLURE_SECONDES,
  DUREE_MINUTES,
  ETAPES,
  assemblerAncrage,
  estDernier,
  estTraversable,
  etapeSuivante,
  type AncrageAssemble,
} from "@/lib/domain/ancrage";
import { CLES_ANCRAGE } from "@/lib/corpus/ancrage";
import { terme } from "@/lib/domain/vocabulaire";
import { ecrit, NON_ECRIT } from "@/lib/corpus/port";

/**
 * ancrage.test.ts — LA STRUCTURE FIXE ET SA PROGRESSION (Story 5.9, AC1/AC2).
 */

describe("[AC1] la séquence est fixe et ordonnée", () => {
  it("les cinq temps sont déclarés dans l'ordre", () => {
    expect([...ETAPES]).toEqual(["arrivee", "souffle", "corps", "nommer", "retour"]);
  });

  it("la séquence est GELÉE — personne ne peut y ajouter un temps à l'exécution", () => {
    expect(Object.isFrozen(ETAPES)).toBe(true);
    expect(() => (ETAPES as string[]).push("bonus")).toThrow();
  });

  it("chaque ancrage assemblé porte un titre et exactement les cinq temps, dans l'ordre", () => {
    for (const cle of CLES_ANCRAGE) {
      const a = assemblerAncrage(cle);
      expect(a.cle).toBe(cle);
      expect(a.titre).toBeTruthy();
      expect(a.temps.map((t) => t.etape)).toEqual([...ETAPES]);
    }
  });

  it("une clé d'ancrage inventée JETTE — un exercice inconnu n'est pas un exercice vide", () => {
    expect(() => assemblerAncrage("ancrage-99")).toThrow(/créneau non déclaré/);
  });
});

describe("[AC2] la durée impliquée tombe dans la fourchette que le format se donne", () => {
  it("la fourchette vient de `vocabulaire.ts`, source unique", () => {
    expect(terme("ancrage").dureeMinutes).toEqual([2, 5]);
  });

  it("cinq temps à l'allure déclarée font une durée dans [2, 5] minutes", () => {
    const [min, max] = terme("ancrage").dureeMinutes!;
    expect(DUREE_MINUTES).toBe((ETAPES.length * ALLURE_SECONDES) / 60);
    expect(DUREE_MINUTES).toBeGreaterThanOrEqual(min);
    expect(DUREE_MINUTES).toBeLessThanOrEqual(max);
  });

  /**
   * ⚠️ LA GARDE NON VACUE. Sans ce test, l'assertion du module serait vraie « par chance » : les
   * valeurs d'aujourd'hui passent, et rien ne prouverait qu'une valeur fautive serait refusée.
   *
   * On refait ici le calcul EXACT du module sur des valeurs hors bornes. C'est une reproduction, pas
   * un appel — le module s'auto-vérifie au CHARGEMENT, donc on ne peut pas lui repasser d'autres
   * valeurs sans le recharger. La correspondance entre les deux formes est tenue par le test
   * ci-dessus (`DUREE_MINUTES` = le même calcul) et par la lecture de source ci-dessous.
   */
  it("des valeurs hors bornes SERAIENT refusées", () => {
    const [min, max] = terme("ancrage").dureeMinutes!;
    const minutes = (n: number, allure: number) => (n * allure) / 60;
    expect(minutes(2, 40) < min).toBe(true); // trop court : ce n'est plus un exercice
    expect(minutes(12, 40) > max).toBe(true); // trop long : c'est devenu un rituel
  });

  it("l'assertion vit bien AU CHARGEMENT du module, pas seulement dans ce fichier", () => {
    // Le mutant naturel est de déplacer la vérification dans un test : elle deviendrait alors
    // contournable en production. On lit la source pour l'interdire.
    const src = readFileSync(resolve(process.cwd(), "lib/domain/ancrage.ts"), "utf-8");
    expect(src).toMatch(/if \(MINUTES < FOURCHETTE\[0\] \|\| MINUTES > FOURCHETTE\[1\]\)/);
    expect(src).toMatch(/throw new Error\(/);
  });
});

describe("[AC1] la progression est pure et bornée", () => {
  it("avance d'un cran", () => {
    expect(etapeSuivante(0, 5)).toBe(1);
    expect(etapeSuivante(3, 5)).toBe(4);
  });

  it("ne DÉPASSE jamais le dernier temps", () => {
    expect(etapeSuivante(4, 5)).toBe(4);
    expect(etapeSuivante(9, 5)).toBe(4);
  });

  it("ne BOUCLE pas — un ancrage qui recommence tout seul est un ancrage dont on ne sort pas", () => {
    expect(etapeSuivante(4, 5)).not.toBe(0);
  });

  it("un indice négatif ou un total vide ne fabriquent pas d'indice absurde", () => {
    expect(etapeSuivante(-3, 5)).toBe(0);
    expect(etapeSuivante(0, 0)).toBe(0);
  });

  it("`estDernier` désigne le dernier, et lui seul", () => {
    expect(estDernier(4, 5)).toBe(true);
    expect(estDernier(3, 5)).toBe(false);
    expect(estDernier(0, 1)).toBe(true);
  });
});

describe("[AC6] un exercice à trous n'est pas traversable", () => {
  const complet: AncrageAssemble = {
    cle: "faux",
    titre: ecrit("Un titre"),
    temps: ETAPES.map((etape) => ({ etape, texte: ecrit(`temps ${etape}`) })),
  };

  it("tous les temps écrits + le titre écrit ⇒ traversable", () => {
    expect(estTraversable(complet)).toBe(true);
  });

  it("UN SEUL temps non écrit suffit à disqualifier", () => {
    const troue = { ...complet, temps: complet.temps.map((t, i) => (i === 2 ? { ...t, texte: NON_ECRIT } : t)) };
    expect(estTraversable(troue)).toBe(false);
  });

  it("un titre non écrit disqualifie aussi — un exercice sans nom ne se choisit pas", () => {
    expect(estTraversable({ ...complet, titre: NON_ECRIT })).toBe(false);
  });

  it("[LE CŒUR] un ancrage RÉEL est traversable si et seulement si TOUS ses créneaux sont écrits", () => {
    // ⚠️ CETTE GARDE DISAIT « aucun n'est traversable en v1 ». C'était vrai le jour où elle a été
    // écrite, et ce n'était pas une propriété : c'était une PHOTO du corpus vide. Le 2026-08-24 les
    // 24 créneaux ont été écrits, et la garde est devenue fausse — sans qu'aucune règle n'ait bougé.
    //
    // La règle, elle, n'a jamais changé : un exercice se traverse quand rien n'y manque. On la
    // mesure donc contre les VRAIS ancrages, ce qui tient que le corpus soit vide, plein, ou
    // à moitié réécrit par Anima. Le mensonge qu'elle empêche est le seul qui compte ici : proposer
    // un exercice de respiration guidée à quelqu'un, et le laisser en plan au troisième temps.
    for (const cle of CLES_ANCRAGE) {
      const a = assemblerAncrage(cle);
      const rienNeManque =
        a.titre.statut === "ecrit" && a.temps.every((t) => t.texte.statut === "ecrit");
      expect(
        estTraversable(a),
        rienNeManque
          ? `${cle} : tout est écrit, et pourtant il se refuse`
          : `${cle} : il se propose alors qu'il lui manque un texte`,
      ).toBe(rienNeManque);
    }
  });

  it("[ANTI-VACUITÉ] le corpus réel n'est pas vide — sinon le test ci-dessus ne prouve rien", () => {
    // Sans cette ligne, un corpus entièrement vidé rendrait `rienNeManque` faux partout et la garde
    // passerait en vérifiant seulement que rien ne se propose. C'est le piège exact qu'elle vient de
    // quitter, à l'envers.
    const ecrits = CLES_ANCRAGE.map(assemblerAncrage).filter(
      (a) => a.titre.statut === "ecrit" && a.temps.every((t) => t.texte.statut === "ecrit"),
    );
    expect(ecrits.length, "plus un seul ancrage complet : la garde ci-dessus tourne à vide").toBeGreaterThan(0);
  });
});
