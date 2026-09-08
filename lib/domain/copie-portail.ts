/**
 * copie-portail.ts — LES MOTS DU PORTAIL D'ENTRÉE (2026-09-03).
 *
 * Deux chaînes, et c'est délibérément tout. Un écran de lancement est le seul endroit du produit
 * que personne n'a demandé à lire : chaque mot de plus y est un péage payé à chaque ouverture.
 *
 * ⚠️ CE N'EST PAS DU CORPUS. Ces phrases disent l'ÉTAT DU PRODUIT (« ça arrive »), jamais ce que
 * quoi que ce soit SIGNIFIE. Elles se rendent dans la voix du produit, jamais dans celle d'Anam :
 * le portail précède la rencontre, et faire parler Anam avant qu'elle soit là serait un mensonge
 * de forme — la même règle qui tient les haltes (`app/enneagramme/resultat.tsx`).
 */

/** L'accueil sous la signature de marque. */
export const NOM_PORTAIL = "Bienvenue";

/**
 * Ce que le lecteur d'écran entend, une fois.
 *
 * ⚠️ LE PORTAIL N'EST PAS `aria-hidden` EN ENTIER, contrairement à `HalteEnAttente` — et la
 * différence est motivée. Une halte qui arrive est annoncée par la NAVIGATION elle-même : le
 * squelette n'a rien à ajouter. Un lancement d'application, lui, n'est annoncé par personne : se
 * taire ici laisserait quelqu'un devant un silence sans savoir si l'app répond.
 */
export const ANNONCE_PORTAIL = "Bienvenue dans Anam.";
