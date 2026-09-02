import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * bibliotheque-frontiere.test.ts — [5.6/AC2 DUR · FR-031] LE COMPTE NE TRAVERSE PAS LA FRONTIÈRE,
 * ET C'EST LE TYPE QUI LE GARDE.
 *
 * ⚠️ POURQUOI CE TEST N'EST PAS UN TEST DE RENDU. La façon spontanée de garder « aucun badge, aucun
 * compteur, aucun cadenas » (UX-DR-30) serait de balayer le DOM à la recherche d'un chiffre. C'est
 * **impossible ici** : la carte des nombres affiche des nombres, celle de l'ennéagramme affiche un
 * type, celle du thème affiche des degrés quand l'heure est connue. Un tel test serait soit vide,
 * soit faux — et il interdirait deux des trois cartes qui ont quelque chose à montrer.
 *
 * La 4.10 a payé cette leçon sur l'arbitrage (`arbitrage-frontiere.test.ts`) : la façon naturelle de
 * faire fuir un compte est de l'ajouter au type qui traverse la frontière. Donc on garde LES DEUX
 * DÉCLARATIONS — celle du domaine (`lib/domain/bibliotheque.ts`) et celle du rendu
 * (`render/accueil/types.ts`), qui existent séparément parce que `render/` n'a pas le droit de
 * connaître `lib/domain/` (AD-7/AD-10).
 *
 * S'il n'existe aucun champ où écrire un compte, il n'y a rien à masquer au rendu.
 */

import { carteEnneagramme, carteMantra, carteHoroscope } from "@/lib/domain/cartes-socle";
import { NON_ECRIT } from "@/lib/corpus/port";

const RACINE = process.cwd();
const lire = (f: string) => readFileSync(resolve(RACINE, f), "utf-8");

/** Extrait le corps d'une déclaration `export interface X {` … `}` (première accolade fermante seule). */
function corpsInterface(source: string, nom: string): string {
  const debut = source.indexOf(`export interface ${nom} {`);
  if (debut < 0) return "";
  const fin = source.indexOf("\n}", debut);
  return fin < 0 ? "" : source.slice(debut, fin);
}

const DOMAINE = lire("lib/domain/bibliotheque.ts");
const UNIVERS = lire("lib/domain/univers-moi.ts");
const RENDU = lire("render/accueil/types.ts");

const DECLARATIONS: ReadonlyArray<{ ou: string; corps: string }> = [
  { ou: "domaine · CarteBibliotheque", corps: corpsInterface(DOMAINE, "CarteBibliotheque") },
  { ou: "domaine · Bibliotheque", corps: corpsInterface(DOMAINE, "Bibliotheque") },
  { ou: "rendu · CarteVue", corps: corpsInterface(RENDU, "CarteVue") },
  { ou: "rendu · BibliothequeVue", corps: corpsInterface(RENDU, "BibliothequeVue") },
  { ou: "domaine · UniversMoi", corps: corpsInterface(UNIVERS, "UniversMoi") },
  { ou: "rendu · UniversVue", corps: corpsInterface(RENDU, "UniversVue") },
];

/**
 * Les noms qu'une mesure porterait. `nombre` est volontairement ABSENT de cette liste : la carte
 * des nombres s'appelle ainsi, et l'interdire rendrait la garde impossible à satisfaire. Ce qu'on
 * refuse, c'est un COMPTE d'objets, pas le mot « nombre ».
 */
const MESURES = ["badge", "compte", "compteur", "total", "nouveau", "verrouille", "cadenas", "restant", "quantite"];

describe("[5.6/AC2 DUR] aucune des deux déclarations ne peut porter une mesure", () => {
  it("[CONTRÔLE DU CONTRÔLE] les quatre déclarations ont bien été extraites", () => {
    // Sans ce témoin, tous les refus ci-dessous seraient vrais sur des chaînes vides — le mode
    // d'échec exact d'une garde dont l'extracteur casse (leçon `arbitrage-frontiere`).
    for (const d of DECLARATIONS) {
      expect(d.corps.length, `déclaration introuvable : ${d.ou}`).toBeGreaterThan(80);
    }
    expect(DECLARATIONS).toHaveLength(6);
  });

  for (const d of DECLARATIONS) {
    for (const mesure of MESURES) {
      it(`${d.ou} : aucun champ « ${mesure} »`, () => {
        expect(
          new RegExp(`readonly\\s+${mesure}\\w*\\s*[?:]`, "i").test(d.corps),
          `un champ « ${mesure} » est apparu sur ${d.ou} — FR-031 ne tiendrait plus qu'à la vigilance`,
        ).toBe(false);
      });
    }
  }
});

