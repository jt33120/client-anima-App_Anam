/** Projection lisible du suivi. Aucun modèle ni dépôt ne traverse cette frontière de rendu. */
export interface ReperesParcoursVue {
  readonly ceQuiCompte: string;
  readonly ceQuiAide: string;
  readonly aRespecter: string;
}

export interface SuiviParcoursVue {
  readonly revision: number;
  readonly pause: boolean;
  readonly cap: string;
  readonly synthese: string;
  readonly reperes: ReperesParcoursVue;
  readonly etapes: readonly { readonly id: string; readonly titre: string; readonly pratiqueId: string | null }[];
  readonly niveauArbre: number;
  readonly majLe: string;
  readonly evenements: readonly {
    readonly id: string;
    readonly type: "ajuster" | "avancer";
    readonly resume: string;
    readonly titreEtape: string | null;
    readonly niveauArbre: number;
    readonly creeLe: string;
  }[];
}

export interface PratiqueParcoursVue {
  readonly id: string;
  readonly titre: string;
  readonly href: string;
}
