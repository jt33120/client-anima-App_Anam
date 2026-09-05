/**
 * copie-entree.ts — LES MOTS DE LA PORTE D'ENTRÉE (2026-09-05).
 *
 * ══ POURQUOI CE FICHIER EXISTE : UN RENOMMAGE A COÛTÉ HUIT JOURS DE CI AVEUGLE ═════════════════
 *
 * Le 2026-08-28 (commit `0a06649`), le bouton d'envoi du code est passé de « Recevoir mon lien » à
 * « Me reconnecter par e-mail ». Le libellé vivait EN DUR dans `formulaire-entree.tsx`, et la suite
 * navigateur le cherchait EN DUR de son côté, en six endroits. Le locator est devenu muet.
 *
 * Ce qui a suivi vaut d'être écrit, parce que le défaut n'est pas le renommage :
 *
 *   - `playwright.config.ts` ne posait aucun `actionTimeout`. Un `click()` sur un locator qui ne
 *     résout rien attend donc SANS FIN, jusqu'au plafond du test — 45 secondes.
 *   - `ouvrirUnCompteNeuf` est la porte de douze des treize fichiers de specs. Les 45 s se sont
 *     donc payées quatre-vingt-dix fois : l'étape est passée de 14 min à 69 min.
 *   - Et le message rendu était `Test timeout of 45000ms exceeded.` — sans sélecteur, sans étape.
 *     Huit jours de rouge n'ont rien appris à personne.
 *
 * ⚠️ LA LEÇON N'EST PAS « MIEUX RELIRE ». Elle est qu'un libellé recopié dans deux fichiers est un
 * libellé qui dérivera. Ces constantes sont la SOURCE : le formulaire les rend, la suite navigateur
 * les cherche. Un prochain renommage change un seul endroit et emporte les deux — ou ne compile
 * pas. C'est la même règle que partout ici : ce qui doit rester d'accord ne se recopie pas.
 *
 * ⚠️ ET ON NE PASSE PAS PAR UN `data-testid`. La suite interroge le produit par RÔLE et par NOM
 * ACCESSIBLE — c'est ce qui lui permet de voir un défaut d'accessibilité en même temps qu'un défaut
 * de parcours. Un attribut réservé aux tests découplerait le test du nom que la personne ENTEND, et
 * rendrait précisément cette rupture-ci indétectable.
 */

/** L'étiquette du champ d'adresse. Le tutoiement est celui du produit, partout. */
export const ETIQUETTE_ADRESSE = "Ton adresse e-mail";

/**
 * Le bouton qui demande le code.
 *
 * « Me reconnecter par e-mail » plutôt que « Recevoir mon lien » : ce qui arrive est un code autant
 * qu'un lien, et c'est le RÉSULTAT qui se nomme sur un bouton, jamais le moyen.
 */
export const BOUTON_DEMANDER_CODE = "Me reconnecter par e-mail";

/** Ce que le bouton dit pendant l'envoi. Un état, pas une promesse de durée (FR-053). */
export const BOUTON_DEMANDER_CODE_EN_COURS = "Envoi…";

/** L'étiquette du champ où se tape le code. */
export const ETIQUETTE_CODE = "Le code reçu";

/** Le bouton qui vérifie le code. */
export const BOUTON_ENTRER_AVEC_CODE = "Entrer avec ce code";

/** Ce que ce bouton dit pendant la vérification. */
export const BOUTON_ENTRER_AVEC_CODE_EN_COURS = "Vérification…";
