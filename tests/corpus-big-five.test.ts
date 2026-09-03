import { describe, it, expect } from "vitest";
import {
  CLES_BIG_FIVE,
  CORPUS_BIG_FIVE,
  POSITIONS,
  cleBigFive,
  lecturesDuResultat,
  texteDuFacteur,
} from "@/lib/corpus/big-five";
import { clesEcrites, clesNonEcrites } from "@/lib/corpus/port";
import { texteDeBase } from "@/lib/corpus/textes-de-base";
import { FACTEURS, type Facteur, type Position } from "@/lib/domain/big-five";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";

/**
 * corpus-big-five.test.ts — LES QUINZE LECTURES (2026-09-03, FR-054 · FR-031).
 *
 * ⚠️ LE PIÈGE LÉGUÉ PAR LA 5.5, ET IL S'APPLIQUE ICI MOT POUR MOT. Si les quinze créneaux étaient
 * tous `non_ecrit`, `texteDuFacteur("ouverture", "haut")` et `texteDuFacteur("stabilite", "bas")`
 * rendraient LA MÊME VALEUR : tout test de la forme « deux positions donnent des textes
 * différents » serait vrai d'une constante figée. La parade est la même — **asserter la CLÉ
 * demandée, jamais seulement le texte rendu**.
 *
 * ── ET UNE SECONDE FAMILLE, PROPRE À CE CORPUS ────────────────────────────────────────────────
 *
 * FR-031 ne vit pas que dans le calcul. `lib/domain/big-five.ts` a beau ne rendre que trois
 * énumérations, un texte qui dirait « plutôt haute, autour des trois quarts » reconstruirait la
 * jauge en prose, et aucune garde de domaine ne le verrait.
 */

const POSITIONS_ATTENDUES: readonly Position[] = ["bas", "median", "haut"];

describe("[LE CŒUR] la forme du corpus", () => {
  it("[CONTRÔLE DU CONTRÔLE] quinze créneaux DÉCLARÉS, pas zéro", () => {
    // Sans ce témoin, toutes les gardes d'absence ci-dessous seraient vraies d'un corpus vide.
    expect(FACTEURS).toHaveLength(5);
    expect([...POSITIONS]).toEqual(POSITIONS_ATTENDUES);
    expect(CLES_BIG_FIVE).toHaveLength(15);
    expect(Object.keys(CORPUS_BIG_FIVE.textes)).toHaveLength(15);
  });

  it("un créneau par couple (facteur, position), au format décidé en 5.2", () => {
    expect([...CLES_BIG_FIVE]).toEqual(
      FACTEURS.flatMap((f) => POSITIONS_ATTENDUES.map((p) => `big-five:${f}:${p}`)),
    );
  });

  it("chaque créneau est dans UN des deux états — jamais un trou", () => {
    const ecrites = clesEcrites(CORPUS_BIG_FIVE);
    const nonEcrites = clesNonEcrites(CORPUS_BIG_FIVE);
    expect(ecrites.length + nonEcrites.length, "un créneau n’est ni écrit ni non écrit").toBe(15);
    expect([...ecrites, ...nonEcrites].sort()).toEqual([...CLES_BIG_FIVE].sort());
  });

  it("le corpus et ses créneaux sont GELÉS", () => {
    expect(Object.isFrozen(CORPUS_BIG_FIVE)).toBe(true);
    expect(Object.isFrozen(CORPUS_BIG_FIVE.textes)).toBe(true);
  });

  it("l’identifiant nomme le corpus dans les inventaires", () => {
    expect(CORPUS_BIG_FIVE.identifiant).toBe("big-five");
  });
});

describe("[LE CŒUR] la clé demandée est la bonne, quel que soit le texte rendu", () => {
  it("`cleBigFive` compose le couple, dans cet ordre", () => {
    expect(cleBigFive("ouverture", "haut")).toBe("big-five:ouverture:haut");
    expect(cleBigFive("stabilite", "bas")).toBe("big-five:stabilite:bas");
  });

  it("[LE BORD] un facteur ou une position hors domaine JETTE", () => {
    // Une clé fabriquée hors domaine n'est pas une absence de texte : c'est un défaut de code, et
    // le rendre `non_ecrit` le déguiserait en travail d'écriture qui n'arriverait jamais.
    expect(() => cleBigFive("inconnu" as Facteur, "haut")).toThrow(/hors domaine/);
    expect(() => cleBigFive("ouverture", "tres_haut" as Position)).toThrow(/hors domaine/);
  });

  it("[LE CŒUR] les quinze textes sont DEUX À DEUX DISTINCTS", () => {
    // ⚠️ LA GARDE QUI TUE LA CONSTANTE FIGÉE. Elle ne vaut que parce que les quinze sont écrits ;
    // le jour où Anima en vide un, elle tombe, et c'est le bon moment pour la relire.
    const textes = CLES_BIG_FIVE.map((cle) => texteDeBase(cle));
    expect(textes.filter((t) => t !== undefined)).toHaveLength(15);
    expect(new Set(textes).size, "deux créneaux portent le même texte").toBe(15);
  });

  it("aucun texte n’entre AILLEURS que par la table de base", () => {
    // Anima retire une entrée de `textes-de-base.ts` et le créneau redevient `non_ecrit`. Un texte
    // écrit en dur dans `big-five.ts` lui échapperait : elle ne pourrait plus le reprendre.
    for (const cle of clesEcrites(CORPUS_BIG_FIVE)) {
      expect(texteDeBase(cle), `${cle} porte un texte qui ne vient PAS de la table de base`).toBeTruthy();
    }
  });
});

