import type { BibliothequeVue } from "./types";

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

export type JourAccueil = BibliothequeVue["jour"];

/** La date du foyer, sans année : le jour courant est le titre de la page, pas une archive. */
export function libelleDateAccueil(jour: JourAccueil): string {
  return `${jour.j} ${MOIS[jour.m - 1]}`;
}
