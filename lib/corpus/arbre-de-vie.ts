import { corpus, creneau, lireTexte, type Corpus, type TexteCorpus } from "./port";
import { CORPUS_NUMEROLOGIE, cleNumerologie } from "./numerologie";
import type {
  CleArbre,
  IntensiteQualite,
  LectureCleArbre,
  Qualite,
} from "../astro/arbre-de-vie";
import type { LectureNombre } from "../astro/numerologie";

/**
 * arbre-de-vie.ts — LES CRÉNEAUX DE L'ARBRE DE VIE (FR-054, FR-086).
 *
 * Onzième corpus du produit, après la numérologie (69 créneaux), les mantras (60), l'horoscope
 * (27), l'ennéagramme (9), le Big Five (15), Human Design (18) et les ancrages (24). Même port,
 * même format de clé `"<famille>:<valeur>"`, décidé une fois en 5.2.
 *
 * ⚠️ CE MODULE NE CONTIENT AUCUN TEXTE, ET CE N'EST PAS UN OUBLI. Les textes vivent dans
 * `lib/corpus/textes-de-base.ts`, un seul endroit, qu'Anima peut vider ou remplacer clé par clé.
 * Les écrire ici les mettrait hors de sa portée, et `tests/corpus-architecture.test.ts` refuse
 * qu'un créneau écrit vienne d'ailleurs que de cette table.
 *
 * La règle ne bouge pas d'un iota : les remplir NOUS-MÊMES signerait du nom d'une personne réelle
 * un texte qu'elle n'a pas écrit (FR-086) ; les faire générer par un modèle serait la même faute en
 * pire (FR-047/FR-054). Un créneau vide s'affiche honnêtement comme non écrit.
 *
 * ══ POURQUOI 111 ET PAS 300 ═════════════════════════════════════════════════════════════════════
 *
 * Trois décisions de cardinalité, toutes prises pour refuser un produit cartésien. Elles ont un
 * coût d'écriture qu'il faut connaître AVANT de commencer, parce qu'elles changent le cahier :
 *
 *  1. UNE famille de racine, pas deux. La première racine (le jour) et la seconde (le mois) sont le
 *     même genre de nombre : une composante de calendrier réduite. Ce qui les distingue — d'où elles
 *     viennent — est une LÉGENDE, pas un sens. Précédent exact : Human Design porte six créneaux de
 *     ligne pour deux positions de profil, et la différence vit dans la copie.
 *     ⚠️ Conséquence d'écriture : un texte de racine doit se lire sous les DEUX positions. Jamais
 *     « ce jour-là », jamais « ce mois-là ».
 *
 *  2. UNE famille de défi, le rang en légende. Un défi 3 dit la même chose où qu'il tombe. Si Anima
 *     veut un texte distinct pour le défi majeur, c'est une famille de plus, et la décision se prend
 *     avant la rédaction.
 *
 *  3. TROIS paliers de qualité, pas neuf. Le rapport d'Anima décrit chaque famille de lettres par le
 *     nombre de fois qu'elle apparaît : neuf textes par famille, soit 81. Trois paliers gardent la
 *     nuance qui compte (rien / un peu / beaucoup), divisent l'écriture par trois, et — c'est le
 *     point important — laissent le COMPTE hors de tout ce qui circule (FR-031).
 *
 * ══ LE CHEMIN DE VIE N'AJOUTE AUCUN CRÉNEAU ════════════════════════════════════════════════════
 *
 * Il en a déjà douze, écrits, sous la clé `chemin_de_vie:<n>` des 69. `texteDuCheminDeVie` délègue.
 * Lui donner une famille à lui ferait vivre DEUX textes pour le même nombre, à deux endroits du
 * produit, et le jour où ils divergent personne ne saurait lequel fait foi.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les familles et leurs domaines — ce qui définit le nombre de créneaux
// ══════════════════════════════════════════════════════════════════════════════════════════════

export type FamilleArbre =
  | "arbre_racine"
  | "arbre_tronc"
  | "arbre_ecorce"
  | "arbre_branches"
  | "arbre_feuilles"
  | "arbre_cime"
  | "arbre_dynamique"
  | "arbre_defi"
  | "arbre_qualite";

/** Les neuf familles, dans l'ordre de lecture de la halte. Source unique : on itère dessus. */
export const FAMILLES_ARBRE: readonly FamilleArbre[] = Object.freeze([
  "arbre_racine",
  "arbre_tronc",
  "arbre_ecorce",
  "arbre_branches",
  "arbre_feuilles",
  "arbre_cime",
  "arbre_dynamique",
  "arbre_defi",
  "arbre_qualite",
]);

const SIMPLES: readonly number[] = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