describe("[LE BORD] FR-031 tient jusque dans la prose", () => {
  const textes = CLES_BIG_FIVE.map((cle) => texteDeBase(cle) ?? "");

  it("aucun chiffre, aucun pourcentage, aucune fraction chiffrée", () => {
    // ⚠️ MUTATION-CIBLE : « tu es plutôt haute, autour de 70 % ». Le calcul ne rend que trois
    // énumérations ; la jauge que FR-031 refuse reviendrait par le texte, et la garde de domaine
    // (`tests/big-five.test.ts`) resterait verte, parce qu'elle ne regarde que le type de sortie.
    for (const texte of textes) {
      expect(texte, `un chiffre dans « ${texte.slice(0, 40)}… »`).not.toMatch(/[0-9]/);
      expect(texte).not.toContain("%");
    }
  });

  it("aucun texte ne se présente comme LA lecture", () => {
    // Cinq textes se lisent ensemble. « C'est ça, toi » serait faux par construction : chacun n'est
    // qu'un cinquième du résultat.
    for (const texte of textes) {
      expect(texte.toLowerCase()).not.toMatch(/c(?:’|')est (?:ça|cela), toi/);
    }
  });
});

describe("[LE BORD] la voix des quinze textes", () => {
  const textes = CLES_BIG_FIVE.map((cle) => texteDeBase(cle) ?? "");

  it("aucun lexique interdit, aucune prédiction", () => {
    for (const texte of textes) {
      expect(chercherInterdits(texte), `lexique : « ${texte.slice(0, 50)}… »`).toEqual([]);
      expect(chercherPredictions(texte), `prédiction : « ${texte.slice(0, 50)}… »`).toEqual([]);
    }
  });

  it("des apostrophes typographiques, aucun tiret cadratin, et de la concision", () => {
    for (const texte of textes) {
      expect(texte, texte.slice(0, 40)).not.toContain("'");
      expect(texte, texte.slice(0, 40)).not.toContain("—");
      // La consigne de concision du 2026-08-31, appliquée au même plafond que les 69 lectures.
      expect(texte.length, `trop long : ${texte.slice(0, 40)}…`).toBeLessThanOrEqual(360);
    }
  });

  it("[ANTI-VACUITÉ] les gardes de voix mordent vraiment", () => {
    expect(chercherInterdits("une thérapie pour ton anxiété")).not.toEqual([]);
    expect(chercherPredictions("tu verras que cela s’arrangera")).not.toEqual([]);
  });
});

describe("[LE BORD] la jonction avec le calcul", () => {
  const retenu = (positions: readonly Position[]) =>
    ({
      statut: "retenu" as const,
      facteurs: FACTEURS.map((facteur, i) => ({ facteur, position: positions[i] })),
    });

  it("un résultat retenu rend CINQ lectures, dans l’ordre du domaine", () => {
    const lectures = lecturesDuResultat(retenu(["bas", "median", "haut", "median", "bas"]));
    expect(lectures).not.toBeNull();
    expect(lectures!.map((l) => l.facteur)).toEqual([...FACTEURS]);
    expect(lectures!.map((l) => l.position)).toEqual(["bas", "median", "haut", "median", "bas"]);
    // La clé demandée, pas le texte rendu : c'est la parade léguée par la 5.5.
    expect(lectures![2].texte).toEqual(texteDuFacteur("extraversion", "haut"));
  });

  it("[LE CŒUR] un test qui n’a pas conclu ne rend PAS « texte non écrit »", () => {
    // ⚠️ LA TROISIÈME VALEUR. Le port ne connaît que `ecrit` et `non_ecrit` ; ici il faut distinguer
    // « Anima ne l'a pas encore écrit » de « il n'y a rien à écrire, le test n'a pas conclu ».
    // Les confondre promettrait un texte à venir à quelqu'un dont le questionnaire est resté ouvert.
    expect(lecturesDuResultat({ statut: "incomplet", manquants: ["b01"] })).toBeNull();
    expect(lecturesDuResultat({ statut: "indetermine", raison: "reponses_inconnues" })).toBeNull();
  });
});
