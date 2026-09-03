/**
 * menu-compte.ts — LE CATALOGUE DU MENU DE COMPTE (Story 7.2).
 *
 * ══ CE MODULE EST LA RÉPONSE À NEUF COMMENTAIRES ÉCRITS DANS LE DÉPÔT ═══════════════════════════
 *
 * « elle n'est atteignable que par URL tant que le menu de compte n'existe pas » —
 * `app/reglages/page.tsx`, `app/lectures/page.tsx`, `app/memoire/page.tsx`, `app/ancrages/page.tsx`,
 * `lib/courriel/gabarits.ts`, et jusqu'à `app/(auth)/consentement/revoquer/page.tsx` qui l'écrivait
 * déjà en Story 1.6. `EXPERIENCE.md` le spécifie depuis le 2026-07-21 (lignes 84 et 86) et il n'a
 * jamais été construit. Ce qui a été livré à la place — trois mots flottants dont « Profil » atterrit
 * au centre horizontal de l'écran — est la divergence, pas la demande.
 *
 * Ce fichier est le MODÈLE. Le glyphe et la feuille qui le dessinent sont la Story 7.3 ; ce module
 * est écrit AVANT eux, avec sa garde, parce que c'est le type qui protège FR-031 et qu'une garde
 * écrite après le composant garde ce que le composant fait déjà.
 *
 * ══ L'ORDRE EST INVARIABLE, ET IL EST VÉRIFIÉ POSITION PAR POSITION ═════════════════════════════
 *
 * `EXPERIENCE.md` ligne 86, amendée le 2026-08-25. « Retrouver chaque chose à la même place » n'est
 * pas une préférence esthétique : c'est ce qui permet d'atteindre une entrée sans la lire, au bout
 * de trois usages. Un tri — alphabétique, par fréquence, par récence — détruit exactement ça.
 *
 * ══ ⚠️ TROIS REFUS TENUS ════════════════════════════════════════════════════════════════════════
 *
 * 1. **« Aide et ressources » est la PREMIÈRE entrée, toujours** (FR-077, `EXPERIENCE.md` ligne 73)
 *    — et elle est là **EN PLUS** du « ? » de la surimpression, **jamais à la place**. FR-077 exige
 *    une entrée « toujours présente et indépendante du menu de compte » : un menu qui absorberait
 *    la porte de secours la rendrait dépendante d'un état d'ouverture, donc perdable.
 *
 * 2. **`/ancrages` N'Y FIGURE PAS**, tant qu'aucun ancrage n'est écrit (`deferred-work.md:899-903`).
 *    Une entrée qui mène systématiquement à « Anima n'a pas encore écrit d'ancrage » se lit comme
 *    une PANNE ; la même phrase atteinte par URL se lit comme un ÉTAT. La différence est le contrat
 *    qu'une entrée de menu passe : elle promet qu'il y a quelque chose derrière.
 *
 * 3. **AUCUN CHAMP OÙ LOGER UN COMPTE** (FR-031, DUR). Pas de pastille de non-lu sur « La synthèse »,
 *    pas de « 3 nouvelles » sur « Ce qu'Anam retient », pas de cadenas sur « L'abonnement ». La
 *    leçon de la 4.10 est que le compte fuit par le TYPE : `tests/menu-compte-frontiere.test.ts`
 *    refuse tout champ capable d'en porter un. S'il n'existe aucun endroit où l'écrire, il n'y a
 *    rien à masquer au rendu.
 */

/**
 * Une entrée. Trois chaînes, et RIEN d'autre.
 *
 * ⚠️ NE JAMAIS AJOUTER DE BOOLÉEN NON PLUS. Un `aDuNouveau: boolean` serait la porte : le rendu
 * s'en servirait pour dessiner une pastille, et FR-031 ne tiendrait plus qu'à la discipline. Même
 * même raisonnement que dans les autres modèles de vue : l'existence d'un état ne doit jamais
 * devenir un booléen décoratif exploitable comme pastille.
 */
export interface EntreeMenu {
  readonly titre: string;
  /** Ce qu'on trouve derrière, en une phrase. Jamais un état, jamais un compte. */
  readonly quoi: string;
  readonly url: string;
}

/**
 * Un groupe donne une place stable aux portes sans leur ajouter d'état.
 *
 * Le catalogue était auparavant une liste plate de neuf lignes : le socle, la mémoire et les
 * lectures se confondaient visuellement avec l'abonnement et les droits RGPD. Le groupe porte
 * uniquement un libellé et des entrées ; il n'offre toujours aucun endroit où glisser un compteur,
 * un badge ou un état commercial (FR-031).
 */
export interface GroupeMenu {
  readonly titre: "Aide" | "Explorer" | "Compte" | "Confidentialité";
  readonly entrees: readonly EntreeMenu[];
}

