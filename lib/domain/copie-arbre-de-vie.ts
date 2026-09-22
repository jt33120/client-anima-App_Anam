import type { CleArbre, IntensiteQualite, RaisonCleArbre } from "@/lib/astro/arbre-de-vie";
import { RAISON_NOMBRE, URL_CORRIGER_LE_NOM, type PorteSocle } from "@/lib/domain/copie-socle";

/**
 * copie-arbre-de-vie.ts — TOUTE LA COPIE DE LA HALTE « TON ARBRE DE VIE ».
 *
 * Module PUR (AD-1). ⚠️ CE N'EST PAS DU CORPUS D'ANIMA, et la distinction est la même qu'en
 * `copie-socle.ts` : le corpus dit ce qu'un nombre SIGNIFIE, ces phrases-ci disent l'ÉTAT DU
 * PRODUIT et nomment ses parties. Elles ne relèvent donc pas de FR-054/FR-086, et elles relèvent de
 * plein droit du contrôle de voix bloquant (`tests/lexique-voix.test.ts`).
 *
 * `render/` ne peut pas lire ce fichier (AD-7/AD-10) : la page serveur importe ces constantes et
 * les descend en propriétés, comme `/human-design` et `/socle`.
 *
 * ── DEUX MOTS QUE LE PRODUIT A DÉJÀ, AVEC UN AUTRE SENS ────────────────────────────────────────
 *
 * « Tronc », « branche » et « feuille » désignent déjà, dans la région « Mon évolution », les
 * prises de conscience que la personne a NOMMÉES ELLE-MÊME. Ici ce sont les parties d'une figure
 * de numérologie, tirées de sa naissance et de son nom : rien à voir, et le même vocabulaire.
 *
 * On garde les deux, parce que ce sont les mots de la méthode d'Anima et ceux que ses clientes
 * connaissent, et on paie ce choix par UNE PHRASE en tête de la halte qui le dit. Une phrase
 * explicite coûte moins cher qu'un vocabulaire inventé que personne ne reconnaîtrait.
 *
 * ── ET UN MOT QUE LE PRODUIT A BANNI ───────────────────────────────────────────────────────────
 *
 * Le rapport d'Anima nomme la septième clé « les fruits ». Le produit a supprimé la métaphore du
 * fruit en migration `0025`, et `tests/arbre-sans-fruit.test.ts` balaie `lib/**` et `render/**` pour
 * qu'elle ne revienne pas. Ce n'est pas un obstacle contourné : un fruit est une récompense
 * suspendue, et ce que la clé désigne, ce sont des besoins de réalisation. D'où « la cime ».
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// L'entrée dans la halte
// ══════════════════════════════════════════════════════════════════════════════════════════════

export const TITRE_HALTE = "Ton arbre de vie";
export const SURTITRE = "Numérologie";

export const INTRODUCTION =
  "Sept nombres tirés de ta date de naissance et de ton nom, posés sur un arbre : deux racines, un tronc, son écorce, des branches, des feuilles et une cime. C’est une figure de lecture symbolique, pas une mesure de ce que tu vaux.";

/**
 * ⚠️ LA PHRASE QUI PAIE LE VOCABULAIRE PARTAGÉ. Sans elle, quelqu’un qui connaît « Mon évolution »
 * lit « tes branches » et cherche celles qu’elle a nommées. Elle dit la différence par ce qui BOUGE
 * ou non, pas par un jargon : l’un se construit avec le temps, l’autre était là au premier jour.
 */
export const DISTINCTION_AVEC_L_EVOLUTION =
  "Cet arbre n’est pas celui de « Mon évolution ». Celui-là pousse avec ce que tu nommes ; celui-ci ne bouge pas, il met en place les nombres que tu portes depuis ta naissance.";

export const TITRE_SCHEMA = "L’arbre de tes nombres";
export const DESCRIPTION_SCHEMA =
  "Un arbre dessiné au trait. Deux racines et un tronc forment le triangle du bas ; l’écorce est sur le tronc, les branches et les feuilles s’ouvrent au-dessus, et la cime les termine. Chaque partie porte son nombre, repris en toutes lettres plus bas.";

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les sept clés
// ══════════════════════════════════════════════════════════════════════════════════════════════

export const TITRE_TRIANGLE = "Le triangle fondamental";
export const INTRODUCTION_TRIANGLE =
  "Tes deux besoins essentiels, et ce vers quoi ils te portent. Les racines viennent du jour et du mois de ta naissance ; le tronc naît de leur rencontre.";

export const TITRE_COMPORTEMENT = "Les quatre clés de ton comportement";
export const INTRODUCTION_COMPORTEMENT =
  "Ce que les autres voient, ta manière de faire, ce dont ton cœur a besoin, et ce que tu cherches à construire.";