/**
 * Le nom de chaque famille TEL QU'IL DOIT APPARAÎTRE DANS LA PREMIÈRE PHRASE du texte, en
 * minuscules. Ce n'est pas de la copie d'interface — c'est une CONSIGNE D'ÉCRITURE, celle que le
 * fondateur a tranchée le 2026-08-31 : « Ta racine 3 … », « Ton défi 4 … ». La garde de forme
 * (`tests/corpus-arbre-de-vie.test.ts`) la vérifie texte par texte, et le cahier d'Anima la reprend.
 *
 * ⚠️ « qualité » ne distingue pas ses trois paliers, et c'est pour ça que la garde leur demande EN
 * PLUS un marqueur : sans lui, « ta qualité 5 » présente et « ta qualité 5 » absente seraient
 * interchangeables sans que rien ne rougisse.
 */
export const LIBELLE_FAMILLE: Readonly<Record<FamilleArbre, string>> = Object.freeze({
  arbre_racine: "racine",
  arbre_tronc: "tronc",
  arbre_ecorce: "écorce",
  arbre_branches: "branches",
  arbre_feuilles: "feuilles",
  arbre_cime: "cime",
  arbre_dynamique: "dynamique de vie",
  arbre_defi: "défi",
  arbre_qualite: "qualité",
});

/** Les paliers d'une qualité, dans l'ordre. Une clé porte le palier, pas un compte. */
export const INTENSITES: readonly IntensiteQualite[] = Object.freeze([
  "absente",
  "discrete",
  "marquee",
]);

/**
 * Les valeurs possibles d'une famille. C'est CE QUI DÉFINIT le nombre de créneaux.
 *
 * Trois régimes, et chacun a sa raison propre :
 *
 *  • Racine, tronc, écorce : 1 à 9 SEULEMENT. Ils passent tous par `reduireSansMaitre` — un nombre
 *    maître y est structurellement impossible, pas simplement improbable. Déclarer 11, 22 et 33
 *    créerait des créneaux qu'Anima écrirait pour rien, et un inventaire qui ne pourrait jamais
 *    atteindre son compte.
 *  • Branches, feuilles, cime, dynamique : les maîtres sont conservés, comme pour l'expression.
 *  • Défi : 0 à 8. ⚠️ LE ZÉRO EST UNE VALEUR, PAS UNE ABSENCE. Un défi est une différence entre
 *    deux nombres déjà réduits ; quand les deux coïncident il vaut 0, ce qui arrive environ une
 *    fois sur neuf, et ce 0 a un sens à dire.
 *
 * ⚠️ `arbre_dynamique:33` est déclaré bien qu'inatteignable : une année entre 1000 et 2999 ne peut
 * pas réduire à 33 (la somme de ses chiffres plafonne à 29). Mais `lireTexte` JETTE sur une clé non
 * déclarée, et économiser un texte contre un plantage sur une date aberrante est un mauvais échange.
 * Ce n'est PAS contradictoire avec l'année personnelle du socle, qui exclut les maîtres : là ils
 * sont impossibles par la FONCTION DE RÉDUCTION, ici seulement par la plage des années. Deux raisons
 * différentes, deux verdicts différents.
 */
export function valeursPossibles(famille: FamilleArbre): readonly number[] {
  if (famille === "arbre_defi") return Object.freeze([0, ...SIMPLES.slice(0, 8)]);
  if (famille === "arbre_racine" || famille === "arbre_tronc" || famille === "arbre_ecorce") {
    return SIMPLES;
  }
  if (famille === "arbre_qualite") return SIMPLES;
  return Object.freeze([...SIMPLES, 11, 22, 33]);
}

/**
 * La clé d'un créneau : `"arbre_racine:3"`, `"arbre_qualite:5:absente"`.
 *
 * Même format que `cleNumerologie`, avec un segment de plus pour la seule famille qui en a besoin.
 * Jette hors domaine : demander « racine 11 » est un défaut de code, pas un texte manquant.
 */
export function cleArbre(famille: FamilleArbre, valeur: number, intensite?: IntensiteQualite): string {
  if (!valeursPossibles(famille).includes(valeur)) {
    throw new Error(`corpus arbre-de-vie : ${famille} ne prend pas la valeur ${valeur}`);
  }
  if (famille === "arbre_qualite") {
    if (intensite === undefined) {
      throw new Error("corpus arbre-de-vie : une qualité se lit toujours avec son palier");
    }
    return `${famille}:${valeur}:${intensite}`;
  }
  if (intensite !== undefined) {
    throw new Error(`corpus arbre-de-vie : ${famille} ne prend pas de palier`);
  }
  return `${famille}:${valeur}`;
}

