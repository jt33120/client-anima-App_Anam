/**
 * copie-profil.ts — LE PROFIL (retour du 2026-08-23).
 *
 * « Il manque aussi un bouton "Profil" avec les paramètres, où on peut réinitialiser ses infos,
 * changer son nom, gérer son abonnement etc. »
 *
 * ══ CE QUI MANQUAIT N'ÉTAIT PAS DES ÉCRANS, C'ÉTAIT UNE PORTE ═══════════════════════════════════
 *
 * Les écrans existaient tous — réglages, mémoire, données, abonnement, heure de naissance, type —
 * et AUCUN n'était atteignable autrement qu'en tapant son URL. C'est une dette déjà inscrite dans
 * l'en-tête de `/reglages` (« elle n'est atteignable que par URL tant que ce menu n'existe pas »),
 * et elle vaut pour cinq haltes. Ce fichier est ce menu.
 *
 * ⚠️ CE N'EST PAS UN TABLEAU DE BORD. Aucun chiffre, aucun état de compte affiché ici, aucune
 * jauge : FR-031 vaut sur cette page comme ailleurs, et un profil est l'endroit où l'on va CHANGER
 * quelque chose, pas où l'on se regarde.
 *
 * Module PUR (AD-1). La copie vit hors du composant pour qu'un test la passe aux détecteurs.
 */

export const TITRE_HALTE = "Profil";

export const INTRODUCTION =
  "Ce qui te concerne, et tout ce que tu peux changer. Rien ici n’est définitif, sauf ce qui le dit.";

export const SECTION_NOM = "Ton nom";
export const NOM_DESCRIPTION =
  "Le prénom est celui qu’Anam emploie en te parlant. Le nom complet, lui, ne sert qu’au calcul des nombres — il n’est affiché nulle part et rien ne t’oblige à le donner.";
export const LABEL_PRENOM = "Prénom";
export const LABEL_NOM_COMPLET = "Nom complet";
export const AIDE_NOM_COMPLET = "Facultatif. Le laisser vide retire simplement les nombres qui en dépendent.";
export const ACTION_ENREGISTRER = "Enregistrer";
export const NOM_ENREGISTRE = "C’est enregistré.";
export const NOM_VIDE = "Il faut un prénom — même un surnom, même une initiale.";
export const NOM_TROP_LONG = "C’est trop long pour tenir dans un prénom.";
export const NOM_ECHEC = "Je n’ai pas réussi à enregistrer. Réessaie dans un moment.";

/**
 * ⚠️ CHANGER LE NOM COMPLET CHANGE LES NOMBRES, ET IL FAUT LE DIRE AVANT. Les nombres d'expression,
 * intime et de personnalité sont calculés depuis les lettres du nom. Quelqu'un qui corrige une
 * faute de frappe verrait trois cartes changer sans comprendre pourquoi — et croirait à une panne.
 */
export const NOM_PREVIENT_LES_NOMBRES =
  "Changer le nom complet recalcule les nombres qui en viennent. Ta date de naissance, elle, ne bouge pas.";

/**
 * ⚠️ LA LISTE D'ENTRÉES A ÉTÉ RETIRÉE D'ICI LE 2026-08-25 (Story 7.2), ET C'EST UNE SUPPRESSION,
 * PAS UN DÉPLACEMENT DE CONFORT.
 *
 * `/profil` a été livré le 2026-08-23 comme réponse d'urgence à « il manque un bouton Profil » :
 * une page pleine listant six liens, faute de menu de compte. Le menu de compte EST cette réponse
 * (`lib/domain/menu-compte.ts`), et maintenir les deux listes garantissait qu'elles divergeraient
 * au premier ajout — une entrée nouvelle dans l'une, absente de l'autre, sans que rien ne rougisse.
 *
 * `tests/menu-compte-frontiere.test.ts` refuse désormais qu'une SECONDE constante d'entrées de
 * compte existe dans le dépôt.
 *
 * Ce qui reste ici est la seule chose que `/profil` porte et qui n'existe nulle part ailleurs : le
 * FORMULAIRE DE NOM. L'amendement d'`EXPERIENCE.md` du 2026-08-25 (§6) le déménage vers `/reglages`
 * et fait disparaître `/profil` ; c'est la Story 7.3 qui pose ce geste, quand la feuille de menu
 * existera. Le supprimer avant elle retirerait le seul moyen de corriger son prénom.
 *
 * ⚠️ ET LES DEUX ENTRÉES QUI ONT QUITTÉ CETTE LISTE SANS ENTRER DANS LE MENU — « Ton heure de
 * naissance » et « Ton type » — ne sont PAS perdues : elles vivent sous la halte « Ton socle »
 * (`PORTES_DU_SOCLE`, amendement §1), au contact du manque qu'elles réparent.
 */
