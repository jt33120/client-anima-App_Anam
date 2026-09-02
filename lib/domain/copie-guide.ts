/**
 * copie-guide.ts — LE TOUR GUIDÉ : ses étapes, dans l'ordre (retour du 2026-08-20, réécrit le
 * 2026-09-01).
 *
 * ══ POURQUOI UN TOUR ET PAS UNE PAGE (2026-08-20) ═══════════════════════════════════════════════
 *
 * La première réponse au « il est où le tutoriel ? » a été une PAGE : `/reperes`, un document qu'on
 * lit de haut en bas. Le retour a été net et juste : « le tutoriel doit me guider dans
 * l'application, pas être juste une liste de texte, elle doit mettre en évidence certaines parties,
 * entourer, l'utilisateur clique sur suivant et on avance ». Un document explique ; un tour
 * DÉSIGNE. Ce sont deux objets, on garde les deux, et le tour peut renvoyer au document.
 *
 * ══ POURQUOI CINQ ÉTAPES COURTES (2026-09-01) ═══════════════════════════════════════════════════
 *
 * Retour terrain du fondateur, mot pour mot : « Les textes du tutoriel ne sont pas clairs, trop
 * générés par IA. Pas de "-". Trop directif. Il faut que les gens se sentent en confiance. [...]
 * Beaucoup plus concis, une ou deux phrases très simples par étape. L'app est beaucoup trop
 * verbeuse. »
 *
 * Ce que ça change, et ce qui le garde (`tests/guide-cibles.test.ts`) :
 *   • UNE OU DEUX PHRASES par étape, 200 caractères au plus. La version précédente allait jusqu'à
 *     quatre phrases et 300 caractères ; la bulle recouvrait ce qu'elle désignait, et personne ne
 *     lisait la fin.
 *   • AUCUN TIRET cadratin ni demi-cadratin. Le tiret est la ponctuation reconnue « très IA » ;
 *     le deux-points et le point disent la même chose.
 *   • AUCUNE INJONCTION. « Écris comme… », « pas de mots-clés », « rien à rattraper » : le tour
 *     disait à la personne quoi faire et quoi ne pas faire. Il dit maintenant ce qui est là, au
 *     présent, et la laisse faire.
 *   • AUCUNE FORMULE CREUSE. « Une seule porte, jamais un labyrinthe », « quoi qu'il arrive »,
 *     « jamais sur l'instant, jamais sans que tu l'aies vu venir » : des cascades de négations
 *     qui rassurent moins qu'elles n'inquiètent. La confiance vient d'une phrase simple.
 *   • Le mot collectif des trois lieux est « dimension » (retour du 2026-09-02, porté par
 *     `render/premier-passage.tsx` et `tests/trois-dimensions.test.ts`) ; le tour parle sous le
 *     même mot que l'écran qu'il désigne.
 *
 * ══ CE QUI A ÉTÉ RETIRÉ : L'ÉTAPE « ET SI TU PERDS LE FIL » ═════════════════════════════════════
 *
 * Elle désignait le « ? » de la surimpression (`[class*='porteSecours']`) en quatre phrases. Le
 * fondateur l'a retirée, et la raison tient : ce lien est le SEUL contrôle du produit dont FR-077
 * exige qu'il soit toujours là, sur chaque écran, hors du menu. Une aide qui est toujours visible
 * n'a pas besoin qu'un tour l'explique ; l'expliquer en quatre phrases disait surtout à la personne
 * qu'elle pourrait perdre le fil. Le tour finit sur l'arbre, c'est-à-dire sur ce qui grandit.
 *
 * ══ CE QUI NE CHANGE PAS ═══════════════════════════════════════════════════════════════════════
 *
 * ⚠️ CHAQUE ÉTAPE VISE UN ÉLÉMENT QUI EXISTE VRAIMENT. `cible` est un sélecteur CSS résolu à
 * l'écran. Une étape dont la cible est absente est SAUTÉE, jamais un projecteur sur un rectangle
 * vide. C'est ce qui permet au tour de traverser des écrans dont le contenu dépend du compte.
 *
 * ⚠️ ET C'EST POUR ÇA QU'UN TEXTE SE RÉÉCRIT DANS LE MÊME COMMIT QUE L'ÉCRAN. `Guide.tsx` franchit
 * sans bruit une étape dont la cible manque : une garde de tour ne peut donc pas dire qu'un TEXTE
 * a cessé d'être vrai. Le 2026-08-23, une étape a décrit pendant deux jours une interface qui
 * n'existait plus, et la CI est restée verte. Le 2026-08-25, deux autres ont été réécrites avec
 * l'écran qu'elles décrivaient (Story 7.3 : la feuille de compte ; Story 7.7 : l'accueil qui ne
 * garde que le quotidien). La règle vaut pour chaque ligne ci-dessous.
 *
 * Module PUR : aucune dépendance React. Un test passe ces textes aux détecteurs de voix et de
 * prédiction sans rien monter.
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
 *
 * Le tour parle à la première personne : c'est la voix produit d'Anam, celle des textes d'écran,
 * pas une voix d'Anima fabriquée (FR-086). Elle tutoie, au présent, sans prédire (FR-053).
 */
