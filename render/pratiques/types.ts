/** Contrat de rendu : les pages choisissent le catalogue, le lecteur ne lit aucune donnée. */
export interface PratiqueVue {
  readonly id: string;
  readonly titre: string;
  readonly description: string;
  readonly dureeMinutes: number;
  readonly type: "exercice" | "questionnaire";
  readonly intention: "apaiser" | "observer" | "avancer" | "se-connaitre";
  readonly href: string;
  readonly sources: readonly { readonly titre: string; readonly url: string }[];
  readonly etapes?: readonly {
    readonly titre: string;
    readonly consigne: string;
    readonly dureeSecondes?: number;
  }[];
  readonly precaution: string;
}
