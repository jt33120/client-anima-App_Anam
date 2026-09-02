/**
 * copie-seuil.ts — CE QUE LE SEUIL DIT (retour du fondateur, 2026-09-02).
 *
 * ══ POURQUOI CE FICHIER EXISTE ══════════════════════════════════════════════════════════════════
 *
 * Les trois textes du seuil — le nom, la phrase, la porte — étaient ÉCRITS EN DUR dans
 * `render/scene-dom.tsx`. C'était une infraction ancienne à AD-7/AD-10 : `render/` n'a pas le droit
 * d'importer `lib/domain`, et la copie du produit vit dans `lib/domain/copie-*.ts`, où les gardes de
 * voix (`tests/lexique-voix.test.ts`, `chercherPredictions`, `chercherInterdits`) la trouvent. Une
 * phrase qui vit dans le rendu échappe à ces gardes — c'est exactement ce qui est arrivé à la
 * tagline, qui n'en avait jamais eu une. Elle descend donc d'ici vers la scène par une propriété,
 * comme le tour guidé (`copie-guide.ts`) et le menu de compte (`menu-compte.ts`).
 *
 * ══ LES TROIS RETOURS DU FONDATEUR ══════════════════════════════════════════════════════════════
 *
 *   1. l'image : l'avatar d'Anam qui se remplit d'étoiles, à la place de l'arbre — voir
 *      `render/seuil/AvatarSeuil.tsx` ; ce n'est pas de la copie, mais c'est le même écran ;
 *   2. la phrase : « Ce lieu ne te jugera pas — et ne te flattera pas non plus » disait ce que le
 *      lieu N'EST PAS. Le fondateur veut ce qu'il EST : « un lieu qui t'appartient, un espace
 *      d'échange et d'évolution ». Deux phrases, sans tiret, apostrophe typographique ;
 *   3. la porte : « entrer dans le monde » → « commencer ».
 *
 * ⚠️ AUCUNE SALUTATION D'HEURE (QA visuelle du 2026-08-19, M4). « Bonsoir » avait été relevé à
 * 10 h du matin : le serveur est en UTC et ne connaît pas l'heure de l'utilisatrice. Une salutation
 * fausse sur le tout premier écran dit à quelqu'un que le lieu ne le regarde pas.
 *
 * ⚠️ « commencer » EST EN BAS DE CASSE, ET CE N'EST PAS UNE FAUTE. La porte du seuil est une
 * « invitation basse » (`.affordance`, monde.module.css) : jamais un bouton criard. Le bouton
 * « Commencer » de l'ennéagramme porte une capitale parce que c'est un autre écran, avec une autre
 * grammaire — ne pas l'aligner sur lui.
 *
 * Module PUR : aucune dépendance. Un test peut passer ces textes aux détecteurs de voix sans monter
 * quoi que ce soit.
 */

/** Le nom du lieu — le h1 du seuil, cible du focus quand la région s'active. */
export const TITRE_SEUIL = "Anam";

/**
 * La phrase sous le nom. Ce que le lieu est, pas ce qu'il n'est pas : un lieu à soi, un espace
 * d'échange, de compréhension et d'évolution. Deux phrases courtes, aucun tiret — la voix du produit
 * n'en pose jamais (voir le corpus : « zéro tiret »).
 */
export const TAGLINE_SEUIL =
  "Un lieu qui t’appartient. Un espace pour échanger, comprendre et évoluer.";

/** La porte. Bas de casse : c'est la convention de l'invitation basse du seuil. */
export const ACTION_SEUIL = "commencer";

/**
 * Le nom accessible de l'avatar — SOBRE et NON-RÉVÉLATEUR, comme les autres apparitions d'Anam
 * (`ApparitionAnam.tsx`). Il ne décrit pas le personnage : l'image est une présence, pas une
 * information, et un lecteur d'écran n'a pas à en recevoir une description que l'œil ne lit pas.
 */
export const ALT_AVATAR_SEUIL = "Illustration nocturne";
