/**
 * types.ts — LE MODÈLE DE VUE DE LA HALTE « TON SOCLE » (Story 7.5).
 *
 * ⚠️ POURQUOI CES TYPES SONT REDÉCLARÉS ICI PLUTÔT QU'IMPORTÉS DU DOMAINE.
 *
 * `render/` n'a pas le droit de connaître `lib/domain/` — c'est AD-7/AD-10, et c'est vérifié
 * (`tests/arc-architecture.test.ts`). Le rendu dessine ce qu'on lui donne ; il ne peut pas atteindre
 * la couche qui décide. Même patron exactement que `render/accueil/types.ts` (5.6) et
 * `render/conversation/types.ts` (4.10).
 *
 * Le prix de cette frontière, c'est une forme déclarée des deux côtés — et c'est aussi ce qui en
 * fait une GARDE : `tests/socle-frontiere.test.ts` vérifie que les deux déclarations coïncident, et
 * surtout que **ni l'une ni l'autre** ne gagne un champ capable de porter un compte, une jauge ou un
 * taux de complétude (FR-031, DUR). La leçon de la 4.10 est que le compte fuit par le type ; ici,
 * il n'y a pas de type par où fuir.
 */

/**
 * Le texte d'Anima — union transportée telle quelle depuis `lib/corpus/port`.
 *
 * ⚠️ NE JAMAIS L'APLATIR EN `string | undefined` ICI. Avec un optionnel, un `?? ""` quelque part
 * transformerait « Anima ne l'a pas encore écrit » en « il n'y a rien à dire », et les deux
 * s'afficheraient pareil.
 */
export type TexteVue = { readonly statut: "ecrit"; readonly texte: string } | { readonly statut: "non_ecrit" };

/** Ce qui répare une absence. `null` côté appelant = rien ne la répare, et la page le dit. */
export interface ReparationVue {
  readonly libelle: string;
  readonly url: string;
}

/**
 * Un nombre du socle : son intitulé et sa valeur.
 *
 * ⚠️ PLUS DE `calcul` DEPUIS LE 2026-09-03 (« supprime complètement les calculs »). La preuve ligne
 * à ligne ne traverse plus : un champ qui traverse une frontière sans être rendu finit par être
 * rendu « puisqu'il est là ».
 */
export interface NombreVue {
  readonly cle: string;
  readonly intitule: string;
  readonly valeur: string;
}

export interface FaitVue {
  readonly intitule: string;
  readonly valeur: string;
}

export interface LectureSymboliqueVue {
  readonly cle: string;
  readonly intitule: string;
  readonly texte: string;
}

export interface NombreManquantVue {
  readonly cle: string;
  readonly intitule: string;
  readonly raison: string;
  readonly reparation: ReparationVue | null;
}

export interface PositionVue {
  readonly cle: string;
  readonly intitule: string;
  readonly valeur: string;
  /** `null` = les angles ne sont pas calculables ; la maison n'existe alors pas, elle n'est pas vide. */
  readonly maison: string | null;
  readonly longitude: string | null;
  readonly projection: string | null;
}

export interface AngleVue {
  readonly intitule: string;
  readonly valeur: string;
  readonly longitude: string | null;
  readonly projection: string | null;
}

export interface ManqueVue {
  readonly intitule: string;
  readonly raison: string;
  readonly reparation: ReparationVue | null;
}

/**
 * « Ton ciel du jour » : le titre et le texte de la carte de l'accueil, transportés par la fiche
 * (retour du 2026-09-01 : l'horoscope est la première information de l'univers Astrologie).
 * Pas de date, pas de nombre : la seule forme numérique de cette frontière reste le type.
 */
/** Un texte de modèle et sa mention — voir `render/accueil/types.ts`, même forme et même raison. */
export interface EcritureModeleVue {
  readonly texte: string;
  readonly mention: string;
}

export interface HoroscopeVue {
  readonly titre: string;
  readonly texte: TexteVue;
  /**
   * Le texte écrit par un modèle pour ce ciel, AVEC la mention qui dit d'où il vient (2026-09-02).
   *
   * ⚠️ IL EST À CÔTÉ DE `texte`, PAS DEDANS, et la mention est DANS l'objet, pas à côté. `texte` est
   * ce qu'Anima a écrit ; un rendu qui ne verrait qu'une chaîne ne saurait plus lequel des deux il
   * affiche, et une mention rangée ailleurs est une mention qu'on oublie de rendre.
   */
  readonly ecritureModele: EcritureModeleVue | null;
}

export interface SectionNombresVue {
  readonly indisponible: string | null;
  readonly entrees: readonly FaitVue[];
  readonly conventions: readonly string[];
  readonly nombres: readonly NombreVue[];
  readonly manquants: readonly NombreManquantVue[];
  readonly lecturesSymboliques: readonly LectureSymboliqueVue[];
  /**
   * L'avant-goût de la première lecture, ou `null` quand elle tient en entier (2026-09-03). Le
   * rendu ne le fabrique pas : couper un texte, c'est décider de ce qui se lit, et un `line-clamp`
   * CSS couperait à la largeur de l'écran plutôt qu'au mot (AD-7).
   */
  readonly apercuLecture: string | null;
  readonly noteLectureSymbolique: string | null;
}

export interface SectionCielVue {
  readonly indisponible: string | null;
  readonly projection: {
    readonly titre: string;
    readonly description: string;
    readonly repere: string;
    readonly source: string;
  } | null;
  readonly positions: readonly PositionVue[];
  readonly angles: readonly AngleVue[];
  readonly cuspides: readonly AngleVue[];
  readonly manques: readonly ManqueVue[];
  /** `appel` : la phrase courte de la bulle, en tête ; `aveu` et `ouChercher` : le long, replié dessous. */
  readonly sansHeure: { readonly appel: string; readonly aveu: string; readonly ouChercher: string; readonly reparation: ReparationVue } | null;
  /** `null` = pas de thème, ou pas d'horoscope reçu : le bloc n'existe pas, il n'est pas vide. */
  readonly horoscope: HoroscopeVue | null;
}

export interface SectionTypeVue {
  /**
   * ⚠️ LE TYPE EST UN NOMBRE, ET C'EST LE SEUL DE TOUT CE FICHIER. Ce n'est pas un compte : c'est
   * une identité (le type 4 n'est pas « quatre de quelque chose »). Tout AUTRE champ numérique
   * ajouté ici serait la place où loger une mesure, et `tests/socle-frontiere.test.ts` le refuse.
   */
  readonly type: number | null;
  readonly intitule: string;
  readonly valeur: string | null;
  readonly texte: TexteVue | null;
  readonly absence: { readonly phrase: string; readonly reparation: ReparationVue } | null;
}

export interface PorteVue {
  readonly titre: string;
  readonly quoi: string;
  readonly url: string;
}

export interface ApercuUniversVue {
  readonly cle: "astrologie" | "numerologie" | "psychologie";
  readonly titre: string;
  readonly accroche: string;
  readonly url: string;
  readonly faits: readonly FaitVue[];
}

export interface FicheSocleVue {
  readonly nombres: SectionNombresVue;
  readonly ciel: SectionCielVue;
  readonly type: SectionTypeVue;
  readonly apercus: readonly ApercuUniversVue[];
  readonly portes: readonly PorteVue[];
}
