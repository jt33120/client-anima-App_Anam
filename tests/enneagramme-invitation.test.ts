import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { carteEnneagramme } from "@/lib/domain/cartes-socle";
import { MESSAGE_TYPE_ABSENT, MESSAGE_TYPE_SANS_TEXTE, ANNONCE_DU_TEST, URL_PASSER_LE_TEST } from "@/lib/domain/enneagramme-items";
import { NON_ECRIT } from "@/lib/corpus/port";
import { chercherInterdits } from "@/lib/domain/lexique-interdit";
import { chercherPredictions } from "@/lib/domain/marqueurs-prediction";

/**
 * enneagramme-invitation.test.ts — [7.8] LE PRODUIT CESSE D'ACCUSER ANIMA D'UN VIDE QUI N'EST PAS
 * LE SIEN.
 *
 * ══ LE DÉFAUT, ET POURQUOI IL ÉTAIT INVISIBLE ═══════════════════════════════════════════════════
 *
 * `carteEnneagramme(null, …)` rendait `faits: []` et `texte: NON_ECRIT`, et l'écran affichait donc
 * « Anima n'a pas encore écrit cette carte » — à **100 % des comptes neufs**, sur le premier écran
 * du produit. Or les NEUF textes de type sont écrits depuis la Story 5.5. Ce qui manque n'est pas
 * le texte : c'est le test.
 *
 * Aucun test ne pouvait le voir, parce que rien n'était FAUX au sens du code : la carte disait
 * correctement qu'elle n'avait pas de texte de corpus. Le mensonge était dans l'attribution.
 *
 * Retour de Julian, 2026-08-25 : « c'est à toi de dire : vous n'avez pas encore fait votre
 * ennéagramme, faites-le maintenant. »
 */

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

describe("[7.8/AC1] sans type, c'est le TEST qu'on nomme — jamais un silence d'Anima", () => {
  it("[LE CŒUR] la carte porte un état PRODUIT, distinct du texte de corpus", () => {
    const sansType = carteEnneagramme(null, NON_ECRIT);
    expect(sansType.etat, "la carte ne dit rien de l'état du produit").toBe(MESSAGE_TYPE_ABSENT);
    // ⚠️ ET LE TEXTE RESTE `non_ecrit` : on n'a pas fabriqué de texte d'Anima pour boucher le trou.
    // C'est la moitié de la correction — l'autre moitié serait une citation inventée (FR-054/FR-086).
    expect(sansType.texte.statut).toBe("non_ecrit");
  });

  it("avec un type, l'état PRODUIT se tait — la parole revient à Anima", () => {
    const avecType = carteEnneagramme(4, { statut: "ecrit", texte: "Un texte d'Anima." });
    expect(avecType.etat, "le produit continue de parler par-dessus Anima").toBeNull();
    expect(avecType.texte.statut).toBe("ecrit");
  });

  it("[LE CŒUR] la phrase désigne le TEST, et n'accuse personne", () => {
    expect(MESSAGE_TYPE_ABSENT.toLowerCase()).toContain("test");
    expect(MESSAGE_TYPE_ABSENT, "elle accuse encore Anima").not.toMatch(/Anima n’a pas/);
    // Et elle dit que les textes EXISTENT : c'est ce qui distingue « il te reste un geste » de
    // « il manque quelque chose au produit ».
    expect(MESSAGE_TYPE_ABSENT).toMatch(/écrit/);
  });

  it("les deux phrases de l'ennéagramme ne se confondent pas", () => {
    // `MESSAGE_TYPE_SANS_TEXTE` dit « Anima n'a pas écrit CE TYPE-LÀ » — un vrai silence de corpus,
    // qui n'arrive qu'APRÈS le test. `MESSAGE_TYPE_ABSENT` dit « le test attend ». Les confondre
    // ramènerait exactement le défaut corrigé.
    expect(MESSAGE_TYPE_ABSENT).not.toBe(MESSAGE_TYPE_SANS_TEXTE);
    expect(MESSAGE_TYPE_SANS_TEXTE).toContain("Anima");
  });
});

