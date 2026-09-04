/**
 * portail.ts — LE MODÈLE DU PORTAIL D'ENTRÉE (2026-09-03).
 *
 * ══ CE QU'EST LE PORTAIL ════════════════════════════════════════════════════════════════════════
 *
 * Retour de Julian : « au lancement de l'app ou son refresh, un écran de chargement qui est l'arbre
 * que l'on a en asset, qui passe par les différents stades, de graine à arbre scintillant, tout en
 * étant souple et apaisé. En dessous de l'arbre un écran de chargement. Carte blanche pour en faire
 * le portail d'entrée vers l'univers d'Anam. »
 *
 * Ce module ne dessine RIEN. Il décide QUAND, et c'est la partie qui peut faire du mal : un voile
 * plein écran qui reste est un produit mort, et aucune quantité de beauté ne rachète ça.
 *
 * ══ LA PROPRIÉTÉ QUI COMPTE : LE PORTAIL S'EN VA, QUOI QU'IL ARRIVE ═════════════════════════════
 *
 * `momentDuDepart` ne prend PAS « la scène est prête » comme condition nécessaire. Elle prend le
 * plus TÔT entre « la scène est prête et la pousse est finie » et un PLAFOND en dur. Une session
 * dont la scène ne se déclare jamais prête — une erreur avalée, un effet qui ne se rejoue pas, un
 * onglet remis en avant-plan après une mise en veille — voit quand même le portail se retirer.
 *
 * ⚠️ C'EST L'INVERSE DE CE QU'ON ÉCRIT SPONTANÉMENT. « Cache le voile quand c'est chargé » se code
 * en trois lignes et se casse en silence : il n'existe aucun état visible qui dise « le signal n'est
 * jamais venu ». Le plafond transforme une panne invisible en simple portail un peu long.
 *
 * ══ ET LA POUSSE VA TOUJOURS À SON TERME ═══════════════════════════════════════════════════════
 *
 * Une scène prête en 300 ms ne coupe pas l'arbre à mi-hauteur : le geste se montre en entier ou ne
 * se montre pas. C'est ce que veut dire « portail » plutôt que « spinner » — un spinner s'interrompt
 * n'importe où, une porte s'ouvre jusqu'au bout. D'où le `Math.max` : la pousse est un PLANCHER.
 *
 * ══ FR-031 : AUCUN NOMBRE NE SORT D'ICI POUR ÊTRE LU ═══════════════════════════════════════════
 *
 * L'éveil est un paramètre de DESSIN (0 → 100, la même échelle que `MoteurArbre.dessiner`), jamais
 * une progression affichable. Le produit n'a ni barre, ni pourcentage, ni « 3 sur 5 » : ce que la
 * personne voit avancer, c'est un arbre qui pousse, et un arbre n'annonce pas où il en est.
 */

/**
 * La durée de la pousse, de la graine à la ramure.
 *
 * ⚠️ CE N'EST PAS UN NOMBRE ROND CHOISI AU HASARD. En dessous d'environ deux secondes, la
 * croissance se lit comme un sursaut et non comme un geste ; au-delà de trois, elle devient un péage
 * qu'on paie à chaque rafraîchissement. 2200 ms est le palier où la ramure a le temps de s'ouvrir
 * sans que l'attente se remarque — et c'est la seule constante à toucher pour la régler.
 */
export const DUREE_POUSSE_MS = 2200;

/**
 * Le plafond dur. Passé ce délai, le portail se retire, prête ou pas.
 *
 * Six secondes, c'est-à-dire nettement plus que la pousse et nettement moins qu'une patience. Un
 * plafond trop proche de la pousse ne protègerait de rien (il ne mordrait jamais) ; un plafond à
 * trente secondes protègerait quelqu'un qui a déjà fermé l'onglet.
 */
export const PLAFOND_MS = 6000;

/** Le fondu de sortie. `--duree-longue` de la feuille de design, en une seule source. */
export const DUREE_RETRAIT_MS = 700;

/**
 * Sous `prefers-reduced-motion`, il n'y a PAS de pousse — l'arbre est là, entier, immobile.
 *
 * ⚠️ ET LE PORTAIL NE DISPARAÎT PAS POUR AUTANT. Le réduire à zéro ferait clignoter un plein écran
 * entre deux images, ce qui est précisément le genre de saut que le réglage existe pour éviter. Il
 * reste le temps d'un fondu standard, puis s'en va.
 */
export const SEJOUR_REDUIT_MS = 320;

/** Ce que le portail montre à un instant donné. Aucun texte : le sens vit dans la copie. */
export interface EtatPortail {
  /** L'éveil de l'arbre, 0 → 100 — l'échelle de `MoteurArbre`. Un paramètre de dessin, jamais un score. */
  readonly eveil: number;
  /**
   * L'opacité de la graine, 1 → 0. Elle s'efface exactement pendant que le bois monte : c'est UN
   * fondu enchaîné, et non deux animations qui se croisent au hasard.
   */
  readonly graine: number;
  /** Le portail est-il en train de se retirer ? */
  readonly retrait: boolean;
}

/** `ease-in-out` sur [0, 1]. La même forme que la courbe de la charte, en arithmétique pure. */
function adouci(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * L'instant où le portail commence à se retirer.
 *
 * @param sceneListeA quand la scène s'est déclarée prête, ou `null` si elle ne l'a jamais fait.
 *
 * ⚠️ `null` N'EST PAS UNE ERREUR À REMONTER, c'est le cas nominal des premières frames — et le cas
 * définitif d'une session où le signal se perd. Les deux se traitent pareil : le plafond décide.
 */
export function momentDuDepart(sceneListeA: number | null, mouvementReduit = false): number {
  const plancher = mouvementReduit ? SEJOUR_REDUIT_MS : DUREE_POUSSE_MS;
  if (sceneListeA === null) return PLAFOND_MS;
  return Math.min(PLAFOND_MS, Math.max(plancher, sceneListeA));
}

/**
 * L'état du portail après `ecoule` millisecondes.
 *
 * ⚠️ LA GRAINE S'EFFACE TÔT, ET C'EST VOULU. Elle tient le premier cinquième de la pousse, là où le
 * moteur ne dessine encore qu'une amorce de tronc : sans elle, le portail s'ouvrirait sur un moignon
 * de bois plutôt que sur ce que Julian a demandé, « une graine ». Passé ce seuil, le tronc porte
 * l'image tout seul et la graine deviendrait un caillou posé au pied de l'arbre.
 */
export function etatDuPortail(
  ecoule: number,
  depart: number,
  mouvementReduit = false,
): EtatPortail {
  if (mouvementReduit) {
    return { eveil: 100, graine: 0, retrait: ecoule >= depart };
  }
  const avancement = adouci(ecoule / DUREE_POUSSE_MS);
  return {
    eveil: avancement * 100,
    // La graine s'efface sur le premier cinquième, en linéaire : un fondu adouci sur une durée
    // aussi courte se lit comme un clignotement.
    graine: Math.min(1, Math.max(0, 1 - ecoule / (DUREE_POUSSE_MS * 0.2))),
    retrait: ecoule >= depart,
  };
}

/** Le portail a-t-il fini de se retirer ? Au-delà, il n'est plus dans le document. */
export function portailFini(ecoule: number, depart: number): boolean {
  return ecoule >= depart + DUREE_RETRAIT_MS;
}
