import {
  NOMBRES,
  type LectureNombre,
  type NomNombre,
} from "@/lib/astro/numerologie";
import {
  corpus,
  lireTexte,
  type Corpus,
  type TexteCorpus,
  creneau,
} from "./port";

/**
 * numerologie.ts — LES 69 CRÉNEAUX D'INTERPRÉTATION NUMÉROLOGIQUE (Story 5.2, FR-054 / FR-086).
 *
 * ── CE FICHIER NE PORTE AUCUN TEXTE — MAIS LES 69 SONT ÉCRITS DEPUIS LE 2026-08-23 ─────────────
 *
 * ⚠️ CET EN-TÊTE A MENTI PENDANT UNE SEMAINE, ET IL A COÛTÉ UNE DEMI-JOURNÉE. Il disait « aucun
 * n'est ÉCRIT », ce qui était vrai à la Story 5.2 et faux depuis qu'Anima a livré sa prose. Les
 * textes ne sont pas ici, ils sont dans `lib/corpus/textes-de-base.ts:150-229`, et `creneau()`
 * (`lib/corpus/port.ts:103-106`) les résout par clé. Un fichier « vide de texte » qui rend des
 * créneaux `ecrit` : les deux moitiés sont vraies, l'en-tête n'en disait qu'une.
 *
 * Ce qui reste exact, et qui est la vraie règle : ce MODULE ne contient aucune prose. FR-054 exige
 * que les interprétations viennent du corpus d'Anima, FR-086 rappelle qu'Anima est une personne
 * réelle dont on ne fabrique jamais une parole. Un modèle ne peut pas les écrire (FR-047), nous non
 * plus. Un créneau resté vide s'affiche honnêtement comme non écrit — discipline de FR-050, « je
 * préfère ne pas te l'inventer ».
 *
 * L'état réel est CALCULÉ, jamais raconté : `lib/corpus/README.md` porte le tableau, et
 * `tests/corpus-etat.test.ts` le recalcule depuis le code. C'est lui qui fait foi, pas ce
 * paragraphe.
 *
 * ── COMMENT ANIMA REMPLIT CE FICHIER ───────────────────────────────────────────────────────────
 *
 * Un créneau à la fois : `[cleNumerologie("chemin_de_vie", 7)]: ecrit("…")`. Rien d'autre à changer
 * — l'inventaire de complétude, les gardes de voix et le rendu suivent tout seuls. La fiche
 * d'écriture (un créneau par ligne, avec les règles de voix) vit dans
 * `_bmad-output/implementation-artifacts/corpus-numerologie-a-ecrire.md`.
 *
 * Dès qu'un texte est déposé ici, il tombe automatiquement sous : le contrôle de voix bloquant de la
 * 2.8 (`tests/lexique-voix.test.ts` balaie `lib/` en récursif) et le détecteur de prédiction de
 * cette story (`tests/corpus-architecture.test.ts`, FR-053).
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les valeurs possibles — ce qui définit le nombre de créneaux
// ══════════════════════════════════════════════════════════════════════════════════════════════

/** Les valeurs ordinaires de tout nombre numérologique. */
const SIMPLES: readonly number[] = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

/**
 * Les valeurs possibles d'un nombre donné.
 *
 * L'année personnelle est la seule à ne PAS porter de nombre maître : elle parcourt un cycle de neuf
 * ans, et sa racine numérique est invariante modulo 9 (voir `reduireSansMaitre`). Déclarer 11, 22 et
 * 33 pour elle créerait trois créneaux qu'Anima écrirait pour rien — et un inventaire qui ne pourrait
 * jamais atteindre 100 %.
 */
export function valeursPossibles(nombre: NomNombre): readonly number[] {
  return nombre === "annee_personnelle"
    ? SIMPLES
    : Object.freeze([...SIMPLES, 11, 22, 33]);
}

/**
 * La clé d'un créneau : `"chemin_de_vie:7"`.
 *
 * Format décidé ICI une seule fois et réutilisé tel quel par les corpus à venir — mantras (5.4),
 * ennéagramme (5.5), sens des cartes (5.7). Trois formats différents pour trois corpus rendraient
 * l'inventaire de complétude impossible à écrire une bonne fois.
 *
 * Jette sur une valeur hors domaine : demander « chemin de vie 44 » est un défaut de code, pas un
 * texte manquant (voir `lireTexte` dans le port, même raisonnement).
 */
export function cleNumerologie(nombre: NomNombre, valeur: number): string {
  if (!valeursPossibles(nombre).includes(valeur)) {
    throw new Error(
      `corpus numerologie : ${nombre} ne prend pas la valeur ${valeur}`,
    );
  }
  return `${nombre}:${valeur}`;
}

/** Les 69 clés, dans l'ordre de lecture du socle. Exportée pour rendre la complétude mesurable. */
export const CLES_NUMEROLOGIE: readonly string[] = Object.freeze(
  NOMBRES.flatMap((n) => valeursPossibles(n).map((v) => `${n}:${v}`)),
);

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le corpus
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ TOUS LES CRÉNEAUX SONT `NON_ECRIT` — voir l'en-tête. La table se construit depuis
 * `CLES_NUMEROLOGIE` plutôt qu'en 69 lignes recopiées : une liste écrite à la main finirait par
 * diverger de la liste des clés, et l'inventaire compterait des créneaux qui n'existent pas.
 *
 * Anima écrit en remplaçant une entrée :
 *
 *     [cleNumerologie("chemin_de_vie", 7)]: ecrit("…"),
 */
export const CORPUS_NUMEROLOGIE: Corpus = corpus(
  "numerologie",
  Object.fromEntries(CLES_NUMEROLOGIE.map((cle) => [cle, creneau(cle)])),
);

/**
 * LA JONCTION nombre → texte.
 *
 * Un nombre `non_calcule` n'a PAS de créneau : on ne cherche pas le sens d'un nombre qu'on n'a pas.
 * Les deux absences restent distinctes de bout en bout, et la 5.6 les affichera différemment —
 * « je ne sais pas le calculer » (il manque ton nom) n'est pas « je ne l'ai pas encore écrit ».
 */
export function texteDe(
  nombre: NomNombre,
  lecture: LectureNombre,
): TexteCorpus | null {
  if (lecture.statut !== "calcule") return null;
  return lireTexte(CORPUS_NUMEROLOGIE, cleNumerologie(nombre, lecture.valeur));
}
