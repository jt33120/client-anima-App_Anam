import { describe, it, expect } from "vitest";
import { consignePhaseArc, consignePhaseDuTour } from "@/lib/domain/consigne-phase";
import type { Phase } from "@/lib/domain/arc-seance";

/**
 * consigne-phase.test.ts — CE QU'ANAM DOIT FAIRE, PHASE PAR PHASE.
 *
 * ⚠️ CE FICHIER N'EXISTAIT PAS, ET C'EST CE QUI A LAISSÉ PASSER LE DÉFAUT LE PLUS COÛTEUX DU
 * PRODUIT. `consigne-phase.ts` vivait sans une seule garde. Sa phase `construire` valait `null` —
 * c'est-à-dire qu'au début de CHAQUE séance, et pendant la TOTALITÉ d'une première fois, le modèle
 * ne recevait aucune instruction sur ce qu'il est censé faire. Retour d'usage du 2026-08-25 :
 * « ça fait vraiment juste parler à ChatGPT ». C'était exact, et personne ne pouvait le voir venir.
 *
 * Ce que ces gardes tiennent vient de la recherche (docs/trame-anam.md) : l'ordre des temps de
 * l'entretien motivationnel, l'interdit de planifier avant qu'on le demande, et le fait que le mot
 * qui agit est celui de la personne — pas celui d'Anam.
 */

const PHASES: Phase[] = ["construire", "observer", "nommer", "clore"];
const texte = (p: Phase) => consignePhaseArc(p)?.content ?? "";

describe("[LE TROU QUI EST REFERMÉ] chaque phase dit ce qu'elle attend", () => {
  it("[LE CŒUR] `construire` N'EST PLUS MUETTE — c'est tout le correctif du 2026-08-25", () => {
    // La phase la plus fréquente du produit était la seule sans consigne. Un modèle sans direction
    // sur un écran d'accueil produit un assistant : il attend une demande et il la traite.
    const c = consignePhaseArc("construire");
    expect(c, "`construire` est redevenue muette").not.toBeNull();
    expect(c!.role).toBe("system");
    expect(c!.content.length, "une consigne d'une ligne ne dirige rien").toBeGreaterThan(300);
  });

  it("toutes les phases portent une consigne — aucune n'est laissée au hasard", () => {
    for (const p of PHASES) {
      expect(consignePhaseArc(p), `${p} est muette`).not.toBeNull();
    }
  });
});

describe("[L'ORDRE DES TEMPS] on n'accueille pas en interprétant", () => {
  it("[LE CŒUR] `construire` cherche LE DÉCLENCHEUR — la question la plus rentable de la séance", () => {
    // Le facteur PRÉCIPITANT : pourquoi ce soir-là plutôt qu'un autre. Posé plus tard, on a déjà
    // commencé à interpréter sans savoir de quoi. C'est la question que le produit ne posait pas.
    expect(texte("construire")).toMatch(/juste avant|pourquoi ce soir|pourquoi maintenant/i);
  });

  it("`construire` accuse réception AVANT de questionner", () => {
    expect(texte("construire")).toMatch(/accuse réception/i);
  });

  it("`construire` n'interprète pas et ne reformule pas encore", () => {
    // L'engagement d'abord : « rien d'autre ne peut arriver tant qu'il n'est pas là ».
    expect(texte("construire")).toMatch(/n’interprètes rien|ne relies rien/i);
    expect(texte("construire")).toMatch(/ne reformules pas encore/i);
  });

  it("[FR-005, ANTI-RÉGRESSION] `observer` refuse toujours de nommer", () => {
    // L'invariant d'origine du fichier. Une observation prématurée est un défaut, pas une variation.
    expect(texte("observer")).toMatch(/NE DÉLIVRE PAS/);
    expect(texte("observer")).toMatch(/tu ne nommes pas/i);
  });
});