export const ETAPES: readonly EtapeGuide[] = Object.freeze([
  {
    region: "accueil",
    cible: null,
    /* ⚠️ CE TITRE NE RÉPÈTE PAS LE <h2> DE L'ACCUEIL. Le bloc de premier passage s'intitule
       « Trois dimensions » (`render/premier-passage.tsx`), et le tour se joue PRÉCISÉMENT au
       premier passage : deux entêtes de niveau 2 portant le même nom sur le même écran, et un
       lecteur d'écran ne les distingue plus (mesuré le 2026-08-25, quand l'étape s'appelait
       « Trois places, et c'est tout » face à un bloc « Trois places »). On nomme l'étape par ce
       qu'elle dit, « Un lieu, trois dimensions », et la garde compare les titres du tour aux <h2>
       réellement rendus sur l'accueil. */
    titre: "Un lieu, trois dimensions",
    /* La seconde phrase dit où vit le reste (la feuille de compte, Story 7.3) sans l'énumérer :
       « tes nombres, tes données, ton abonnement, l'aide » était la liste de trois-ou-quatre qui
       sent la génération, et « une seule porte, jamais un labyrinthe » la formule creuse. */
    texte:
      "Ce lieu a trois dimensions, et je te les montre une par une. Ton compte, tes données et l’aide sont " +
      "derrière la silhouette en haut à droite.",
  },
  {
    region: "accueil",
    cible: "nav[aria-label='Régions']",
    /* Ce titre est cherché tel quel par `e2e/guide.spec.ts` : il ne bouge pas. */
    titre: "Ta barre",
    /* « À gauche sur un grand écran » est parti : le rail se voit, et la phrase servait surtout à
       faire long. La glisse latérale reste, parce qu'elle ne se devine pas. */
    texte:
      "Les trois dimensions restent à portée de main, en bas sur ton téléphone. Tu peux aussi " +
      "glisser l’écran de côté pour passer de l’une à l’autre.",
  },
  {
    region: "accueil",
    cible: "[class*='bibliotheque'] article",
    /* ⚠️ NI « Aujourd’hui », NI « Ce que le jour propose », NI « L’accueil ». « Aujourd’hui » est
       le nom de la région depuis le 2026-09-02, donc son h1 ; « Ce que le jour propose » est le
       <h2> de la section quotidienne (`render/accueil/Bibliotheque.tsx`) : même raison que pour la
       première étape, un titre d'étape ne doit pas doubler un entête de l'écran. « L’accueil »
       nommait la région sous un nom encore plus ancien (avant « Moi », Story 7.9), et le tour n'a
       pas à rouvrir un second vocabulaire. « Ta journée » reprend les mots du bloc de premier
       passage (« le ciel et le mantra de ta journée »). */
    titre: "Ta journée",
    /* Réécrit avec l'écran le 2026-08-25 (Story 7.7 : l'accueil ne garde que ce qui change), puis
       raccourci le 2026-09-01. « Rien à rattraper si tu passes un jour, rien qui compte tes
       visites » était vrai et rassurant en intention ; en pratique, c'est une double négation qui
       installe l'idée de rattrapage. Le socle est nommé sans guillemets : il s'atteint par les
       portes de « Tes univers », qui mènent toutes à `/socle`. */
    texte:
      "Ici, ce qui change chaque jour : ton ciel, ton mantra. Ton socle, lui, t’attend en entier " +
      "dans tes univers.",
  },
  {
    region: "anam",
    cible: "form, [class*='composeur']",
    titre: "Anam",
    /* « Écris comme tu écrirais à quelqu'un : pas de mots-clés, pas de questions à cocher » était
       l'injonction que le fondateur refuse. La comparaison reste, l'ordre part. La mention d'IA
       est due (elle l'est sur chaque écran d'Anam) et elle est dite à la première personne, comme
       le reste du tour. */
    texte:
      "C’est ici qu’on se parle, comme avec quelqu’un qui t’écoute vraiment. Je suis une " +
      "intelligence artificielle, et je préfère te le dire.",
  },
  {
    region: "arbre",
    cible: "[class*='troncSeul'], [class*='canevas']",
    titre: "Ta graine",
    /* La seconde phrase est celle du fondateur (« au fur et à mesure que tu as des compréhensions,
       l'arbre grandit et évolue avec toi »), reformulée juste assez pour la grammaire. Elle
       remplace « jamais sur l'instant, jamais sans que tu l'aies vu venir », qui décrivait un
       mécanisme de garde (FR-045) là où la personne attend une promesse simple. La garde tient
       le fragment « grandit et évolue avec toi » mot pour mot. */
    texte:
      "Ton arbre commence par une graine : ce qui était déjà là à ta naissance. Au fil de tes " +
      "compréhensions, il grandit et évolue avec toi.",
  },
]);
