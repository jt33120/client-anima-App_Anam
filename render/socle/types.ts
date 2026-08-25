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

export interface NombreVue {
  readonly cle: string;
  readonly intitule: string;
  readonly valeur: string;
  readonly texte: TexteVue;
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
}

export interface AngleVue {
  readonly intitule: string;
  readonly valeur: string;
}

export interface ManqueVue {
  readonly intitule: string;
  readonly raison: string;
  readonly reparation: ReparationVue | null;
}

export interface SectionNombresVue {
  readonly indisponible: string | null;
  readonly nombres: readonly NombreVue[];
  readonly manquants: readonly NombreManquantVue[];
}

export interface SectionCielVue {
  readonly indisponible: string | null;
  readonly positions: readonly PositionVue[];
  readonly angles: readonly AngleVue[];
  readonly cuspides: readonly AngleVue[];
  readonly manques: readonly ManqueVue[];
  readonly sansHeure: { readonly aveu: string; readonly ouChercher: string; readonly reparation: ReparationVue } | null;
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

export interface FicheSocleVue {
  readonly nombres: SectionNombresVue;
  readonly ciel: SectionCielVue;
  readonly type: SectionTypeVue;
  readonly portes: readonly PorteVue[];
}