describe("[PLANIFIER NE S'OUVRE QUE SI ELLE LE DEMANDE]", () => {
  it("[LE CŒUR] ni `construire` ni `observer` n'autorisent à proposer un geste", () => {
    // Des quatre temps de l'entretien motivationnel, planifier est le SEUL facultatif : il ne
    // s'ouvre que lorsque la personne signale qu'elle veut quelque chose. C'est la règle qu'on
    // enfreint le plus volontiers, parce qu'enfreindre donne l'impression d'être utile.
    for (const p of ["construire", "observer"] as const) {
      expect(texte(p), `${p} laisse proposer`).toMatch(
        /aucun geste|ne proposes\s+AUCUN|aucun conseil/i,
      );
    }
  });

  it("[ANTI-VACUITÉ] aucune phase ne s'appelle « proposer » — le produit n'en a pas", () => {
    // Si une cinquième phase apparaissait, cette garde tomberait, et c'est voulu : ce serait une
    // décision de produit, pas un ajout de consigne.
    expect(PHASES).not.toContain("proposer");
  });
});

describe("[LE MOT EST LE SIEN] nommer, c'est la faire nommer", () => {
  it("[LE CŒUR] `nommer` rend le mot à l'utilisatrice au lieu de le fournir", () => {
    // Mettre un affect en mots diminue la réponse de l'amygdale (Lieberman, UCLA). Ce qui agit,
    // c'est qu'ELLE mette le mot — pas qu'Anam trouve le bon. La nuance décide de qui parle.
    const t = texte("nommer");
    expect(t).toMatch(/LE MOT QUI COMPTE EST LE SIEN|tu appellerais ça comment/i);
    expect(t, "un mot bancal d'elle vaut mieux qu'un mot juste d'Anam").toMatch(/bancal/i);
  });

  it("`nommer` ne félicite ni ne conclut", () => {
    expect(texte("nommer")).toMatch(/ne félicites pas/i);
  });
});

describe("[LA FORME] ce qui vaut pour toutes les consignes", () => {
  it("[NÉ D'UNE GARDE ROUGE] aucun emoji dans une consigne — il ressortirait dans sa bouche", () => {
    // ⚠️ ATTRAPÉ PAR `lexique-voix` À L'ÉCRITURE : un « ⚠️ » avait été posé DANS la chaîne de
    // `nommer`, pas dans un commentaire. La voix interdit tout emoji à Anam ; un emoji dans une
    // consigne est un emoji qu'on lui montre en exemple.
    for (const p of PHASES) {
      expect(texte(p), `${p} contient un emoji`).not.toMatch(
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u,
      );
    }
  });

  it("aucune consigne ne vouvoie — elles se recopient dans sa voix", () => {
    for (const p of PHASES) {
      expect(texte(p), `${p} vouvoie`).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
    }
  });

  it("chaque consigne se déclare PROVISOIRE — la porte pré-lancement est visible", () => {
    // Même porte que le protocole de détresse : la trame emprunte à l'entretien motivationnel et à
    // la formulation de cas, elle doit être relue par un professionnel qualifié.
    for (const p of PHASES) {
      expect(texte(p), `${p} ne se déclare plus provisoire`).toMatch(/PROVISOIRE/);
    }
  });
});

describe("[ANTI-RÉGRESSION] `clore` ne vaut que pour LE tour qui clôt", () => {
  // Le défaut de la revue des Epics 1 à 4 : `clore` est terminal, donc la consigne partait à chaque
  // tour, et un mois plus tard Anam répondait « on en a assez fait pour ce soir » au premier
  // message de la journée.
  const arc = (phase: Phase, beat: "nommer" | "cloture" | null) => ({ etat: { phase }, beat });

  it("hors `clore`, la consigne de la phase courante part", () => {
    expect(consignePhaseDuTour(arc("observer", null), true)).not.toBeNull();
  });

  it("en `clore` SANS le beat, rien ne part", () => {
    expect(consignePhaseDuTour(arc("clore", null), true)).toBeNull();
  });

  it("en `clore` AVEC le beat, la consigne de clôture part", () => {
    expect(consignePhaseDuTour(arc("clore", "cloture"), true)?.content).toMatch(/clos la séance/i);
  });

  it("[AD-9] en détresse, la clôture est refusée même avec le beat", () => {
    // La séance CESSE d'être une séance : le protocole prend le relais, rien ne clôt.
    expect(consignePhaseDuTour(arc("clore", "cloture"), false)).toBeNull();
  });
});
