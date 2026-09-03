import type { NiveauReponse, ReponseItem } from "./echelle-likert";

/**
 * big-five.ts — LE CALCUL DES CINQ GRANDS FACTEURS (2026-09-03).
 *
 * Module PUR, comme `enneagramme.ts` : aucune I/O, aucun `server-only`, aucun Supabase. Il rend des
 * ÉNUMÉRATIONS, jamais une phrase et jamais un nombre affichable. Le sens vit dans le corpus.
 *
 * ══ POURQUOI LE CINQUIÈME FACTEUR S'APPELLE « STABILITÉ ÉMOTIONNELLE » ═════════════════════════
 *
 * La littérature le nomme par son pôle négatif. Ce mot-là est dans `lib/domain/lexique-interdit.ts`
 * (famille médicale), et le contrôle de voix bloquant refuserait tout texte qui le porte — à juste
 * titre : NFR-008 dit « lexique zéro médical », et « une seule phrase du mauvais côté change le
 * régime juridique applicable ».
 *
 * Le facteur est donc nommé, et MESURÉ, par son pôle positif. Ce n'est pas un euphémisme : c'est
 * exactement la même dimension, lue dans l'autre sens, et c'est la convention de toutes les
 * versions grand public de l'inventaire.
 *
 * ══ AUCUN SCORE NE SORT D'ICI, ET C'EST FR-031 ════════════════════════════════════════════════
 *
 * Le produit n'affiche ni compteur, ni jauge, ni pourcentage. « Ouverture : 72 / 100 » est
 * exactement ce que la charte refuse, et c'est la forme par défaut de tout Big Five du marché.
 *
 * Le calcul rend donc, par facteur, une POSITION parmi trois — `bas`, `median`, `haut` — et rien
 * d'autre. Le total intermédiaire existe (on additionne bien des réponses) mais il est PRIVÉ : il
 * ne traverse pas le type de sortie, donc aucun rendu ne peut le peindre en barre.
 */

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Les cinq facteurs
// ══════════════════════════════════════════════════════════════════════════════════════════════

export type Facteur =
  | "ouverture"
  | "conscience"
  | "extraversion"
  | "agreabilite"
  | "stabilite";

/** L'ordre de lecture, fixe. Aucun tri ne s'applique entre ici et l'écran. */
export const FACTEURS: readonly Facteur[] = Object.freeze([
  "ouverture",
  "conscience",
  "extraversion",
  "agreabilite",
  "stabilite",
]);

export function estFacteur(v: unknown): v is Facteur {
  return typeof v === "string" && (FACTEURS as readonly string[]).includes(v);
}

/**
 * Où se situe une réponse sur un facteur.
 *
 * ⚠️ TROIS POSITIONS, PAS CINQ, ET AUCUN NOMBRE. Trois est le plus petit découpage qui dise
 * quelque chose (un côté, l'autre, et le milieu qui est un vrai résultat). Cinq inviterait à
 * lire une échelle, donc à demander « et moi je suis à combien ».
 */
export type Position = "bas" | "median" | "haut";

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le barème
// ══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Ce qu'un item apporte : son facteur, et son SENS.
 *
 * ⚠️ `inverse: true` EST LA MOITIÉ DE LA QUALITÉ DE L'INVENTAIRE. Un questionnaire dont tous les
 * énoncés vont dans le même sens mesure surtout la tendance à acquiescer : la personne coche
 * « souvent » partout et sort « haut » sur les cinq facteurs. Un item inversé par paire casse ce
 * biais — et c'est aussi ce qui rend le barème illisible à l'œil pendant qu'on répond.
 */
export interface ItemBaremeBigFive {
  readonly id: string;
  readonly facteur: Facteur;
  readonly inverse: boolean;
}

