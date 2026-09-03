/**
 * echelle-likert.ts — L'ÉCHELLE DE FRÉQUENCE, PARTAGÉE PAR TOUS LES QUESTIONNAIRES (2026-09-03).
 *
 * Extraite de `enneagramme.ts` le jour où le Big Five est arrivé avec le même besoin. Ce n'est pas
 * une factorisation de confort : la règle d'appariement ci-dessous est celle dont l'ennéagramme
 * écrivait qu'elle « survit à toutes les relectures » quand elle est fausse. Deux copies de cette
 * règle-là, c'est deux occasions de la corriger d'un seul côté.
 *
 * `enneagramme.ts` RÉEXPORTE tout ce fichier : aucun import existant n'a bougé.
 */

/**
 * Les quatre degrés d'une réponse.
 *
 * Les valeurs sont des ENTIERS ORDONNÉS parce qu'on les additionne. Elles ne s'affichent jamais :
 * l'écran ne montre que des libellés de fréquence, jamais 0, 1, 2, 3.
 */
export type NiveauReponse = 0 | 1 | 2 | 3;

/** `null` est une réponse explicite (« Je ne sais pas »), jamais un zéro déguisé. */
export type ValeurReponse = NiveauReponse | null;

export const NIVEAUX: readonly NiveauReponse[] = Object.freeze([0, 1, 2, 3] as const);

export function estNiveauReponse(v: unknown): v is NiveauReponse {
  return v === 0 || v === 1 || v === 2 || v === 3;
}

export function estValeurReponse(v: unknown): v is ValeurReponse {
  return v === null || estNiveauReponse(v);
}

/**
 * Une réponse est appariée par IDENTIFIANT, jamais par position (D7).
 *
 * ⚠️ C'est la garde la plus discrète du questionnaire et la plus coûteuse à rater. Un appariement
 * positionnel — « la 3ᵉ réponse va au 3ᵉ item » — survit à toutes les relectures et casse
 * silencieusement le jour où quelqu'un insère, retire ou réordonne une question. Le résultat rendu
 * serait alors FAUX de façon parfaitement déterministe : invisible aux tests de déterminisme, et
 * invisible à l'écran tant que le corpus est vide, puisque deux textes non écrits sont égaux.
 */
export interface ReponseItem {
  readonly itemId: string;
  readonly niveau: ValeurReponse;
}
