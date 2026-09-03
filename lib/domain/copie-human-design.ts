import type { Autorite, NomCentre, TypeHumanDesign } from "@/lib/astro/human-design";

/**
 * copie-human-design.ts — LES MOTS DE LA HALTE `/human-design` (2026-09-03).
 *
 * ⚠️ CE N'EST PAS DU CORPUS. Ces chaînes NOMMENT — « Générateur », « Autorité sacrale », « Gorge » —
 * et disent l'état du produit. Ce qu'un type SIGNIFIE vit dans `lib/corpus/human-design.ts`, et
 * c'est Anima qui le reprend. Les deux se rendent dans deux voix différentes : `t-corps` ici,
 * `t-anam` pour le corpus.
 *
 * ⚠️ LE MODULE IMPORTE `lib/astro` POUR SES TYPES SEULEMENT, et c'est ce qui rend les trois tables
 * ci-dessous EXHAUSTIVES par construction : un sixième type ajouté au calcul ne compile pas tant
 * que son intitulé n'est pas écrit. Un `Record` partiel aurait laissé passer un `undefined` jusqu'à
 * l'écran, où il se serait affiché comme un vide sans nom.
 */

export const TITRE_HALTE_HUMAN_DESIGN = "Lire ton dessin";

export const INTRODUCTION_HUMAN_DESIGN =
  "Le Human Design combine des positions du ciel à ta naissance en une carte : un type, une " +
  "autorité, un profil, et des centres définis ou ouverts. C’est une construction symbolique " +
  "récente, pas un résultat de mesure, et cette page le dit à chaque ligne.";

export const LIMITE_HUMAN_DESIGN =
  "Tout ce qui suit est calculé depuis ta date, ton heure et ton lieu de naissance. Rien n’y est " +
  "deviné, rien n’y est écrit par une intelligence artificielle, et le résultat décrit une grille " +
  "de lecture plutôt que toi.";

export const TITRE_TYPE = "Ton type";
export const TITRE_AUTORITE = "Ton autorité";
export const TITRE_PROFIL = "Ton profil";
export const TITRE_CENTRES = "Tes centres définis";

/** Le sous-titre du profil : deux lignes, jamais un couple de nombres sans explication. */
export const LEGENDE_PROFIL_PERSONNALITE = "La ligne consciente, celle de ta naissance.";
export const LEGENDE_PROFIL_DESIGN = "La ligne inconsciente, celle du ciel de ton dessin.";

/** Ce qui s'affiche quand aucun centre n'est défini — le cas du réflecteur, rare mais réel. */
export const AUCUN_CENTRE_DEFINI =
  "Aucun centre n’est défini dans ton dessin. C’est le cas le plus rare du système, et c’est un " +
  "résultat, pas une donnée manquante.";

export const MESSAGE_SANS_TEXTE =
  "Anima n’a pas encore écrit ce qu’elle voit ici. Son texte se posera à cet endroit.";

/**
 * ── LES TROIS ABSENCES, ET POURQUOI ELLES NE SE DISENT PAS PAREIL ─────────────────────────────
 *
 * `heure_inconnue` propose une PORTE (`/heure-naissance`) ; `naissance_absente` en propose une
 * autre (`/naissance`) ; les deux dernières sont des INCIDENTS et n'en proposent aucune. Les
 * confondre ferait proposer un formulaire à quelqu'un qui l'a déjà rempli, ou taire une panne
 * derrière « il te manque une information ».
 */
export const HEURE_MANQUANTE =
  "Le Human Design ne se calcule pas sans ton heure de naissance : une ligne de profil change en " +
  "moins d’une journée, et la Lune traverse deux portes dans le même temps. Plutôt que de te " +
  "montrer un dessin plausible et faux, cette page attend l’heure.";

export const NAISSANCE_MANQUANTE =
  "Ta date de naissance n’est pas encore enregistrée. Sans elle, il n’y a aucun ciel à lire.";

export const CALCUL_INDISPONIBLE =
  "Je n’arrive pas à calculer ton dessin en ce moment. Rien n’est perdu ; reviens un peu plus tard.";

export const BOUTON_AJOUTER_HEURE = "Ajouter mon heure de naissance";
export const BOUTON_AJOUTER_NAISSANCE = "Renseigner ma naissance";

/** Les cinq types, tels qu'ils s'affichent. Exhaustif par le type — voir l'en-tête. */
export const TYPE_LIBELLE: Readonly<Record<TypeHumanDesign, string>> = Object.freeze({
  generateur: "Générateur",
  generateur_manifesteur: "Générateur manifesteur",
  manifesteur: "Manifesteur",
  projecteur: "Projecteur",
  reflecteur: "Réflecteur",
});

/** Les sept autorités. « Ego » se dit « du cœur » : le mot technique n’éclaire personne. */
export const AUTORITE_LIBELLE: Readonly<Record<Autorite, string>> = Object.freeze({
  emotionnelle: "Émotionnelle",
  sacrale: "Sacrale",
  splenique: "Splénique",
  ego: "Du cœur",
  auto_projetee: "Auto-projetée",
  mentale: "Mentale",
  lunaire: "Lunaire",
});

/** Les neuf centres. */
export const CENTRE_LIBELLE: Readonly<Record<NomCentre, string>> = Object.freeze({
  tete: "Tête",
  ajna: "Ajna",
  gorge: "Gorge",
  identite: "Identité",
  coeur: "Cœur",
  sacral: "Sacral",
  rate: "Rate",
  plexus_solaire: "Plexus solaire",
  racine: "Racine",
});

/** Les six lignes du profil, par leur nom traditionnel. */
export const LIGNE_LIBELLE: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, string>> = Object.freeze({
  1: "Investigateur",
  2: "Ermite",
  3: "Martyr",
  4: "Opportuniste",
  5: "Hérétique",
  6: "Modèle",
});
