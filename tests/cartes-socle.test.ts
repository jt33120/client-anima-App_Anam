import { describe, it, expect } from "vitest";
import {
  carteEnneagramme,
  carteHoroscope,
  carteMantra,
} from "@/lib/domain/cartes-socle";
import { estPresentable, CATALOGUE_CARTES } from "@/lib/domain/bibliotheque";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";
import { chercherConfusionVocabulaire } from "@/lib/domain/vocabulaire";
import { ecrit, NON_ECRIT } from "@/lib/corpus/port";

/**
 * cartes-socle.test.ts — LES CINQ CARTES DANS LEURS CAS RÉELS (Story 5.6, T5/T6).
 *
 * ⚠️ LE CAS « DÉGRADÉ » EST LE CAS NORMAL. 165 créneaux de corpus déclarés, 0 écrit : deux cartes
 * sur cinq n'ont rien à montrer aujourd'hui, et les trois autres montrent des faits sans
 * interprétation. Ces tests décrivent donc le produit tel qu'il est, pas tel qu'il sera.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Harnais
// ══════════════════════════════════════════════════════════════════════════════════════════════



// ══════════════════════════════════════════════════════════════════════════════════════════════
// AC6 — aucun degré quand l'heure manque
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ TROIS BLOCS ONT ÉTÉ RETIRÉS D'ICI LE 2026-08-25 (Story 7.7), ET LEURS INVARIANTS N'ONT PAS
 * DISPARU AVEC EUX — ils ont déménagé, et c'est la seule raison acceptable de retirer un test.
 *
 *   • « sous `midi_par_defaut`, aucun degré » → `tests/fiche-socle.test.ts`, « le degré n'est rendu
 *     QUE sous `heure_connue` ». Prouvé sur les DIX corps au lieu de cinq.
 *   • « les nombres : ce qui manque est ABSENT » → `tests/fiche-socle.test.ts`, et la règle a
 *     CHANGÉ en mieux : une absence n'est plus silencieuse, elle DIT sa raison et porte le lien
 *     qui la répare (FR-050).
 *   • la carte du thème et celle des nombres n'existent plus : elles ont quitté l'accueil pour la
 *     halte « Ton socle », qui rend le socle en entier — six textes au lieu d'un.
 *
 * Retirer un test parce qu'il rougit est une faute ; le retirer parce que son sujet a bougé, en
 * nommant où il est parti, est la seule façon de ne pas empiler des gardes sur du vide.
 */

describe("[5.6/AC5] les deux cartes structurellement vides le sont, et le disent", () => {
  it("le mantra n'a AUCUN fait — il est son texte, et son texte n'est pas écrit", () => {
    const c = carteMantra(NON_ECRIT);
    expect(c.faits).toEqual([]);
    expect(c.texte.statut).toBe("non_ecrit");
    expect(estPresentable(c), "une carte muette ne peut pas être mise en avant").toBe(false);
  });

  it("le mantra devient présentable le jour où Anima écrit — sans changer une ligne de code", () => {
    expect(estPresentable(carteMantra(ecrit("Aujourd'hui, remarque ce qui tient.")))).toBe(true);
  });

  it("l'horoscope calculé n'expose JAMAIS ses clés de corpus comme des faits", () => {
    // Le mode d'échec réel : afficher « lune:3 » sur une carte d'accueil parce que c'est ce que le
    // calcul rend. Les clés servent à CHOISIR un texte, elles ne sont pas du texte.
    const c = carteHoroscope({
      jour: { a: 2026, m: 8, j: 13 },
      ciel: {} as never,
      configurations: [],
      luneRelative: { distance: 3 } as never,
    });
    expect(c.faits).toEqual([]);
    expect(JSON.stringify(c)).not.toMatch(/lune:|configuration:/);
  });

  it("un horoscope indisponible ne fabrique pas de texte de repli", () => {
    const c = carteHoroscope(null);
    expect(c.texte).toEqual(NON_ECRIT);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les nombres et l'ennéagramme — des chiffres qui ne sont pas des mesures
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.6] l'ennéagramme : « sans type » n'est pas un incident", () => {
  it("un type retenu donne un fait, et le texte vient de la 5.5", () => {
    const c = carteEnneagramme(4, NON_ECRIT);
    expect(c.faits).toEqual([{ intitule: "Type", valeur: "4" }]);
    expect(c.texte.statut).toBe("non_ecrit");
    expect(estPresentable(c), "un fait suffit à être présentable").toBe(true);
  });

  it("`sans_type` est l'état de départ de tout le monde — carte muette, pas message d'erreur", () => {
    const c = carteEnneagramme(null, NON_ECRIT);
    expect(c.faits).toEqual([]);
    expect(JSON.stringify(c)).not.toMatch(/erreur|panne|impossible/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les contrôles transverses sur ce que les cartes écrivent
// ══════════════════════════════════════════════════════════════════════════════════════════════

describe("[5.6] tout ce que les cartes écrivent passe les contrôles bloquants", () => {
  const toutes = [carteMantra(NON_ECRIT), carteHoroscope(null), carteEnneagramme(4, NON_ECRIT)];

  it("[CONTRÔLE DU CONTRÔLE] toutes les cartes du catalogue sont construites ici", () => {
    // ⚠️ ON COMPARE AU CATALOGUE, PAS À UN NOMBRE ÉCRIT À LA MAIN. Un compte en dur (« cinq »)
    // devient faux le jour où une carte part — c'est exactement ce qui vient d'arriver — et il
    // devient MUET le jour où une carte arrive sans passer par ce contrôle de voix.
    expect(toutes.map((c) => c.cle).sort()).toEqual([...CATALOGUE_CARTES].sort());
  });

  it("[FR-023 / NFR-008] aucun titre, aucun intitulé ne porte un interdit", () => {
    for (const c of toutes) {
      const mots = [c.titre, ...c.faits.flatMap((f) => [f.intitule, f.valeur])];
      for (const m of mots) {
        expect(chercherInterdits(m), `lexique interdit dans « ${m} »`).toEqual([]);
      }
    }
  });

  it("[FR-053] aucune prédiction n'entre par un libellé du socle", () => {
    for (const c of toutes) {
      const mots = [c.titre, ...c.faits.flatMap((f) => [f.intitule, f.valeur])];
      for (const m of mots) {
        expect(chercherPredictions(m), `prédiction dans « ${m} »`).toEqual([]);
      }
    }
  });

  it("[FR-080] une carte qui porte un terme ne nomme pas les deux autres", () => {
    for (const c of toutes) {
      if (c.terme === null) continue;
      expect(
        chercherConfusionVocabulaire(c.titre, c.terme),
        `« ${c.titre} » nomme un autre format que « ${c.terme} »`,
      ).toEqual([]);
    }
    // Contrôle positif : au moins une carte porte bien un terme, sinon la boucle serait vide.
    expect(toutes.filter((c) => c.terme !== null)).toHaveLength(1);
  });
});
