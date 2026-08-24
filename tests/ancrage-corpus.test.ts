import { describe, it, expect } from "vitest";
import { ANCRAGES, CLES_ANCRAGE, cleEtape, cleTitre } from "@/lib/corpus/ancrage";
import { clesEcrites, clesNonEcrites, corpus, ecrit, NON_ECRIT, textesEcrits } from "@/lib/corpus/port";
import { ETAPES } from "@/lib/domain/ancrage";
import { chercherConfusionVocabulaire } from "@/lib/domain/vocabulaire";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import * as copie from "@/lib/domain/copie-ancrage";

/**
 * ancrage-corpus.test.ts — LES CRÉNEAUX, ET LE VOCABULAIRE (Story 5.9, AC5/AC6/AC7).
 */

import { texteDeBase } from "@/lib/corpus/textes-de-base";

describe("[AC6] les 24 créneaux sont déclarés, et aucun n'est écrit", () => {
  it("4 ancrages × (1 titre + 5 temps) = 24 créneaux", () => {
    expect(CLES_ANCRAGE.length).toBe(4);
    expect(Object.keys(ANCRAGES.textes).length).toBe(4 * (1 + ETAPES.length));
    expect(Object.keys(ANCRAGES.textes).length).toBe(24);
  });

  it("chaque ancrage a son titre ET un créneau par temps du DOMAINE", () => {
    // C'est ce test qui empêche la séquence de se dédoubler : le corpus recopie les cinq chaînes
    // pour éviter un cycle d'import, et on vérifie ici qu'elles coïncident avec `ETAPES`.
    for (const cle of CLES_ANCRAGE) {
      expect(Object.hasOwn(ANCRAGES.textes, cleTitre(cle))).toBe(true);
      for (const etape of ETAPES) {
        expect(Object.hasOwn(ANCRAGES.textes, cleEtape(cle, etape))).toBe(true);
      }
    }
  });

  it("tout créneau écrit vient de la TABLE DE BASE, jamais du fichier", () => {
    // ⚠️ CE TEST EXIGEAIT LE VIDE (FR-054 + FR-086 : Anima seule écrit). Julian a tranché le
    // 2026-08-23 : les textes de base existent, elle corrigera. Ce qui reste gardé, et qui compte
    // autant, c'est qu'aucun texte n'entre AILLEURS que par la table qu'elle peut vider.
    expect(clesEcrites(ANCRAGES).length + clesNonEcrites(ANCRAGES).length).toBe(24);
    for (const cle of clesEcrites(ANCRAGES)) {
      expect(texteDeBase(cle), `${cle} hors de la table de base`).toBeDefined();
    }
  });

  it("la table est GELÉE — aucun module ne peut y déposer un texte sans auteur", () => {
    expect(Object.isFrozen(ANCRAGES.textes)).toBe(true);
    expect(() => {
      (ANCRAGES.textes as Record<string, unknown>)["ancrage-1:titre"] = ecrit("piraté");
    }).toThrow();
  });
});

describe("[AC5] le vocabulaire ne se confond jamais (FR-080)", () => {
  const textes = Object.entries(copie)
    .filter(([, v]) => typeof v === "string")
    .map(([k, v]) => [k, v as string] as const);

  it("la copie est bien découverte — la garde n'est pas vide", () => {
    expect(textes.length).toBeGreaterThanOrEqual(7);
  });

  it("aucun texte présenté sous « ancrage » ne nomme l'un des DEUX AUTRES formats", () => {
    for (const [nom, texte] of textes) {
      expect(chercherConfusionVocabulaire(texte, "ancrage"), `copie-ancrage.${nom}`).toEqual([]);
    }
  });

  /**
   * ⚠️ GARDE NON VACUE, sur un faux corpus fautif. Sans elle, le test ci-dessus serait vert même si
   * `chercherConfusionVocabulaire` rendait toujours `[]`.
   */
  it("une phrase fautive SERAIT attrapée", () => {
    expect(chercherConfusionVocabulaire("Ton mantra du jour t'attend.", "ancrage")).toContain("mantra");
    expect(chercherConfusionVocabulaire("Reprends ta lecture.", "ancrage")).toContain("lecture");
  });

  it("les créneaux du corpus, le jour où Anima les écrira, passeront la même garde", () => {
    // ⚠️ CE COMMENTAIRE DISAIT « aujourd'hui `textesEcrits` est vide, le test serait vacuement
    // vrai ». Ce n'est plus le cas depuis le 2026-08-23 : les 24 créneaux portent un texte, et le
    // balayage du vrai corpus mord pour de bon. On garde quand même la preuve sur un faux corpus —
    // elle prouve que le balayage TROUVE, là où le vrai prouve qu'il n'y a rien à trouver.
    const faux = corpus("faux-ancrages", {
      "a:titre": ecrit("Le mantra du matin"),
      "a:arrivee": NON_ECRIT,
    });
    const fautifs = textesEcrits(faux).flatMap((t) => chercherConfusionVocabulaire(t, "ancrage"));
    expect(fautifs).toContain("mantra");
    // Et le vrai corpus, lui, n'a rien à redire — vérifié texte par texte, désormais.
    for (const t of textesEcrits(ANCRAGES)) {
      expect(chercherConfusionVocabulaire(t, "ancrage"), t).toEqual([]);
    }
  });
});

describe("[AC5] FR-023 — le mot proscrit n'apparaît nulle part", () => {
  it("aucun texte de la copie ne porte le lexique interdit", () => {
    for (const [nom, valeur] of Object.entries(copie)) {
      if (typeof valeur !== "string") continue;
      expect(chercherInterdits(valeur), `copie-ancrage.${nom}`).toEqual([]);
    }
  });

  /**
   * ⚠️ CETTE GARDE ET CELLE DU VOCABULAIRE NE SE COUVRENT PAS. La première refuse un mot interdit
   * PARTOUT, la seconde refuse un mot parfaitement licite ailleurs mais fautif ici. Les viser
   * séparément est ce qui fait mourir les deux mutants.
   */
  it("un texte fautif SERAIT attrapé", () => {
    expect(chercherInterdits("Un soin pour aujourd’hui").length).toBeGreaterThan(0);
  });
});

describe("[AC7] rien ne promet la variante audio", () => {
  it("aucune copie ne parle d'audio, de voix enregistrée ni de « bientôt »", () => {
    for (const [nom, valeur] of Object.entries(copie)) {
      if (typeof valeur !== "string") continue;
      expect(valeur, `copie-ancrage.${nom}`).not.toMatch(/audio|écoute[rz]?\b|bientôt|prochainement/i);
    }
  });
});