/**
 * Les 111 clés, dans l'ordre de lecture. Exportée pour rendre la complétude mesurable.
 *
 * Dérivées, jamais recopiées : une liste écrite à la main finirait par diverger de la liste des
 * familles, et l'inventaire compterait des créneaux qui n'existent pas.
 */
export const CLES_ARBRE_DE_VIE: readonly string[] = Object.freeze(
  FAMILLES_ARBRE.flatMap((famille) =>
    valeursPossibles(famille).flatMap((valeur) =>
      famille === "arbre_qualite"
        ? INTENSITES.map((i) => cleArbre(famille, valeur, i))
        : [cleArbre(famille, valeur)],
    ),
  ),
);

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le corpus
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ L'IDENTIFIANT EST `"arbre-de-vie"`, AVEC DES TIRETS. `tests/corpus-etat.test.ts` recense les
 * corpus par la regex `corpus("([a-z-]+)")` : un underscore le rendrait invisible à l'inventaire, et
 * le corpus échapperait à la vérification de complétude sans que rien ne rougisse. Les FAMILLES, en
 * revanche, gardent leurs underscores — elles ne sont pas des identifiants de corpus.
 */
export const CORPUS_ARBRE_DE_VIE: Corpus = corpus(
  "arbre-de-vie",
  Object.fromEntries(CLES_ARBRE_DE_VIE.map((cle) => [cle, creneau(cle)])),
);

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les jonctions calcul → texte
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * D'où vient le texte de chaque clé de l'arbre. DÉCLARÉ, pas caché dans un `if` au fond d'une
 * fonction : le chemin de vie est le seul à venir d'un autre corpus, et cette exception doit se
 * lire, sinon quelqu'un la reproduira par imitation pour une clé qui n'en a pas besoin.
 */
export const FAMILLE_DE_LA_CLE: Readonly<Record<CleArbre, FamilleArbre>> = Object.freeze({
  racine_premiere: "arbre_racine",
  racine_seconde: "arbre_racine",
  tronc: "arbre_tronc",
  ecorce: "arbre_ecorce",
  branches: "arbre_branches",
  feuilles: "arbre_feuilles",
  cime: "arbre_cime",
});

/**
 * LA JONCTION clé de l'arbre → texte.
 *
 * Une clé `non_calcule` n'a PAS de créneau : on ne cherche pas le sens d'un nombre qu'on n'a pas.
 * Les deux absences restent distinctes de bout en bout — « il me manque ton prénom de naissance »
 * n'est pas « ce texte n'est pas encore écrit », et l'écran les dit différemment.
 */
export function texteDeArbre(cle: CleArbre, lecture: LectureCleArbre): TexteCorpus | null {
  if (lecture.statut !== "calcule") return null;
  return lireTexte(CORPUS_ARBRE_DE_VIE, cleArbre(FAMILLE_DE_LA_CLE[cle], lecture.valeur));
}

/** La dynamique de vie — même union, même règle. */
export function texteDeLaDynamique(lecture: LectureCleArbre): TexteCorpus | null {
  if (lecture.statut !== "calcule") return null;
  return lireTexte(CORPUS_ARBRE_DE_VIE, cleArbre("arbre_dynamique", lecture.valeur));
}

/** Un défi. Toujours calculé — il ne dépend que de la date, qui est obligatoire (FR-048). */
export function texteDuDefi(valeur: number): TexteCorpus {
  return lireTexte(CORPUS_ARBRE_DE_VIE, cleArbre("arbre_defi", valeur));
}

/**
 * Une qualité, palier compris.
 *
 * ⚠️ UNE QUALITÉ ABSENTE A SON PROPRE TEXTE, ELLE N'EST PAS UN TROU. C'est le point où le rapport
 * d'Anima est le plus précis et le produit le plus exposé : « tu n'as aucune lettre de cette
 * famille » n'est pas une note basse, c'est une observation sur un nom. Le texte du palier
 * « absente » est celui qui doit le dire le mieux.
 */
export function texteDeLaQualite(qualite: Qualite): TexteCorpus {
  return lireTexte(
    CORPUS_ARBRE_DE_VIE,
    cleArbre("arbre_qualite", qualite.valeur, qualite.intensite),
  );
}

/**
 * Le chemin de vie — DÉLÉGUÉ aux douze créneaux déjà écrits du socle.
 *
 * L'arbre l'affiche parce que le rapport d'Anima le place au centre de la figure, mais il ne le
 * réécrit pas : c'est le même nombre, il doit porter le même texte des deux côtés du produit.
 */
export function texteDuCheminDeVie(lecture: LectureNombre): TexteCorpus | null {
  if (lecture.statut !== "calcule") return null;
  return lireTexte(CORPUS_NUMEROLOGIE, cleNumerologie("chemin_de_vie", lecture.valeur));
}