/**
 * Le nom ACCESSIBLE du glyphe. Le dessin, lui, est décoratif (`aria-hidden`).
 *
 * ⚠️ UN PICTOGRAMME QUI REMPLACE UN MOT SANS LE RENDRE AU NOM ACCESSIBLE est la façon la plus
 * courante de casser une porte sans s'en apercevoir : le lecteur d'écran, la recherche vocale et la
 * tabulation cessent de trouver ce qu'ils trouvaient avant. Même leçon que le « ? » du 2026-08-23,
 * qui garde `aria-label="Aide"`.
 */
export const LIBELLE_GLYPHE = "Ouvrir ton espace";
export const TITRE_FEUILLE = "Ton espace";
export const LIBELLE_FERMER = "Fermer";

export const GROUPES_MENU: readonly GroupeMenu[] = Object.freeze([
  Object.freeze({
    titre: "Aide",
    entrees: Object.freeze([
      {
        // FR-077 — première, toujours. Le « ? » de la surimpression reste par ailleurs indépendant.
        titre: "Aide et ressources",
        quoi: "Soutien humain, urgences et limites d’Anam.",
        url: "/aide",
      },
    ]),
  }),
  Object.freeze({
    titre: "Explorer",
    entrees: Object.freeze([
      {
        titre: "Ton socle",
        quoi: "Astrologie, nombres et profil psychologique.",
        url: "/socle",
      },
      {
        titre: "Ce qu’Anam retient",
        quoi: "Relire, corriger ou effacer ses souvenirs.",
        url: "/memoire",
      },
      {
        titre: "La synthèse",
        quoi: "Les dernières semaines, reliées ensemble.",
        url: "/synthese",
      },
      {
        titre: "Mes lectures",
        quoi: "Retrouver les cartes déjà tirées.",
        url: "/lectures",
      },
    ]),
  }),
  Object.freeze({
    titre: "Compte",
    entrees: Object.freeze([
      {
        titre: "L’abonnement",
        quoi: "Voir ton offre ou l’arrêter.",
        url: "/abonnement",
      },
      {
        titre: "Réglages",
        quoi: "Prénom, rythme quotidien et notifications.",
        url: "/reglages",
      },
    ]),
  }),
  Object.freeze({
    titre: "Confidentialité",
    entrees: Object.freeze([
      {
        titre: "Mes données",
        quoi: "Télécharger tes données ou tout effacer.",
        url: "/mes-donnees",
      },
      {
        /** Cette porte dit explicitement qu'elle mène aussi au retrait du consentement. */
        titre: "Ce que j’ai accepté",
        quoi: "Relire ou retirer ton consentement.",
        url: "/consentement/revoquer",
      },
    ]),
  }),
]);

/** Vue plate dérivée pour les inventaires et les gardes : les groupes restent l'unique catalogue. */
export const ENTREES_MENU: readonly EntreeMenu[] = Object.freeze(
  GROUPES_MENU.flatMap((groupe) => groupe.entrees),
);

/**
 * ⚠️ CE QUI N'EST PAS DANS LE MENU, ET POURQUOI — la liste est GARDÉE (`menu-compte-frontiere`).
 *
 * Même renversement de charge que l'inventaire de `pied-halte.ts` : on ne compte pas sur la
 * discipline de celui qui ajoutera la prochaine page pour qu'il se demande si elle a sa place ici.
 * Toute halte du produit est soit dans `ENTREES_MENU`, soit ici avec un motif écrit.
 */
export const HORS_MENU: Readonly<Record<string, string>> = Object.freeze({
  ancrages:
    "aucun ancrage n’est écrit (deferred-work.md:899-903) : une entrée qui mène toujours à « Anima n’a pas encore écrit d’ancrage » se lit comme une panne, la même phrase atteinte par URL se lit comme un état",
  "heure-naissance":
    "elle CORRIGE le socle : elle vit sous la halte « Ton socle », au contact du manque qu’elle répare (amendement du 2026-08-25, §1)",
  enneagramme:
    "même raison que l’heure de naissance : c’est une porte du socle, pas une entrée de compte",
  // Les deux modules livrés le 2026-09-03 s'atteignent par la halte « Psychologie », qui est
  // elle-même hors menu pour la raison écrite juste en dessous. Les lister ici les rendrait plus
  // proéminents que l'univers qui les contient, et le menu de compte redeviendrait un sommaire du
  // produit — exactement ce que les trois groupes corrigent.
  "big-five":
    "même raison que l’ennéagramme : une porte de l’univers Psychologie, pas une entrée de compte",
  "human-design":
    "même raison que l’ennéagramme : une porte de l’univers Psychologie, pas une entrée de compte",
  psychologie:
    "cet univers se découvre depuis « Aujourd’hui » : le dupliquer dans le menu de compte recréerait le mélange entre navigation quotidienne et administration que les groupes corrigent",
  reperes:
    "le mode d’emploi est replié dans /aide depuis le 2026-08-23 ; deux portes vers le même contenu divergeraient",
  // ⚠️ `/profil` N'EST PLUS LISTÉ ICI PARCE QU'IL N'EXISTE PLUS (Story 7.3b, 2026-08-25). Une
  // exclusion qui désigne une page disparue est un mensonge que le test des « fantômes » refuse.
});