/** Le nom de chaque partie, tel qu’il s’affiche au-dessus de son nombre. */
export const INTITULE_CLE: Readonly<Record<CleArbre, string>> = Object.freeze({
  racine_premiere: "Première racine",
  racine_seconde: "Seconde racine",
  tronc: "Tronc",
  ecorce: "Écorce",
  branches: "Branches",
  feuilles: "Feuilles",
  cime: "Cime",
});

/** Ce que chaque partie nomme. Une phrase courte, jamais un verdict sur la personne. */
export const ROLE_CLE: Readonly<Record<CleArbre, string>> = Object.freeze({
  racine_premiere: "Ton premier besoin essentiel, celui qui te nourrit en premier.",
  racine_seconde: "Ton second besoin essentiel, celui qui vient juste après.",
  tronc: "Ce vers quoi tes deux racines te portent.",
  ecorce: "L’image que les autres perçoivent de toi.",
  branches: "Ta façon d’agir et d’entreprendre.",
  feuilles: "Ce dont tu as besoin sur le plan affectif.",
  cime: "Ce que tu cherches à réaliser et à construire.",
});

/** D’où vient chaque nombre. Le calcul reste visible : c’est ce qui le distingue d’une devinette. */
export const ORIGINE_CLE: Readonly<Record<CleArbre, string>> = Object.freeze({
  racine_premiere: "Le jour de ta naissance, réduit.",
  racine_seconde: "Le mois de ta naissance, réduit.",
  tronc: "Tes deux racines additionnées, puis réduites.",
  ecorce: "Le jour de ta naissance, lu autrement : ta première racine dit d’où tu viens, ton écorce dit ce qui se voit.",
  branches: "Toutes les lettres de tes prénoms de naissance.",
  feuilles: "Les voyelles de ton nom de naissance complet.",
  cime: "Les consonnes de ton nom de naissance complet.",
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// La dynamique, les défis, les qualités
// ══════════════════════════════════════════════════════════════════════════════════════════════

export const TITRE_DYNAMIQUE = "La dynamique de ta vie";
export const INTITULE_DYNAMIQUE = "Dynamique de vie";
export const INTRODUCTION_DYNAMIQUE =
  "L’ambiance générale autour de ton chemin, donnée par ton année de naissance. Quand elle porte un nombre maître, il s’écrit avec sa réduction juste à côté.";
export const ORIGINE_DYNAMIQUE = "Ton année de naissance, réduite, nombres maîtres conservés.";

export const TITRE_DEFIS = "Tes quatre défis";
/**
 * ⚠️ « EN MÊME TEMPS », ET CE N’EST PAS UNE FORMULE DE STYLE. Quatre défis numérotés se lisent
 * comme quatre paliers à franchir, avec un « où j’en suis » implicite : soit la barre de progression
 * que le produit a remplacée par un arbre (FR-031). Ils ne sont donc jamais numérotés à l’écran, et
 * cette phrase dit pourquoi on peut les lire dans n’importe quel ordre.
 */
export const INTRODUCTION_DEFIS =
  "Quatre terrains d’apprentissage, présents en même temps et dans aucun ordre. Chacun naît d’un écart entre deux de tes nombres ; ils se travaillent toute la vie, sans jamais se terminer.";
export const ORIGINE_DEFI = "L’écart entre deux de tes nombres de naissance.";

/**
 * Le terrain de chaque défi, de 0 à 8. C’est le LIBELLÉ : un défi ne porte pas de rang.
 *
 * ⚠️ LA CONTRACTION EST DANS LA TABLE, PAS DANS LE CODE. Écrit « le travail » et assemblé par
 * `Le défi de ${terrain}`, ça donne « Le défi de le travail » — c'est ce que le rendu affichait, et
 * c'est le rendu qui l'a dit, pas la relecture du code. Un `de`/`du`/`de la` calculé sur l'article
 * serait une règle de grammaire française dans un fichier de copie : neuf entrées écrites en clair
 * coûtent moins cher et ne se trompent pas.
 */
export const THEME_DEFI: Readonly<Record<number, string>> = Object.freeze({
  0: "de l’équilibre",
  1: "du moi",
  2: "du lien",
  3: "de la parole",
  4: "du travail",
  5: "de la liberté",
  6: "de la responsabilité",
  7: "du sens",
  8: "de la place",
});

export const TITRE_QUALITES = "Tes qualités";
export const INTRODUCTION_QUALITES =
  "Neuf terrains, chacun porté par trois lettres de l’alphabet. Selon ce que ton nom de naissance contient, un terrain t’est familier ou reste à découvrir. Une qualité absente n’est pas un manque de valeur : c’est un endroit où tu n’as pas encore d’appui tout prêt.";

/** Le nom de chaque terrain. ⚠️ Les 5 et 6 du rapport d’Anima étaient genrés : ils ne le sont plus. */
export const NOM_QUALITE: Readonly<Record<number, string>> = Object.freeze({
  1: "L’action",
  2: "Le regard",
  3: "La parole",
  4: "Le travail",
  5: "La liberté",
  6: "L’amour",
  7: "La recherche de sens",
  8: "La réalisation",
  9: "Le groupe",
});

/** Les lettres de chaque terrain. Dites en clair : la méthode reste vérifiable. */
export const LETTRES_QUALITE: Readonly<Record<number, string>> = Object.freeze({
  1: "A, J, S",
  2: "B, K, T",
  3: "C, L, U",
  4: "D, M, V",
  5: "E, N, W",
  6: "F, O, X",
  7: "G, P, Y",
  8: "H, Q, Z",
  9: "I, R",
});

/**
 * ⚠️ TROIS MOTS, JAMAIS UN COMPTE (FR-031, DUR). « Quatre fois » ou « 4 sur 9 » referait la grille
 * de scores que ce produit refuse, sur les lettres du nom de quelqu’un. Et « absente » se dit comme
 * une observation, pas comme une note basse.
 */
export const INTENSITE_LIBELLE: Readonly<Record<IntensiteQualite, string>> = Object.freeze({
  absente: "Ces lettres ne sont pas dans ton nom",
  discrete: "Ces lettres sont là, discrètement",
  marquee: "Ces lettres reviennent souvent dans ton nom",
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le chemin de vie, la méthode, les absences
// ══════════════════════════════════════════════════════════════════════════════════════════════

export const TITRE_CHEMIN_DE_VIE = "Ton chemin de vie";
export const INTITULE_CHEMIN_DE_VIE = "Chemin de vie";
export const INTRODUCTION_CHEMIN_DE_VIE =
  "Il se tient au centre de la figure, et c’est le même nombre que sur la halte de tes nombres : le jour, le mois et l’année réduits séparément, puis additionnés.";
export const PORTE_VERS_LES_NOMBRES: PorteSocle = Object.freeze({
  libelle: "Tes six nombres",
  url: "/socle?univers=numerologie",
});

export const TITRE_METHODE = "La méthode de calcul";
export const CONVENTIONS: readonly string[] = Object.freeze([
  "Table pythagoricienne : A vaut 1, B vaut 2… I vaut 9, puis le cycle recommence.",
  "Les racines, le tronc et l’écorce se réduisent jusqu’à un chiffre de 1 à 9, sans nombre maître.",
  "Les branches, les feuilles, la cime et la dynamique de vie conservent les nombres maîtres 11, 22 et 33.",
  "Un défi est un écart entre deux nombres déjà réduits : il vaut de 0 à 8, et il ne se réduit pas.",
  "La lettre Y est comptée comme une voyelle.",
  "L’écorce et la première racine sont le même nombre, lu deux fois : d’où tu viens, et ce qui se voit.",
]);

/**
 * La phrase du silence du corpus. En voix PRODUIT, jamais en `t-anam` : faire dire par Anima
 * qu’Anima n’a pas écrit serait déjà lui prêter une phrase (FR-086).
 */
export const TEXTE_NON_ECRIT =
  "Ce nombre est juste, et ce qu’il raconte n’est pas encore écrit. Anima écrit ces textes elle-même, un par un.";

/**
 * Pourquoi une clé manque. Les quatre premières raisons sont CELLES DU SOCLE, reprises telles
 * quelles : une même absence ne peut pas se dire de deux façons à deux endroits du produit.
 */
export const RAISON_CLE: Readonly<Record<RaisonCleArbre, string>> = Object.freeze({
  ...RAISON_NOMBRE,
  prenom_de_naissance_absent:
    "Les branches se comptent sur tes prénoms de naissance seuls, et tu ne les as pas encore donnés. C’est facultatif, et rien d’autre n’en dépend.",
});

/**
 * Une absence réparable porte son lien : sinon c’est un reproche déguisé (FR-050).
 *
 * ⚠️ DEUX LIBELLÉS POUR LA MÊME DESTINATION, ET C’EST VOULU. Les deux mènent à /reglages, mais le
 * lien doit nommer CE QUI MANQUE : « Ton nom complet » sous une absence de prénoms de naissance
 * envoyait remplir un champ déjà rempli. Vu à l’écran le 2026-09-21, pas déduit du code.
 */
export const REPARATION_NOM: PorteSocle = URL_CORRIGER_LE_NOM;
export const REPARATION_PRENOM: PorteSocle = Object.freeze({
  libelle: "Tes prénoms de naissance",
  url: URL_CORRIGER_LE_NOM.url,
});

export function reparationDe(raison: RaisonCleArbre): PorteSocle {
  return raison === "prenom_de_naissance_absent" ? REPARATION_PRENOM : REPARATION_NOM;
}

export const NAISSANCE_ABSENTE =
  "Il me manque ta date de naissance pour dessiner cet arbre. Elle se donne au début du parcours.";
export const PORTE_NAISSANCE: PorteSocle = Object.freeze({
  libelle: "Donner ma date de naissance",
  url: "/naissance",
});
export const ARBRE_INDISPONIBLE =
  "Je n’arrive pas à lire tes données de naissance en ce moment. Ce n’est pas toi, c’est de mon côté.";
