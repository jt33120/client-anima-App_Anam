/**
 * copie-guide.ts — LE TOUR GUIDÉ : ses étapes, dans l'ordre (retour du 2026-08-20).
 *
 * ══ POURQUOI CE FICHIER REMPLACE UNE PAGE ═══════════════════════════════════════════════════════
 *
 * La première réponse au « il est où le tutoriel ? » a été une PAGE : `/reperes`, un document qu'on
 * lit de haut en bas. Le retour a été net et juste — « le tutoriel doit me guider dans
 * l'application, pas être juste une liste de texte, elle doit mettre en évidence certaines parties,
 * entourer, l'utilisateur clique sur suivant et on avance ». Un document explique ; un tour
 * DÉSIGNE. Ce ne sont pas deux niveaux de qualité du même objet, ce sont deux objets : on garde les
 * deux, et le tour peut renvoyer au document.
 *
 * ⚠️ CHAQUE ÉTAPE VISE UN ÉLÉMENT QUI EXISTE VRAIMENT. `cible` est un sélecteur CSS résolu à
 * l'écran. Une étape dont la cible est absente est SAUTÉE — jamais un projecteur sur un rectangle
 * vide, jamais une flèche vers rien. C'est ce qui permet au tour de traverser des écrans dont le
 * contenu dépend du compte (un arbre vide n'a pas de branche à montrer).
 *
 * Module PUR : aucune dépendance React. Un test peut passer ces textes aux détecteurs de voix sans
 * monter quoi que ce soit.
 */

import type { IdRegion } from "@/lib/scene";

export interface EtapeGuide {
  /** La région où l'étape a lieu. Le tour y va lui-même avant de désigner. */
  readonly region: IdRegion;
  /**
   * Le sélecteur de ce qu'on met en évidence. `null` = aucune cible : la bulle se pose au centre,
   * pour ce qui parle de l'écran ENTIER plutôt que d'un élément.
   */
  readonly cible: string | null;
  readonly titre: string;
  readonly texte: string;
}

export const TITRE_GUIDE = "Le tour du lieu";
export const SUIVANT = "Suivant";
export const PRECEDENT = "Précédent";
export const TERMINER = "J’ai compris";
export const QUITTER = "Passer le tour";
export const RELANCER = "Faire le tour de l’application";

/**
 * ⚠️ L'ORDRE SUIT LE PARCOURS RÉEL, PAS L'ORDRE DU CODE. On commence là où l'on atterrit
 * (l'accueil), on va où l'on a le plus de chances d'aller ensuite (Anam), et on finit par ce qui se
 * remplit avec le temps (l'arbre). Un tour qui commence par la fonctionnalité la plus rare est un
 * tour qu'on abandonne.
 */