describe("[5.6/AD-10] le rendu ne connaît pas le domaine, et c'est ce qui impose deux déclarations", () => {
  it("`render/accueil/` n'importe RIEN de `lib/domain`", () => {
    for (const f of ["render/accueil/types.ts", "render/accueil/Bibliotheque.tsx"]) {
      expect(lire(f), `${f} traverse la frontière AD-10`).not.toMatch(/@\/lib\/domain/);
    }
  });

  it("les deux déclarations portent les MÊMES champs — sinon la frontière laisserait passer", () => {
    // Une garde côté domaine seulement serait contournable en ajoutant le champ côté rendu, et
    // réciproquement. On vérifie donc que les deux formes coïncident champ pour champ.
    const champs = (corps: string) =>
      [...corps.matchAll(/readonly\s+(\w+)\s*[?:]/g)].map((m) => m[1]).sort();
    // ⚠️ `etat` A ÉTÉ AJOUTÉ LE 2026-08-25 (Story 7.8) : un TROISIÈME registre, distinct des faits
    // calculés et du texte d'Anima — ce que le PRODUIT dit de son propre état. Sans lui, la carte
    // de l'ennéagramme affichait « Anima n'a pas encore écrit cette carte » à tous les comptes
    // neufs, alors que les neuf textes de type sont écrits : elle accusait quelqu'un d'un vide qui
    // n'était pas le sien. Le glisser dans `texte` l'aurait fait paraître sous la plume d'Anima.
    //
    // La liste reste EXHAUSTIVE des deux côtés : c'est ce qui fait la garde. Un champ de plus ne
    // passe pas sans qu'on relise cette décision.
    //
    // ⚠️ `ecritureModele` A ÉTÉ AJOUTÉ LE 2026-09-02 : un QUATRIÈME registre, pour un texte écrit
    // par un modèle. Même raison que le troisième, en plus net — ces mots ne sont ceux de personne,
    // et les glisser dans `texte` les ferait paraître en `t-anam`, sous le nom d'une personne
    // réelle (FR-054/FR-086). Il porte SA MENTION avec lui, dans le même objet : une mention rangée
    // à côté est une mention qu'un rendu peut oublier.
    expect(champs(corpsInterface(RENDU, "CarteVue"))).toEqual([
      "cle",
      "ecritureModele",
      "etat",
      "faits",
      "texte",
      "titre",
    ]);
    // Le domaine porte `terme` en plus : il décide de la disponibilité (FR-080/FR-055). Ce champ
    // ne DOIT PAS traverser — le rendu n'a pas à savoir si une carte est premium, puisqu'une carte
    // indisponible n'est jamais construite (AC2).
    expect(champs(corpsInterface(DOMAINE, "CarteBibliotheque"))).toEqual([
      "cle",
      "ecritureModele",
      "etat",
      "faits",
      "terme",
      "texte",
      "titre",
    ]);
  });

  it("[7.8 · FR-031 DUR] aucune VALEUR d'`etat` ne porte de mesure", () => {
    // ⚠️ `etat` EST LE CHAMP LE PLUS TENTANT DU TYPE. Il accepte de la prose libre, et « 3 cartes
    // sur 5 », « profil complété à 40 % », « il te reste deux étapes » y entreraient sans qu'aucun
    // nom de champ ne rougisse. La garde de NOM ne suffit donc pas ici : on éprouve les valeurs
    // réelles que le domaine produit.
    const valeurs = [
      carteEnneagramme(null, NON_ECRIT).etat,
      carteEnneagramme(4, NON_ECRIT).etat,
      carteMantra(NON_ECRIT).etat,
      carteHoroscope(null).etat,
    ].filter((v): v is string => v !== null);
    expect(valeurs.length, "témoin : aucun état produit — le test ne mesurerait rien").toBeGreaterThan(0);
    for (const v of valeurs) {
      for (const tournure of [/\d+\s*(?:sur|\/)\s*\d+/, /%/, /\bétapes?\b/, /complét/i, /progress/i]) {
        expect(v, `mesure dans un état de carte : « ${v} »`).not.toMatch(tournure);
      }
    }
  });

  it("[Moi] `UniversMoi` et `UniversVue` portent les MÊMES champs", () => {
    const champs = (corps: string) =>
      [...corps.matchAll(/readonly\s+(\w+)\s*[?:]/g)].map((m) => m[1]).sort();
    expect(champs(corpsInterface(UNIVERS, "UniversMoi"))).toEqual([
      "accroche",
      "action",
      "cle",
      "titre",
      "url",
    ]);
    expect(champs(corpsInterface(RENDU, "UniversVue"))).toEqual([
      "accroche",
      "action",
      "cle",
      "titre",
      "url",
    ]);
  });

  it("[LE TEST QUI COMPTE] `terme` ne franchit PAS la frontière", () => {
    // Si le rendu recevait le terme, il pourrait en déduire « premium » et dessiner un cadenas.
    // Le seul moyen de rendre ce dessin impossible est de ne pas lui donner l'information.
    expect(corpsInterface(RENDU, "CarteVue")).not.toMatch(/readonly\s+terme\s*[?:]/);
    expect(corpsInterface(RENDU, "CarteVue")).not.toMatch(/premium/i);
  });
});
