import type { Tour, TourHistorique } from "./types";

/** Projection éditoriale transmise par la page, aucune dépendance au domaine. */
export interface PratiqueProposeeVue {
  readonly id: string;
  readonly titre: string;
  readonly description: string;
  readonly dureeMinutes: number;
  readonly type: "exercice" | "questionnaire";
  readonly href: string;
}

export const AUCUNE_PRATIQUE: readonly PratiqueProposeeVue[] = [];

export function suffixePratique(pratique: PratiqueProposeeVue): string {
  return `\n\nPratique proposée : [${pratique.titre}](${pratique.href})`;
}

export function toursAvecPratiques(
  historique: readonly TourHistorique[],
  pratiques: readonly PratiqueProposeeVue[],
): Tour[] {
  return historique.flatMap((tour): Tour[] => {
    if (tour.role === "utilisatrice") return [{ ...tour, role: "utilisatrice" }];
    // Le serveur a vérifié la provenance. Une recopie du modèle n'est jamais une action.
    const pratique = pratiques.find((p) => p.id === tour.pratiqueId);
    const parole: Tour = { ...tour, role: "anam", etat: "complet" };
    return pratique
      ? [parole, { id: `pratique:${tour.id}`, role: "pratique", ancreId: tour.id, pratique }]
      : [parole];
  });
}

/** Conserve la proposition dans le contexte du prochain tour, sans canal d'outil côté client. */
export function messagesDuFil(tours: readonly Tour[]): { role: "user" | "assistant"; content: string }[] {
  return tours.flatMap<{ role: "user" | "assistant"; content: string }>((tour) => {
    if (tour.role === "utilisatrice") return [{ role: "user" as const, content: tour.texte }];
    if (tour.role !== "lecture" && (tour.role !== "anam" || tour.etat !== "complet")) return [];
    const proposition = tours.find((t) => t.role === "pratique" && t.ancreId === tour.id);
    return [{
      role: "assistant" as const,
      content: tour.texte + (proposition?.role === "pratique" ? suffixePratique(proposition.pratique) : ""),
    }];
  });
}