/** Le niveau tel qu'il compte pour son facteur, une fois le sens de l'énoncé appliqué. */
export function niveauOriente(niveau: NiveauReponse, inverse: boolean): NiveauReponse {
  return (inverse ? 3 - niveau : niveau) as NiveauReponse;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Le résultat
// ══════════════════════════════════════════════════════════════════════════════════════════════

export interface FacteurRetenu {
  readonly facteur: Facteur;
  readonly position: Position;
}

export type ResultatBigFive =
  | { readonly statut: "retenu"; readonly facteurs: readonly FacteurRetenu[] }
  | { readonly statut: "incomplet"; readonly manquants: readonly string[] }
  | { readonly statut: "indetermine"; readonly raison: "reponses_inconnues" };

/**
 * Combien d'items d'un facteur doivent porter un avis pour que sa position ait un sens.
 *
 * ⚠️ CE N'EST PAS UNE MAJORITÉ ARBITRAIRE. Avec quatre items par facteur, deux « je ne sais pas »
 * laissent deux réponses : le milieu du barème devient atteignable par une seule d'entre elles, et
 * la position bascule sur un avis. Trois est le seuil en dessous duquel on préfère ne rien dire.
 */
export const AVIS_MINIMAL_PAR_FACTEUR = 3;

/** Les items sans réponse du tout — ni niveau, ni « je ne sais pas ». */
export function itemsManquants(
  reponses: readonly ReponseItem[],
  bareme: readonly ItemBaremeBigFive[],
): readonly string[] {
  const repondus = new Set(reponses.map((r) => r.itemId));
  return Object.freeze(bareme.filter((item) => !repondus.has(item.id)).map((item) => item.id));
}

/**
 * LE RÉSULTAT.
 *
 * ⚠️ LES BORNES SONT SUR LA MOYENNE DES AVIS, PAS SUR LE TOTAL. Additionner puis comparer à un
 * seuil fixe ferait basculer vers « bas » toute personne ayant répondu « je ne sais pas » deux
 * fois : son total serait mécaniquement plus petit, et le produit lui dirait quelque chose d'elle
 * qui ne vient que de ses abstentions.
 *
 * ⚠️ ET LE TOTAL NE SORT PAS. Il est calculé, il décide, il reste ici. C'est FR-031 rendu
 * structurel plutôt que confié à la discipline du rendu.
 */
export function conclure(
  reponses: readonly ReponseItem[],
  bareme: readonly ItemBaremeBigFive[],
): ResultatBigFive {
  const manquants = itemsManquants(reponses, bareme);
  if (manquants.length > 0) return { statut: "incomplet", manquants };

  const parId = new Map(bareme.map((item) => [item.id, item]));
  const avis = new Map<Facteur, number[]>(FACTEURS.map((f) => [f, []]));

  for (const reponse of reponses) {
    const item = parId.get(reponse.itemId);
    // Une réponse à un item inconnu n'est pas une erreur de la personne : c'est un barème qui a
    // changé sous une passe en cours. On l'ignore, et le compte d'avis s'en charge.
    if (!item || reponse.niveau === null) continue;
    avis.get(item.facteur)!.push(niveauOriente(reponse.niveau, item.inverse));
  }

  if (FACTEURS.some((f) => avis.get(f)!.length < AVIS_MINIMAL_PAR_FACTEUR)) {
    return { statut: "indetermine", raison: "reponses_inconnues" };
  }

  const facteurs = FACTEURS.map((facteur) => {
    const valeurs = avis.get(facteur)!;
    const moyenne = valeurs.reduce((somme, v) => somme + v, 0) / valeurs.length;
    // L'échelle va de 0 à 3 : le tiers bas s'arrête à 1, le tiers haut commence à 2. Les bornes
    // sont INCLUSIVES du côté du milieu — une moyenne pile à 1 est un vrai milieu, pas un « bas ».
    const position: Position = moyenne < 1 ? "bas" : moyenne > 2 ? "haut" : "median";
    return Object.freeze({ facteur, position });
  });

  return { statut: "retenu", facteurs: Object.freeze(facteurs) };
}