describe("[7.8] REFUS TENU — la porte ne passe pas par le type de carte", () => {
  it("[LE CŒUR] la carte ne gagne AUCUN champ de navigation", () => {
    // ⚠️ LA FAÇON NATURELLE DE RÉPARER CE DÉFAUT ÉTAIT DE RENDRE LA CARTE CLIQUABLE. C'est
    // précisément ce qu'`EXPERIENCE.md` refuse deux fois (lignes 144 et 505) : « la carte comme
    // objet reçu, pas comme ligne de menu ». L'amender pour UNE carte ouvre la porte aux quatre
    // autres, et l'accueil devient un menu.
    const src = lire("lib/domain/bibliotheque.ts").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const champ of ["url", "lien", "href", "libelleAction", "action"]) {
      expect(src, `\`${champ}\` sur une carte ferait de la bibliothèque un menu`).not.toMatch(
        new RegExp(`readonly\\s+${champ}\\s*[?:]`),
      );
    }
  });

  it("la porte vers le test vit dans le menu de compte ET dans la halte du socle", () => {
    // Deux chemins, aucun sur la carte. `URL_PASSER_LE_TEST` est la source unique des deux.
    expect(URL_PASSER_LE_TEST.url).toBe("/enneagramme");
    expect(lire("lib/domain/copie-socle.ts"), "la halte ne porte pas la porte").toContain("/enneagramme");
  });
});

describe("[7.8/AC6] l'écran s'annonce avant de démarrer", () => {
  it("[LE CŒUR] l'annonce est montée, et SEULEMENT au premier passage", () => {
    // Quelqu'un qui reprend une passe en cours n'a pas besoin qu'on lui réexplique ce qu'elle
    // fait : la relance serait du bavardage à chaque retour.
    const page = lire("app/enneagramme/page.tsx");
    expect(page).toMatch(/\{cleTentative === "nouvelle" && <p[^>]*>\{ANNONCE_DU_TEST\}<\/p>\}/);
  });

  it("[NFR-017] elle DIT ce que le code tient depuis la 5.5 : on peut s'arrêter et reprendre", () => {
    expect(ANNONCE_DU_TEST).toMatch(/arrêter|reprendre/i);
    expect(ANNONCE_DU_TEST).toMatch(/court/i);
  });

  it("[FR-031 DUR] elle n'annonce AUCUN compte, et l'écran n'a pas de barre", () => {
    // « Court » remplace la barre — décision de la 5.5. Un compteur « 4 / 18 » transforme une
    // lecture de soi en formulaire à finir.
    for (const tournure of [/\d+\s*(?:sur|\/)\s*\d+/, /%/, /\bétapes?\b/, /questions?\b/]) {
      expect(ANNONCE_DU_TEST, `mesure dans l'annonce : ${tournure}`).not.toMatch(tournure);
    }
    const page = lire("app/enneagramme/page.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(page).not.toMatch(/<progress|role="progressbar"|<meter/);
  });
});

describe("[7.8] les trois phrases passent les contrôles bloquants", () => {
  it("aucun lexique interdit, aucune prédiction", () => {
    const phrases = [MESSAGE_TYPE_ABSENT, MESSAGE_TYPE_SANS_TEXTE, ANNONCE_DU_TEST];
    expect(phrases.length).toBe(3);
    for (const p of phrases) {
      expect(chercherInterdits(p), `lexique interdit dans « ${p.slice(0, 50)}… »`).toEqual([]);
      expect(chercherPredictions(p), `prédiction dans « ${p.slice(0, 50)}… »`).toEqual([]);
    }
  });

  it("[NFR-008 / voix] aucun impératif : un état n'est pas une relance", () => {
    // `lib/domain/arbitrage-ouverture.ts` : « un impératif ferait de l'accusé de réception une
    // relance ». La phrase dit ce qui EST ; c'est le lien à côté qui dit où aller.
    for (const imperatif of [/^Fais /, /^Passe /, /^Va /, /^Clique /, /Commence par/]) {
      expect(MESSAGE_TYPE_ABSENT, `impératif : ${imperatif}`).not.toMatch(imperatif);
    }
  });
});
