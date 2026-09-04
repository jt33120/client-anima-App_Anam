/**
 * copie-portail.ts — LES MOTS DU PORTAIL D'ENTRÉE (2026-09-03).
 *
 * Trois chaînes, et c'est délibérément tout. Un écran de lancement est le seul endroit du produit
 * que personne n'a demandé à lire : chaque mot de plus y est un péage payé à chaque ouverture.
 *
 * ⚠️ CE N'EST PAS DU CORPUS. Ces phrases disent l'ÉTAT DU PRODUIT (« ça arrive »), jamais ce que
 * quoi que ce soit SIGNIFIE. Elles se rendent dans la voix du produit, jamais dans celle d'Anam :
 * le portail précède la rencontre, et faire parler Anam avant qu'elle soit là serait un mensonge
 * de forme — la même règle qui tient les haltes (`app/enneagramme/resultat.tsx`).
 */

/** Le nom, et rien d'autre. C'est lui qui porte le scintillement (`globals.css`). */
export const NOM_PORTAIL = "Anam";

/**
 * La ligne d'attente.
 *
 * ⚠️ ELLE NE PROMET RIEN ET NE COMPTE RIEN. « Presque prêt », « plus que quelques secondes » ou
 * un pourcentage seraient trois façons d'annoncer un futur que personne ne connaît — FR-053 pour la
 * première, FR-031 pour la dernière. Ce qui reste vrai à toute seconde : quelque chose se pose.
 */
export const ATTENTE_PORTAIL = "Le temps que tout se pose.";

/**
 * Ce que le lecteur d'écran entend, une fois.
 *
 * ⚠️ LE PORTAIL N'EST PAS `aria-hidden` EN ENTIER, contrairement à `HalteEnAttente` — et la
 * différence est motivée. Une halte qui arrive est annoncée par la NAVIGATION elle-même : le
 * squelette n'a rien à ajouter. Un lancement d'application, lui, n'est annoncé par personne : se
 * taire ici laisserait quelqu'un devant un silence sans savoir si l'app répond.
 */
export const ANNONCE_PORTAIL = "Anam s’ouvre.";
