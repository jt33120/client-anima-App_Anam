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
 * raisonnement que `CarteAnamVue` (6.3), où l'existence d'un motif se lit à `ligne !== null`.
 */
export interface EntreeMenu {
  readonly titre: string;
  /** Ce qu'on trouve derrière, en une phrase. Jamais un état, jamais un compte. */
  readonly quoi: string;
  readonly url: string;
}

export const ENTREES_MENU: readonly EntreeMenu[] = Object.freeze([
  {
    // FR-077 — première, toujours. Aucune entrée ne passe devant, et le « ? » de la surimpression
    // reste par ailleurs, indépendant de ce menu.
    titre: "Aide et ressources",
    quoi: "Des personnes joignables, tout de suite, et ce qu’Anam ne peut pas faire.",
    url: "/aide",
  },
  {
    // Deuxième — amendement d'`EXPERIENCE.md` du 2026-08-25, §1. Le socle est ce que le produit
    // savait AVANT le premier mot ; « Ce qu'Anam retient » est ce qu'il a appris APRÈS.
    titre: "Ton socle",
    quoi: "Tes six nombres et leur sens, ton ciel de naissance, ton type — et ce qui manque, avec sa raison.",
    url: "/socle",
  },
  {
    titre: "Ce qu’Anam retient",
    quoi: "Les phrases qu’elle a gardées de ce que tu lui as dit. Tu peux les corriger ou les effacer une par une.",
    url: "/memoire",
  },
  {
    titre: "La synthèse",
    quoi: "Ce qu’Anam a écrit en relisant les dernières semaines.",
    url: "/synthese",
  },
  {
    titre: "Mes lectures",
    quoi: "Les cartes déjà tirées, et ce qui en a été écrit.",
    url: "/lectures",
  },
  {
    titre: "L’abonnement",
    quoi: "Ce qui est en cours, et comment l’arrêter. Arrêter prend autant de clics que commencer.",
    url: "/abonnement",
  },
  {
    titre: "Mes données",
    quoi: "Tout télécharger, ou tout effacer — définitivement, compte compris.",
    url: "/mes-donnees",
  },
  {
    /**
     * ⚠️ CETTE ENTRÉE MÈNE À UNE PAGE DE CONFIRMATION, PAS À UNE PAGE DE REVUE — et c'est écrit ici
     * plutôt que masqué. `EXPERIENCE.md` ligne 74 décrit « Ce que j'ai accepté » comme une surface
     * de consultation du consentement art. 9 et de la déclaration IA, révocables (FR-012). Elle
     * n'existe pas : la seule page du sujet s'intitule « Retirer ton consentement ».
     *
     * Deux mauvaises sorties étaient possibles. La retirer du menu : FR-012 exige que la révocation
     * soit atteignable, et l'omettre reviendrait à rendre un droit dépendant d'une URL connue. La
     * laisser avec un sous-titre neutre : on clique pour RELIRE et on atterrit sur RETIRER, ce qui
     * est un sursaut, pas une navigation.
     *
     * Elle reste donc, et son sous-titre DIT la destination. La page de revue est un manque nommé,
     * pas un oubli.
     */
    titre: "Ce que j’ai accepté",
    quoi: "Ton consentement à l’usage de tes confidences, la déclaration IA — et le retrait, si tu le veux.",
    url: "/consentement/revoquer",
  },
  {
    titre: "Réglages",
    quoi: "Ton prénom, le rythme quotidien, et ce que ton téléphone a le droit d’afficher.",
    url: "/reglages",
  },
]);

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
    "même raison que l’heure de naissance — c’est une porte du socle, pas une entrée de compte",
  reperes:
    "le mode d’emploi est replié dans /aide depuis le 2026-08-23 ; deux portes vers le même contenu divergeraient",
  profil:
    "il DISPARAÎT (amendement du 2026-08-25, §6) — ce menu est ce qui le remplace ; il ne peut pas se lister lui-même",
});
