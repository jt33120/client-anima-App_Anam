import { corpus, creneau, lireTexte, type Corpus, type TexteCorpus } from "./port";
import {
  FACTEURS,
  type Facteur,
  type Position,
  type ResultatBigFive,
} from "../domain/big-five";

/**
 * big-five.ts — LES QUINZE LECTURES DES CINQ GRANDS FACTEURS (2026-09-03).
 *
 * Huitième corpus du produit, même port et même format de clé que les sept autres. Il est bâti sur
 * le PRODUIT CARTÉSIEN facteur × position, et c'est la seule fois où le dépôt en accepte un.
 *
 * ══ POURQUOI CE CROISEMENT-LÀ EST LÉGITIME, ALORS QUE CEUX DE L'ENNÉAGRAMME NE L'ÉTAIENT PAS ════
 *
 * `enneagramme.ts` refuse les ailes, les instincts et les flèches — 18, 27 et 18 créneaux — au motif
 * qu'ils croisent DEUX AXES INDÉPENDANTS : le type d'une personne et une seconde dimension qui ne
 * dit rien du premier. La règle écrite en 5.4 : « on garde l'axe qu'une personne identifie comme
 * ELLE, on refuse le croisement. »
 *
 * Ici, il n'y a pas deux axes. Un facteur SANS position ne veut rien dire : « ouverture » n'est pas
 * un résultat, c'est le nom d'une échelle, et les trois positions en sont les seules valeurs. Le
 * couple `(facteur, position)` EST l'unité de sens, exactement comme `chemin_de_vie:7` l'est en
 * numérologie — où personne n'a jamais proposé d'écrire un texte pour « chemin de vie » tout court.
 *
 * ══ QUINZE TEXTES, ET LES CINQ SE LISENT ENSEMBLE ══════════════════════════════════════════════
 *
 * Un résultat rend CINQ textes, pas un. C'est la différence de fond avec l'ennéagramme, qui désigne
 * un type et un seul : ici aucune ligne ne prime, et l'écran les pose côte à côte. Un texte qui
 * dirait « c'est ça, toi » serait faux par construction — il n'est qu'un cinquième de la lecture.
 *
 * ⚠️ AUCUN TEXTE NE PORTE DE NOMBRE, ET C'EST FR-031 JUSQU'AU BOUT. « Tu es plutôt haute sur cette
 * échelle » se dit sans jamais écrire un score, et `tests/corpus-big-five.test.ts` refuse tout
 * chiffre dans ces quinze textes. Sans quoi le calcul aurait beau ne rendre que des énumérations,
 * la jauge reviendrait par la prose.
 */

/** Les trois positions, dans l'ordre de lecture. Recopié du domaine sous forme de valeurs. */
export const POSITIONS: readonly Position[] = Object.freeze(["bas", "median", "haut"]);

/**
 * La clé d'un créneau : `"big-five:ouverture:haut"`.
 *
 * JETTE hors domaine, comme `cleEnneagramme` et `cleNumerologie`. Une clé fabriquée depuis un
 * facteur inconnu n'est pas une absence de texte, c'est un défaut de code.
 */
export function cleBigFive(facteur: Facteur, position: Position): string {
  if (!FACTEURS.includes(facteur)) {
    throw new Error(`corpus big five : facteur hors domaine (${facteur})`);
  }
  if (!POSITIONS.includes(position)) {
    throw new Error(`corpus big five : position hors domaine (${position})`);
  }
  return `big-five:${facteur}:${position}`;
}

/** Les quinze clés, dans l'ordre de lecture. Exportée pour rendre la complétude mesurable. */
export const CLES_BIG_FIVE: readonly string[] = Object.freeze(
  FACTEURS.flatMap((facteur) => POSITIONS.map((position) => `big-five:${facteur}:${position}`)),
);

/**
 * ⚠️ LA TABLE SE CONSTRUIT DEPUIS `CLES_BIG_FIVE`, jamais en quinze lignes recopiées : une liste
 * écrite à la main finit par diverger de la source, et le compte de complétude ne le verrait pas.
 *
 * Anima reprend la main en remplaçant une entrée de `textes-de-base.ts`. Elle n'a pas à toucher ce
 * fichier — `creneau()` va y chercher le texte par clé, et un texte retiré redevient `non_ecrit`.
 */
export const CORPUS_BIG_FIVE: Corpus = corpus(
  "big-five",
  Object.fromEntries(CLES_BIG_FIVE.map((cle) => [cle, creneau(cle)])),
);

/** La lecture d'un facteur à une position donnée. */
export function texteDuFacteur(facteur: Facteur, position: Position): TexteCorpus {
  return lireTexte(CORPUS_BIG_FIVE, cleBigFive(facteur, position));
}

export interface LectureFacteur {
  readonly facteur: Facteur;
  readonly position: Position;
  readonly texte: TexteCorpus;
}

/**
 * Les cinq lectures d'un résultat.
 *
 * ⚠️ REND `null` QUAND LE TEST N'A PAS TRANCHÉ, et c'est la troisième valeur qui compte — même
 * signature de jonction que `texteDuType` en 5.5. Le port ne connaît que `ecrit` et `non_ecrit` ;
 * ici il faut distinguer « ces textes ne sont pas encore écrits » de « il n'y a rien à écrire,
 * parce que le test n'a pas conclu ». Confondre les deux promettrait un texte à venir à quelqu'un
 * dont le questionnaire est resté ouvert.
 */
export function lecturesDuResultat(resultat: ResultatBigFive): readonly LectureFacteur[] | null {
  if (resultat.statut !== "retenu") return null;
  return Object.freeze(
    resultat.facteurs.map((f) =>
      Object.freeze({ facteur: f.facteur, position: f.position, texte: texteDuFacteur(f.facteur, f.position) }),
    ),
  );
}