export const ETAPES: readonly EtapeGuide[] = Object.freeze([
  {
    region: "accueil",
    cible: null,
    /* ⚠️ CE TITRE DISAIT « TROIS PLACES, ET C'EST TOUT » — le MÊME nom accessible que le bloc de
       l'accueil, qui s'intitule « Trois places ». Deux entêtes de niveau 2 portant le même nom sur
       le même écran : au lecteur d'écran, on ne peut plus les distinguer, et une garde qui en
       cherchait un en trouvait deux. On nomme l'étape par ce qu'elle dit, pas par ce qu'elle
       répète. */
    /**
     * ⚠️ CE TEXTE DISAIT « PAS DE MENU CACHÉ, PAS DE SOUS-MENUS », ET IL A CESSÉ D'ÊTRE VRAI LE
     * 2026-08-25 : la Story 7.3 pose un glyphe de compte qui ouvre une feuille.
     *
     * Il est réécrit DANS LE MÊME COMMIT que le menu, et pas plus tard, pour une raison mesurée
     * cinq jours plus tôt : `Guide.tsx` FRANCHIT SANS BRUIT une étape dont la cible est absente —
     * c'est voulu (un compte sans arbre saute l'étape de l'arbre) — donc une garde de tour ne peut
     * pas dire qu'un TEXTE a cessé d'être vrai. Le 2026-08-23, une étape a décrit pendant deux
     * jours une interface qui n'existait plus, et la CI est restée verte.
     *
     * Ce que le tour promet désormais est ce qui reste vrai : trois LIEUX, et tout le reste du
     * compte derrière une seule porte nommée. Ce n'est pas « pas de menu » — c'est « un seul ».
     */
    titre: "Le lieu tient en trois endroits",
    texte:
      "Ce lieu tient en trois endroits, et je te les montre un par un. Tout ce qui te concerne — " +
      "tes nombres, tes données, ton abonnement, l’aide — vit derrière la silhouette en haut à " +
      "droite. Une seule porte, jamais un labyrinthe.",
  },
  {
    region: "accueil",
    cible: "nav[aria-label='Régions']",
    titre: "Ta barre",
    texte:
      "Les trois noms sont toujours là — en bas sur un téléphone, à gauche sur un grand écran. Tu " +
      "peux aussi glisser l’écran de côté au doigt pour passer de l’un à l’autre.",
  },
  {
    region: "accueil",
    cible: "[class*='bibliotheque'] article",
    /**
     * ⚠️ RÉÉCRIT LE 2026-08-25 (Story 7.7), DANS LE MÊME COMMIT QUE L'ÉCRAN. « Ce que le jour
     * propose » décrivait un accueil de cinq cartes dont TROIS ne changeaient jamais — le thème
     * natal et les nombres sont figés à la naissance. Le tour promettait donc du quotidien devant
     * un écran figé, et personne ne pouvait le voir : `Guide.tsx` franchit sans bruit une étape
     * dont la cible manque, mais il ne sait pas dire qu'un TEXTE a cessé d'être vrai.
     */
    titre: "L’accueil",
    texte:
      "Ce qui a changé depuis hier, et rien d’autre : le mantra du jour, le ciel du jour. Ton " +
      "thème et tes nombres ne bougent pas d’un jour à l’autre — ils t’attendent dans « Ton " +
      "socle », en entier. Rien à rattraper si tu passes un jour, rien qui compte tes visites.",
  },
  {
    region: "anam",
    cible: "form, [class*='composeur']",
    titre: "Anam",
    texte:
      "C’est ici qu’on se parle. Écris comme tu écrirais à quelqu’un : pas de mots-clés, pas de " +
      "questions à cocher. Anam est une intelligence artificielle, et elle le dit elle-même.",
  },
  {
    region: "arbre",
    cible: "[class*='troncSeul'], [class*='canevas']",
    titre: "Ta graine",
    texte:
      "Ton arbre commence par une graine : ce qui était déjà là à ta naissance. Il pousse à mesure " +
      "que des choses se nomment quand tu parles à Anam — jamais sur l’instant, jamais sans que tu l’aies " +
      "vu venir.",
  },
  {
    /**
     * ⚠️ CETTE ÉTAPE DISAIT UNE CHOSE FAUSSE, ET LE FILET NE POUVAIT PAS LE VOIR (2026-08-25).
     *
     * Elle visait `a[href='/reperes']` et affirmait « "Repères" est là en haut de chaque écran ».
     * Le lien a été retiré de la surimpression le 2026-08-23, quand Repères a été replié dans
     * `/aide`. Deux choses ont alors masqué le défaut :
     *   • `Guide.tsx` FRANCHIT SANS BRUIT une étape dont la cible est absente — c'est voulu (un
     *     compte sans arbre saute l'étape de l'arbre), et c'est ce qui a rendu la CI muette ;
     *   • mais `premier-passage.tsx` rend encore un lien vers `/reperes` (« Le lieu en entier »),
     *     et le tour guidé se joue PRÉCISÉMENT au premier passage. La cible était donc trouvée,
     *     l'étape s'affichait, et elle décrivait une interface qui n'existait plus.
     *
     * Une garde qui saute ce qu'elle ne trouve pas ne peut pas dire qu'un texte a cessé d'être
     * vrai. Ce que le tour désigne doit donc être ce qui est RÉELLEMENT permanent : la porte de
     * secours, qui est le seul contrôle du produit dont FR-077 exige qu'il soit toujours là.
     */
    region: "accueil",
    cible: "[class*='porteSecours']",
    titre: "Et si tu perds le fil",
    texte:
      "Le « ? » en haut reste là, sur chaque écran, quoi qu’il arrive : il mène directement à des " +
      "personnes joignables, si ça ne va pas. Il ne dépend pas du menu à côté de lui — même fermé, " +
      "même en panne, il est là. Tout ce que je viens de dire y est aussi écrit en plus long, et tu " +
      "peux refaire ce tour quand tu veux.",
  },
]);
