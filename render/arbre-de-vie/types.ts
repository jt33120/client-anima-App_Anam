/**
 * types.ts — LE MODÈLE DE VUE DE LA HALTE « TON ARBRE DE VIE ».
 *
 * ⚠️ REDÉCLARÉ, PAS IMPORTÉ. `render/` n'a le droit d'importer NI `lib/domain`, NI `lib/corpus`, NI
 * `lib/data` (AD-7/AD-10) : le rendu dessine ce qu'on lui donne, il ne peut pas atteindre la couche
 * qui décide. `tests/arbre-de-vie-frontiere.test.ts` apparie les deux formes CHAMP POUR CHAMP, et
 * refuse des deux côtés tout champ dont le nom porte une mesure.
 *
 * ⚠️ ZÉRO CHAMP NUMÉRIQUE DANS TOUTE CETTE FRONTIÈRE, et c'est plus strict que le socle — lui garde
 * un `type: number` parce qu'un type d'ennéagramme est une identité. Ici, chaque nombre traverse
 * DÉJÀ mis en mots (`valeur: string`) : il n'y a aucun `number` par où un compte pourrait entrer,
 * et le test l'exige littéralement.
 *
 * ⚠️ ET SURTOUT : LE NOMBRE DE LETTRES D'UN NOM NE TRAVERSE PAS. Les neuf qualités arrivent en
 * énumération déjà mise en mots (`presence`). « quatre fois » ou « 4 sur 9 » referait, sur le nom
 * de quelqu'un, la grille de scores que FR-031 refuse.
 */

/** ⚠️ NE JAMAIS APLATIR EN `string | null` : un `?? ""` ferait de « pas encore écrit » un vide. */
export type TexteVue =
  | { readonly statut: "ecrit"; readonly texte: string }
  | { readonly statut: "non_ecrit" };

export interface ReparationVue {
  readonly libelle: string;
  readonly url: string;
}

export interface ManqueVue {
  readonly raison: string;
  readonly reparation: ReparationVue | null;
}

export interface PartieArbreVue {
  readonly cle: string;
  readonly ancre: string;
  readonly intitule: string;
  readonly role: string;
  readonly origine: string;
  readonly valeur: string | null;
  readonly archetype: string | null;
  readonly texte: TexteVue | null;
  readonly manque: ManqueVue | null;
}

export interface DefiVue {
  readonly cle: string;
  readonly intitule: string;
  readonly valeur: string;
  readonly origine: string;
  readonly texte: TexteVue;
}

export interface QualiteVue {
  readonly cle: string;
  readonly intitule: string;
  readonly valeur: string;
  readonly lettres: string;
  readonly presence: string;
  readonly texte: TexteVue;
}

export interface PastilleVue {
  readonly cle: string;
  readonly ancre: string;
  readonly intitule: string;
  readonly valeur: string | null;
}

export interface FicheArbreDeVieVue {
  readonly indisponible: string | null;
  readonly porteIndisponible: ReparationVue | null;
  readonly pastilles: readonly PastilleVue[];
  readonly triangle: readonly PartieArbreVue[];
  readonly comportement: readonly PartieArbreVue[];
  readonly dynamique: PartieArbreVue | null;
  readonly defis: readonly DefiVue[];
  readonly qualites: readonly QualiteVue[];
  readonly manqueQualites: ManqueVue | null;
  readonly cheminDeVie: PartieArbreVue | null;
  readonly porteNombres: ReparationVue | null;
  readonly conventions: readonly string[];
}

/**
 * La copie de la halte, descendue par la page serveur. Le rendu n'en fabrique aucune phrase — pas
 * même celle du silence du corpus, qui est la plus facile à écrire en dur et la plus grave à
 * inventer : elle parle au nom d'Anima (FR-086).
 */
export interface CopieArbreDeVieVue {
  readonly surtitre: string;
  readonly introduction: string;
  readonly distinction: string;
  readonly titreSchema: string;
  readonly descriptionSchema: string;
  readonly titreTriangle: string;
  readonly introductionTriangle: string;
  readonly titreComportement: string;
  readonly introductionComportement: string;
  readonly titreDynamique: string;
  readonly titreDefis: string;
  readonly introductionDefis: string;
  readonly titreQualites: string;
  readonly introductionQualites: string;
  readonly titreCheminDeVie: string;
  readonly titreMethode: string;
  readonly texteNonEcrit: string;
}
