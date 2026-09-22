/**
 * geometrie.ts — LE DESSIN DE L'ARBRE, EN COORDONNÉES.
 *
 * Module pur du rendu : des nombres et des chaînes de chemin SVG, aucune donnée de personne.
 *
 * ── POURQUOI LES PASTILLES NE SONT PAS DANS LE SVG ────────────────────────────────────────────
 *
 * Un `<circle r="22">` dans un `viewBox="0 0 320 480"` ne mesure 44 px à l'écran QUE si le dessin
 * est peint à 320 px de large exactement. Sur un écran de 320 px moins deux marges, l'échelle tombe
 * vers 0,85 et la cible avec elle — sous le plancher de `--cible-tactile`, en silence, et
 * `tests/cible-tactile.test.ts` ne saurait pas le voir puisqu'il lit des modules CSS.
 *
 * Les sept prises sont donc des liens HTML posés PAR-DESSUS le dessin, positionnés en pourcentage
 * du cadre. Elles tiennent 44 px à toutes les échelles, elles sont annoncées, elles se tabulent, et
 * le SVG reste ce qu'il doit être : muet (`role="img"`, un titre, une description).
 *
 * C'est la même décision que `render/psychologie/DessinHumanDesign.tsx`, qui refuse en toutes
 * lettres de faire dire par le dessin ce que le produit dit par les mots.
 */

import type { PastilleVue } from "./types";

/** Le cadre du dessin. FIXE : la géométrie s'écrit une fois, elle ne se recalcule jamais. */
export const CADRE = Object.freeze({ largeur: 320, hauteur: 480 });

/**
 * Le centre de chaque prise, en POURCENTAGE du cadre — c'est ce que le CSS sait poser, et ce qui
 * reste juste quelle que soit la largeur réelle du dessin.
 *
 * ⚠️ AUCUNE PAIRE DE CENTRES SOUS 48 PX au rendu de référence (320 px de large). C'est la limite
 * mesurée au-delà de laquelle deux cibles de 44 px se recouvrent, et c'est le défaut qui a demandé
 * un panneau de désambiguïsation sur l'autre arbre. Ici la figure est fixe : on l'évite en plaçant.
 */
export const ANCRES: Readonly<Record<string, { readonly gauche: string; readonly haut: string }>> =
  Object.freeze({
    cime: Object.freeze({ gauche: "50%", haut: "8%" }),
    feuilles: Object.freeze({ gauche: "83%", haut: "34%" }),
    branches: Object.freeze({ gauche: "17%", haut: "34%" }),
    // ⚠️ L'ÉCORCE EST DÉCALÉE, ELLE NE COIFFE PAS LE TRONC. Centrée, son aplat masquait la fourche
    // et la figure se lisait comme un lampadaire. Elle désigne le bois d'à côté, ce qui est
    // exactement ce qu'une écorce est.
    ecorce: Object.freeze({ gauche: "30%", haut: "58%" }),
    tronc: Object.freeze({ gauche: "50%", haut: "78%" }),
    racine_seconde: Object.freeze({ gauche: "80%", haut: "94%" }),
    racine_premiere: Object.freeze({ gauche: "20%", haut: "94%" }),
  });

/** Les racines : deux maîtresses, trois radicelles, elles s'écartent sous le collet. */
export const RACINES: readonly string[] = Object.freeze([
  "M160 406 C 134 424, 98 434, 58 448",
  "M160 406 C 186 424, 222 434, 262 448",
  "M160 406 C 144 426, 124 442, 100 458",
  "M160 406 C 176 426, 196 442, 220 458",
  "M160 406 C 160 430, 160 446, 160 462",
]);

/**
 * Le tronc : un fuseau qui PORTE. Large au collet (84 px), affiné à la fourche (28 px).
 *
 * ⚠️ LA PREMIÈRE VERSION ÉTAIT TROP FINE, ET ÇA NE SE VOIT QU'À L'ÉCRAN. Mesurée au navigateur le
 * 2026-09-21, la figure se lisait comme un champignon : un pied étroit sous une ombelle. Aucun test
 * ne pouvait le dire — un chemin SVG valide dessine ce qu'on lui demande, même une mauvaise idée.
 */
export const TRONC =
  "M118 410 C 136 348, 144 288, 146 234 L 174 234 C 176 288, 184 348, 202 410 Z";

/** L'écorce : deux nervures SUR le bois. Un trait, jamais une texture, jamais un flou. */
export const ECORCE: readonly string[] = Object.freeze([
  "M144 394 C 152 342, 156 288, 157 242",
  "M176 394 C 168 342, 164 288, 163 242",
]);

/** La charpente : cinq maîtresses branches depuis la fourche, en éventail. */
export const BRANCHES: readonly string[] = Object.freeze([
  "M160 234 C 136 206, 100 186, 62 168",
  "M160 234 C 184 206, 220 186, 258 168",
  "M160 234 C 142 200, 118 172, 96 140",
  "M160 234 C 178 200, 202 172, 224 140",
  "M160 234 C 159 196, 160 158, 160 118",
]);

/**
 * Le feuillage : une COURONNE de feuilles individuelles, jamais une masse peinte.
 *
 * Écrites une à une plutôt qu'engendrées : une boucle pseudo-aléatoire redistribuerait les feuilles
 * à chaque retouche du code, et `Math.random()` rendrait le dessin non reproductible d'un rendu à
 * l'autre, donc invérifiable par une capture.
 *
 * ⚠️ AUCUNE FEUILLE SOUS LES DEUX PRISES LATÉRALES (autour de x 64 et x 256, y 158). Leur aplat
 * passerait par-dessus, et on lirait une pastille posée sur un trou.
 */
export const FEUILLES: readonly (readonly [number, number])[] = Object.freeze([
  [160, 96], [136, 110], [184, 110], [112, 126], [208, 126],
  [148, 128], [172, 128], [92, 148], [228, 148], [126, 146],
  [194, 146], [160, 144], [108, 170], [212, 170], [140, 166],
  [180, 166], [160, 184], [128, 190], [192, 190], [86, 186],
  [234, 186], [150, 206], [170, 206],
]);

/** La cime : un arc OUVERT. Rien ne se referme, rien ne se récolte. */
export const CIME = "M78 124 C 96 56, 224 56, 242 124";

/** Le repère d'une pastille. Replie sur le centre du cadre si une clé inconnue arrivait. */
export function ancreDeLaPastille(pastille: PastilleVue): {
  readonly gauche: string;
  readonly haut: string;
} {
  return ANCRES[pastille.cle] ?? { gauche: "50%", haut: "50%" };
}
