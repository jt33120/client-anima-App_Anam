import type { Locator, Page } from "@playwright/test";
import {
  BOUTON_DEMANDER_CODE,
  BOUTON_ENTRER_AVEC_CODE,
  ETIQUETTE_ADRESSE,
  ETIQUETTE_CODE,
  // Chemin RELATIF, comme `clavier.spec.ts` le fait déjà pour `../app/styles/tokens` : c'est la
  // convention du dossier, et elle ne dépend pas de la résolution d'alias du transpileur de
  // Playwright.
} from "../lib/domain/copie-entree";

/**
 * _porte.ts — LES QUATRE COMMANDES DE `/entrer`, DÉSIGNÉES DEPUIS LA SOURCE (2026-09-05).
 *
 * ══ CE FICHIER EST LA RÉPARATION D'UNE PANNE DE HUIT JOURS ═════════════════════════════════════
 *
 * Le 2026-08-28, le bouton d'envoi du code a été renommé dans le produit. Six endroits de cette
 * suite le cherchaient sous son ancien nom, écrit à la main : `e2e/_entrer.ts` et cinq lignes de
 * `e2e/entree.spec.ts`. Quatre-vingt-dix tests sont morts, chacun sur quarante-cinq secondes de
 * silence, et le journal de CI n'a rien dit d'autre que « Test timeout of 45000ms exceeded ».
 *
 * Les libellés viennent maintenant de `lib/domain/copie-entree.ts` — LE MÊME module que rend le
 * formulaire. Un renommage change une constante et emporte les deux côtés. Il ne peut plus laisser
 * un locator muet derrière lui.
 *
 * ⚠️ TOUJOURS PAR RÔLE ET NOM ACCESSIBLE, JAMAIS PAR `data-testid`. Ce qu'on cherche ici est
 * exactement ce qu'un lecteur d'écran annonce : si le nom accessible se dégrade, ces locators
 * doivent rougir. Un attribut réservé aux tests survivrait à une régression d'accessibilité, et
 * c'est précisément la classe de défaut que cette suite existe pour voir.
 *
 * ⚠️ ET ON UTILISE LES CONSTANTES ENTIÈRES, pas un fragment. `getByRole` fait par défaut une
 * correspondance EXACTE sur le nom accessible ; passer la chaîne complète est donc à la fois plus
 * strict et plus lisible qu'une expression régulière partielle, et c'est ce qui fait qu'un libellé
 * amputé se voit.
 */

/** Le champ d'adresse. */
export const champAdresse = (page: Page): Locator => page.getByLabel(ETIQUETTE_ADRESSE);

/** Le bouton qui demande le code. C'est celui dont le renommage a tout cassé. */
export const boutonDemanderCode = (page: Page): Locator =>
  page.getByRole("button", { name: BOUTON_DEMANDER_CODE });

/** Le champ où se tape le code reçu. */
export const champCode = (page: Page): Locator => page.getByLabel(ETIQUETTE_CODE);

/** Le bouton qui vérifie le code. */
export const boutonEntrerAvecCode = (page: Page): Locator =>
  page.getByRole("button", { name: BOUTON_ENTRER_AVEC_CODE });
